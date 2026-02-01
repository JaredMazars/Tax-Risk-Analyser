import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';
import { executeGroupGraphData } from '@/lib/services/reports/storedProcedureService';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

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
  groupCode: string;
  groupDesc: string;
  clientCount: number;
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
 * GET /api/groups/[groupCode]/analytics/graphs
 * Get daily transaction metrics for all clients in the group for the last 12 months
 * 
 * Returns:
 * - Daily aggregated metrics (Production, Adjustments, Disbursements, Billing)
 * - Based on WIPTransactions table aggregated across all clients in the group
 * - Time period: Last 12 months from current date
 */
export const GET = secureRoute.queryWithParams<{ groupCode: string }>({
  feature: Feature.ACCESS_CLIENTS,
  handler: async (request, { user, params }) => {
    try {
      const { groupCode } = params;
      
      // Validate query parameters
      const { searchParams } = new URL(request.url);
      const queryParams = GraphsQuerySchema.parse({
        resolution: searchParams.get('resolution') ?? undefined, // Convert null to undefined for Zod default to work
      });
      const targetPoints = queryParams.resolution === 'high' ? 365 : queryParams.resolution === 'low' ? 60 : 120;

    // Check cache first (before DB queries)
    const cacheKey = `${CACHE_PREFIXES.ANALYTICS}graphs:group:${groupCode}:${queryParams.resolution}`;
    const cached = await cache.get<GraphDataResponse>(cacheKey);
    if (cached) {
      // Audit log for analytics access
      logger.info('Group analytics graphs accessed (cached)', {
        userId: user.id,
        groupCode,
        resolution: queryParams.resolution,
        clientCount: cached.clientCount,
      });
      
      const response = NextResponse.json(successResponse(cached));
      response.headers.set('Cache-Control', 'no-store'); // User-specific analytics
      return response;
    }

    // Calculate date range first (no DB query needed)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12); // Reduced from 24 to 12 months for performance

    // Get group info and client count
    const [groupInfo, clientCount] = await Promise.all([
      prisma.client.findFirst({
        where: { groupCode },
        select: {
          groupCode: true,
          groupDesc: true,
        },
      }),
      prisma.client.count({
        where: { groupCode },
      }),
    ]);

    if (!groupInfo || clientCount === 0) {
      throw new AppError(404, 'Group not found or no clients', ErrorCodes.NOT_FOUND);
    }

    // Log query parameters for debugging
    logger.info('Group graphs query started', {
      groupCode,
      clientCount,
      dateRange: { startDate, endDate },
    });

    // Execute stored procedure to get graph data
    const spResults = await executeGroupGraphData({
      groupCode,
      dateFrom: startDate,
      dateTo: endDate,
      servLineCode: undefined, // No filtering, get all service lines
    });

    // Log SP execution results
    logger.info('Group graphs data fetched from SP', {
      groupCode,
      resultCount: spResults.length,
      dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    });

    // Transform SP results to DailyMetrics format
    // Group by masterCode and date
    const overallDailyMap = new Map<string, DailyMetrics>();
    const byMasterServiceLineMap = new Map<string, Map<string, DailyMetrics>>();
    const masterServiceLinesMap = new Map<string, string>(); // code -> name (proper deduplication)
    
    let overallOpeningBalance = 0;
    const openingBalancesByServiceLine = new Map<string, number>();

    spResults.forEach((row) => {
      const dateKey = row.TranDate.toISOString().split('T')[0]!;
      const masterCode = row.masterCode || 'UNKNOWN';
      
      // Store opening balance (same for all rows from SP)
      if (overallOpeningBalance === 0) {
        overallOpeningBalance = row.OpeningBalance;
      }
      
      // Track opening balance per service line (first row for each masterCode)
      if (!openingBalancesByServiceLine.has(masterCode)) {
        openingBalancesByServiceLine.set(masterCode, row.OpeningBalance);
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
      overallDaily.production += row.Production;
      overallDaily.adjustments += row.Adjustments;
      overallDaily.disbursements += row.Disbursements;
      overallDaily.billing += row.Billing;
      overallDaily.provisions += row.Provisions;

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
      serviceLineDaily.production += row.Production;
      serviceLineDaily.adjustments += row.Adjustments;
      serviceLineDaily.disbursements += row.Disbursements;
      serviceLineDaily.billing += row.Billing;
      serviceLineDaily.provisions += row.Provisions;
    });

    // Helper function to calculate cumulative WIP and summaries
    const finalizeDailyMetrics = (dailyMap: Map<string, DailyMetrics>, openingBalance: number): ServiceLineGraphData => {
      const sortedMetrics = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      
      let cumulativeBalance = openingBalance;
      let totalProduction = 0;
      let totalAdjustments = 0;
      let totalDisbursements = 0;
      let totalBilling = 0;
      let totalProvisions = 0;

      const dailyMetrics = sortedMetrics.map((daily) => {
        const dailyWipChange = daily.production + daily.adjustments + daily.disbursements + daily.provisions - daily.billing;
        cumulativeBalance += dailyWipChange;
        
        totalProduction += daily.production;
        totalAdjustments += daily.adjustments;
        totalDisbursements += daily.disbursements;
        totalBilling += daily.billing;
        totalProvisions += daily.provisions;

        return {
          ...daily,
          wipBalance: cumulativeBalance,
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
      groupCode: groupInfo.groupCode,
      groupDesc: groupInfo.groupDesc,
      clientCount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      overall: downsampledOverall,
      byMasterServiceLine: downsampledByMasterServiceLine,
      masterServiceLines,
    };

    // Cache for 10 minutes (600 seconds) - balance between performance and data freshness
    await cache.set(cacheKey, responseData, 600);

    // Audit log for analytics access
    logger.info('Group analytics graphs generated', {
      userId: user.id,
      groupCode,
      resolution: queryParams.resolution,
      clientCount,
      spResultCount: spResults.length,
      dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    });

    const response = NextResponse.json(successResponse(responseData));
    response.headers.set('Cache-Control', 'no-store'); // User-specific analytics
    return response;
    } catch (error) {
      throw error;
    }
  },
});

