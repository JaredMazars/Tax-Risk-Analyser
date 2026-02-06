import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse, parseGSClientID } from '@/lib/utils/apiUtils';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';
import { executeClientGraphData } from '@/lib/services/reports/storedProcedureService';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import { getCurrentFiscalPeriod, getFiscalYearRange } from '@/lib/utils/fiscalPeriod';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

/**
 * Convert Prisma Decimal or string to JavaScript number
 * SQL Server decimals come back as Decimal objects or strings from Prisma
 */
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  // Handle Prisma.Decimal objects
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  // Fallback
  return Number(value) || 0;
}

interface DailyMetrics {
  date: string; // YYYY-MM-DD format
  production: number;
  adjustments: number;
  disbursements: number;
  billing: number;
  provisions: number;
  wipBalance: number;
}

interface ServiceLineGraphData {
  dailyMetrics: DailyMetrics[];
  summary: {
    totalProduction: number;
    totalAdjustments: number;
    totalDisbursements: number;
    totalBilling: number;
    totalProvisions: number;
    currentWipBalance: number;
  };
}

interface MasterServiceLineInfo {
  code: string;
  name: string;
}

interface GraphDataResponse {
  GSClientID: string;
  clientCode: string;
  clientName: string | null;
  startDate: string;
  endDate: string;
  overall: ServiceLineGraphData;
  byMasterServiceLine: Record<string, ServiceLineGraphData>;
  masterServiceLines: MasterServiceLineInfo[];
}

// Query parameter validation schema
const GraphsQuerySchema = z.object({
  resolution: z.enum(['high', 'standard', 'low']).optional().default('low'), // Changed to 'low' for better performance
});

/**
 * Downsample daily metrics to reduce payload size while maintaining visual fidelity
 * Uses smart downsampling that preserves all non-zero data points
 * @param metrics Array of daily metrics
 * @param targetPoints Target number of data points (default: 120 for ~4 months of daily data)
 * @returns Downsampled array
 */
function downsampleDailyMetrics(metrics: DailyMetrics[], targetPoints: number = 120): DailyMetrics[] {
  if (metrics.length <= targetPoints) {
    return metrics;
  }
  
  // Separate metrics into zero and non-zero groups
  const nonZeroMetrics: DailyMetrics[] = [];
  const zeroMetrics: { metric: DailyMetrics; index: number }[] = [];
  
  metrics.forEach((metric, index) => {
    const hasData = 
      metric.production !== 0 ||
      metric.adjustments !== 0 ||
      metric.disbursements !== 0 ||
      metric.billing !== 0 ||
      metric.provisions !== 0;
    
    if (hasData) {
      nonZeroMetrics.push(metric);
    } else {
      zeroMetrics.push({ metric, index });
    }
  });
  
  // Always include all non-zero metrics (these are critical data points)
  const result = [...nonZeroMetrics];
  
  // Calculate how many zero points we can include
  const remainingSlots = targetPoints - nonZeroMetrics.length;
  
  if (remainingSlots > 0 && zeroMetrics.length > 0) {
    // Sample zero metrics evenly to fill remaining slots
    const step = Math.ceil(zeroMetrics.length / remainingSlots);
    for (let i = 0; i < zeroMetrics.length; i += step) {
      const zeroMetric = zeroMetrics[i];
      if (zeroMetric) {
        result.push(zeroMetric.metric);
      }
    }
  }
  
  // Sort by date to maintain chronological order
  result.sort((a, b) => a.date.localeCompare(b.date));
  
  return result;
}

/**
 * GET /api/clients/[id]/analytics/graphs
 * Get daily transaction metrics for specified time period
 * 
 * Query Parameters:
 * - fiscalYear: number (optional) - Fiscal year filter
 * - mode: 'fiscal' | 'custom' (optional, defaults to 'fiscal')
 * - startDate: ISO date string (optional) - For custom date range
 * - endDate: ISO date string (optional) - For custom date range
 * - resolution: 'high' | 'standard' | 'low' (optional, defaults to 'low')
 * 
 * Returns:
 * - Daily aggregated metrics (Production, Adjustments, Disbursements, Billing, Provisions, WIP Balance)
 * - Overall and by-service-line breakdowns
 * - Time period: Defaults to current fiscal year, or "All" if no fiscalYear provided
 * 
 * Note: Uses sp_ClientGraphData stored procedure for efficient aggregation
 */
export const GET = secureRoute.queryWithParams({
  feature: Feature.ACCESS_CLIENTS,
  handler: async (request, { user, params }) => {
    // Parse and validate GSClientID
    const GSClientID = parseGSClientID(params.id);
    
    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = GraphsQuerySchema.parse({
      resolution: searchParams.get('resolution') ?? undefined, // Convert null to undefined for Zod default to work
    });
    const targetPoints = queryParams.resolution === 'high' ? 365 : queryParams.resolution === 'low' ? 60 : 120;

    // Parse fiscal year and date range parameters
    const fiscalYearParam = searchParams.get('fiscalYear');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const mode = (searchParams.get('mode') || 'fiscal') as 'fiscal' | 'custom';

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    if (mode === 'custom' && startDateParam && endDateParam) {
      // Custom date range
      startDate = startOfMonth(parseISO(startDateParam));
      endDate = endOfMonth(parseISO(endDateParam));
    } else if (fiscalYearParam) {
      // Specific fiscal year
      const fiscalYear = parseInt(fiscalYearParam, 10);
      const range = getFiscalYearRange(fiscalYear);
      startDate = range.start;
      endDate = range.end;
    } else {
      // All-time data (null fiscalYear = "All" button) or current fiscal year default
      const currentFY = getCurrentFiscalPeriod().fiscalYear;
      const range = getFiscalYearRange(currentFY);
      startDate = range.start;
      endDate = range.end;
    }

    // Check cache first (before DB queries) - include fiscal parameters in cache key
    const cacheKey = `${CACHE_PREFIXES.ANALYTICS}graphs:${GSClientID}:${queryParams.resolution}:${mode}:${fiscalYearParam || 'current'}:${startDateParam || ''}:${endDateParam || ''}`;
    const cached = await cache.get<GraphDataResponse>(cacheKey);
    if (cached) {
      // Audit log for analytics access
      logger.info('Client analytics graphs accessed (cached)', {
        userId: user.id,
        GSClientID,
        resolution: queryParams.resolution,
        mode,
        fiscalYear: fiscalYearParam,
      });
      
      const response = NextResponse.json(successResponse(cached));
      response.headers.set('Cache-Control', 'no-store'); // User-specific analytics
      return response;
    }

    // Fetch client info for response
    const client = await prisma.client.findUnique({
      where: { GSClientID },
      select: {
        id: true,
        GSClientID: true,
        clientCode: true,
        clientNameFull: true,
      },
    });

    if (!client) {
      throw new AppError(404, 'Client not found', ErrorCodes.NOT_FOUND);
    }

    // Execute stored procedure to get graph data
    const spResults = await executeClientGraphData({
      GSClientID,
      dateFrom: startDate,
      dateTo: endDate,
      servLineCode: undefined, // No filtering, get all service lines
    });

    // Log SP execution results
    logger.info('Client graphs data fetched from SP', {
      GSClientID,
      clientCode: client.clientCode,
      resultCount: spResults.length,
      dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    });

    // Transform SP results to DailyMetrics format
    // Group by masterCode and date
    const overallDailyMap = new Map<string, DailyMetrics>();
    const byMasterServiceLineMap = new Map<string, Map<string, DailyMetrics>>();
    const masterServiceLinesMap = new Map<string, string>(); // code -> name (proper deduplication)
    
    // Initialize with explicit 0 to prevent NaN
    let overallOpeningBalance = 0;
    const openingBalancesByServiceLine = new Map<string, number>();

    spResults.forEach((row) => {
      const dateKey = row.TranDate.toISOString().split('T')[0]!;
      const masterCode = row.masterCode || 'UNKNOWN';
      
      // Store opening balance with proper number conversion (same for all rows from SP)
      if (overallOpeningBalance === 0) {
        overallOpeningBalance = toNumber(row.OpeningBalance);
      }
      
      // Track opening balance per service line with proper number conversion (first row for each masterCode)
      if (!openingBalancesByServiceLine.has(masterCode)) {
        openingBalancesByServiceLine.set(masterCode, toNumber(row.OpeningBalance));
      }

      // Track master service lines (Map ensures deduplication by code)
      if (row.masterCode && row.masterServiceLineName) {
        masterServiceLinesMap.set(row.masterCode, row.masterServiceLineName);
      }

      // Aggregate for overall
      if (!overallDailyMap.has(dateKey)) {
        overallDailyMap.set(dateKey, {
          date: dateKey,
          production: 0,
          adjustments: 0,
          disbursements: 0,
          billing: 0,
          provisions: 0,
          wipBalance: 0,
        });
      }
      const overallDaily = overallDailyMap.get(dateKey)!;
      overallDaily.production += toNumber(row.Production);
      overallDaily.adjustments += toNumber(row.Adjustments);
      overallDaily.disbursements += toNumber(row.Disbursements);
      overallDaily.billing += toNumber(row.Billing);
      overallDaily.provisions += toNumber(row.Provisions);

      // Aggregate by master service line
      if (!byMasterServiceLineMap.has(masterCode)) {
        byMasterServiceLineMap.set(masterCode, new Map());
      }
      const serviceLineMap = byMasterServiceLineMap.get(masterCode)!;
      if (!serviceLineMap.has(dateKey)) {
        serviceLineMap.set(dateKey, {
          date: dateKey,
          production: 0,
          adjustments: 0,
          disbursements: 0,
          billing: 0,
          provisions: 0,
          wipBalance: 0,
        });
      }
      const serviceLineDaily = serviceLineMap.get(dateKey)!;
      serviceLineDaily.production += toNumber(row.Production);
      serviceLineDaily.adjustments += toNumber(row.Adjustments);
      serviceLineDaily.disbursements += toNumber(row.Disbursements);
      serviceLineDaily.billing += toNumber(row.Billing);
      serviceLineDaily.provisions += toNumber(row.Provisions);
    });

    // Helper function to calculate cumulative WIP and summaries
    const finalizeDailyMetrics = (dailyMap: Map<string, DailyMetrics>, openingBalance: number): ServiceLineGraphData => {
      const sortedMetrics = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      
      let cumulativeBalance = openingBalance || 0; // Ensure starting balance is never NaN
      let totalProduction = 0;
      let totalAdjustments = 0;
      let totalDisbursements = 0;
      let totalBilling = 0;
      let totalProvisions = 0;

      const dailyMetrics = sortedMetrics.map((daily) => {
        // Ensure all values are numbers (not null/undefined)
        const production = daily.production || 0;
        const adjustments = daily.adjustments || 0;
        const disbursements = daily.disbursements || 0;
        const billing = daily.billing || 0;
        const provisions = daily.provisions || 0;
        
        const dailyWipChange = production + adjustments + disbursements + provisions - billing;
        cumulativeBalance += dailyWipChange;
        
        // Accumulate totals with null safety
        totalProduction += production;
        totalAdjustments += adjustments;
        totalDisbursements += disbursements;
        totalBilling += billing;
        totalProvisions += provisions;

        return {
          ...daily,
          wipBalance: cumulativeBalance || 0, // Ensure never NaN
        };
      });

      return {
        dailyMetrics,
        summary: {
          totalProduction,
          totalAdjustments,
          totalDisbursements,
          totalBilling,
          totalProvisions,
          currentWipBalance: cumulativeBalance,
        },
      };
    };

    // Log WIP calculation details for debugging
    logger.debug('Graph WIP calculation', {
      openingBalance: overallOpeningBalance,
      openingBalanceType: typeof overallOpeningBalance,
      firstRowOpeningBalance: spResults[0]?.OpeningBalance,
      firstRowOpeningBalanceType: typeof spResults[0]?.OpeningBalance,
      firstRowProduction: spResults[0]?.Production,
      firstRowProductionType: typeof spResults[0]?.Production,
      spResultCount: spResults.length,
      dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    });

    // Finalize overall data
    const overall = finalizeDailyMetrics(overallDailyMap, overallOpeningBalance);

    // Finalize by master service line
    const byMasterServiceLine: Record<string, ServiceLineGraphData> = {};
    byMasterServiceLineMap.forEach((dailyMap, masterCode) => {
      const serviceLineOpeningBalance = openingBalancesByServiceLine.get(masterCode) || 0;
      byMasterServiceLine[masterCode] = finalizeDailyMetrics(dailyMap, serviceLineOpeningBalance);
    });

    // Convert master service lines map to array
    const masterServiceLines = Array.from(masterServiceLinesMap.entries()).map(([code, name]) => ({
      code,
      name,
    }));

    // Apply downsampling to reduce payload size
    const downsampledOverall = {
      ...overall,
      dailyMetrics: downsampleDailyMetrics(overall.dailyMetrics, targetPoints),
    };
    
    const downsampledByMasterServiceLine: Record<string, ServiceLineGraphData> = {};
    Object.entries(byMasterServiceLine).forEach(([code, data]) => {
      downsampledByMasterServiceLine[code] = {
        ...data,
        dailyMetrics: downsampleDailyMetrics(data.dailyMetrics, targetPoints),
      };
    });

    const responseData: GraphDataResponse = {
      GSClientID: client.GSClientID,
      clientCode: client.clientCode,
      clientName: client.clientNameFull,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      overall: downsampledOverall,
      byMasterServiceLine: downsampledByMasterServiceLine,
      masterServiceLines, // Already in correct format
    };

    // Cache for 10 minutes (600 seconds) - balance between performance and data freshness
    await cache.set(cacheKey, responseData, 600);

    // Audit log for analytics access
    logger.info('Client analytics graphs generated', {
      userId: user.id,
      GSClientID: client.GSClientID,
      clientCode: client.clientCode,
      resolution: queryParams.resolution,
      mode,
      fiscalYear: fiscalYearParam,
      spResultCount: spResults.length,
      dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      currentWipBalance: overall.summary.currentWipBalance,
    });

    const response = NextResponse.json(successResponse(responseData));
    response.headers.set('Cache-Control', 'no-store'); // User-specific analytics
    return response;
  },
});
