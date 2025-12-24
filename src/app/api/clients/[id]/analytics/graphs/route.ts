import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse, parseGSClientID } from '@/lib/utils/apiUtils';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';
import { getServiceLineMappings } from '@/lib/cache/staticDataCache';
import { calculateWIPBalances, categorizeTransaction } from '@/lib/services/clients/clientBalanceCalculation';
import { calculateOpeningBalanceFromAggregates } from '@/lib/services/analytics/openingBalanceCalculator';
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
 * Get daily transaction metrics for the last 12 months
 * 
 * Returns:
 * - Daily aggregated metrics (Production, Adjustments, Disbursements, Billing)
 * - Based on WIPTransactions table
 * - Time period: Last 12 months from current date
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

    // Check cache first (before DB queries)
    const cacheKey = `${CACHE_PREFIXES.ANALYTICS}graphs:${GSClientID}:${queryParams.resolution}`;
    const cached = await cache.get<GraphDataResponse>(cacheKey);
    if (cached) {
      // Audit log for analytics access
      logger.info('Client analytics graphs accessed (cached)', {
        userId: user.id,
        GSClientID,
        resolution: queryParams.resolution,
      });
      
      const response = NextResponse.json(successResponse(cached));
      response.headers.set('Cache-Control', 'no-store'); // User-specific analytics
      return response;
    }

    // Calculate date range - last 12 months (reduced from 24 for performance)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    // PARALLEL QUERY BATCH: Fetch client and service line mappings simultaneously
    const [client, servLineToMasterMap] = await Promise.all([
      prisma.client.findUnique({
        where: { GSClientID },
        select: {
          id: true,
          GSClientID: true,
          clientCode: true,
          clientNameFull: true,
        },
      }),
      getServiceLineMappings(),
    ]);

    if (!client) {
      throw new AppError(404, 'Client not found', ErrorCodes.NOT_FOUND);
    }

    // Build where clause for WIPTransactions
    // Query by GSClientID only - all WIP transactions are properly linked to clients
    // Uses composite index: idx_wip_gsclientid_trandate_ttype for optimal performance
    const wipWhereClause = {
      GSClientID,
      TranDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Fetch opening balance transactions (before the 12-month period)
    const openingWhereClause = {
      GSClientID,
      TranDate: {
        lt: startDate,
      },
    };

    // PARALLEL QUERY BATCH: Fetch opening balance aggregates and current period transactions simultaneously
    // OPTIMIZATION: Use database aggregation for opening balance instead of fetching all records
    const [openingBalanceAggregates, transactions] = await Promise.all([
      prisma.wIPTransactions.groupBy({
        by: ['TType', 'TranType'],
        where: openingWhereClause,
        _sum: {
          Amount: true,
        },
      }),
      prisma.wIPTransactions.findMany({
        where: wipWhereClause,
        select: {
          TranDate: true,
          TType: true,
          TranType: true, // Needed for transaction categorization
          Amount: true,
          TaskServLine: true,
        },
        orderBy: {
          TranDate: 'asc',
        },
        take: 50000, // Prevent unbounded queries - reasonable limit for 12 months of data
      }),
    ]);

    // Warn if transaction limits are hit
    if (transactions.length >= 50000) {
      logger.warn('Period transactions limit reached', {
        GSClientID,
        clientCode: client.clientCode,
        limit: 50000,
        dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        message: 'Some transaction data may be excluded',
      });
    }

    // Calculate opening WIP balance from aggregates (much faster than processing individual records)
    const openingWipBalance = calculateOpeningBalanceFromAggregates(openingBalanceAggregates);

    // Helper function to aggregate transactions
    const aggregateTransactions = (txns: typeof transactions, openingBalance: number = 0) => {
      const dailyMap = new Map<string, DailyMetrics>();
      let totalProduction = 0;
      let totalAdjustments = 0;
      let totalDisbursements = 0;
      let totalBilling = 0;
      let totalProvisions = 0;

      txns.forEach((txn, idx) => {
        const amount = txn.Amount || 0;
        const dateKey = txn.TranDate.toISOString().split('T')[0] as string; // YYYY-MM-DD (always defined)
        
        // Get or create daily entry
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, {
            date: dateKey,
            production: 0,
            adjustments: 0,
            disbursements: 0,
            billing: 0,
            provisions: 0,
            wipBalance: 0,
          });
        }
        
        const daily = dailyMap.get(dateKey)!; // Safe to assert - we just created it if it didn't exist

        // Categorize using shared logic (same as profitability tab)
        // This ensures consistency between graphs and profitability data
        const category = categorizeTransaction(txn.TType, txn.TranType);


        if (category.isTime) {
          daily.production += amount;
          totalProduction += amount;
        } else if (category.isAdjustment) {
          daily.adjustments += amount;
          totalAdjustments += amount;
        } else if (category.isDisbursement) {
          daily.disbursements += amount;
          totalDisbursements += amount;
        } else if (category.isFee) {
          // NOW catches 'F', 'FEE', and any fee variants
          daily.billing += amount;
          totalBilling += amount;
        } else if (category.isProvision) {
          daily.provisions += amount;
          totalProvisions += amount;
        }
        // No default case needed - categorization is comprehensive
      });

      // Convert map to sorted array
      const sortedDailyMetrics = Array.from(dailyMap.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      );

      // Calculate cumulative WIP balance for each day
      // Start from opening balance (WIP balance at the beginning of the period)
      // WIP Balance = Opening Balance + Production + Adjustments + Disbursements + Provisions - Billing
      let cumulativeBalance = openingBalance;
      const dailyMetrics = sortedDailyMetrics.map((daily) => {
        const dailyWipChange = daily.production + daily.adjustments + daily.disbursements + daily.provisions - daily.billing;
        cumulativeBalance += dailyWipChange;
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

    // Aggregate overall data with opening balance
    const overall = aggregateTransactions(transactions, openingWipBalance);


    // Group transactions by Master Service Line
    const transactionsByMasterServiceLine = new Map<string, typeof transactions>();
    transactions.forEach((txn) => {
      const masterCode = servLineToMasterMap.get(txn.TaskServLine) || 'UNKNOWN';
      const existing = transactionsByMasterServiceLine.get(masterCode) || [];
      existing.push(txn);
      transactionsByMasterServiceLine.set(masterCode, existing);
    });

    // Aggregate by Master Service Line with opening balances
    // Note: Using overall opening balance since we aggregate at database level for performance
    const byMasterServiceLine: Record<string, ServiceLineGraphData> = {};
    transactionsByMasterServiceLine.forEach((txns, masterCode) => {
      byMasterServiceLine[masterCode] = aggregateTransactions(txns, openingWipBalance);
    });

    // Fetch Master Service Line names
    const masterServiceLines = await prisma.serviceLineMaster.findMany({
      where: {
        code: {
          in: Array.from(transactionsByMasterServiceLine.keys()).filter(code => code !== 'UNKNOWN'),
        },
      },
      select: {
        code: true,
        name: true,
      },
      take: 100,
    });

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
      masterServiceLines: masterServiceLines.map(msl => ({
        code: msl.code,
        name: msl.name,
      })),
    };

    // Cache for 2 hours (7200 seconds) - increased for better performance
    await cache.set(cacheKey, responseData, 7200);

    // Audit log for analytics access
    logger.info('Client analytics graphs generated', {
      userId: user.id,
      GSClientID: client.GSClientID,
      clientCode: client.clientCode,
      resolution: queryParams.resolution,
      transactionCount: transactions.length,
      dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    });

    const response = NextResponse.json(successResponse(responseData));
    response.headers.set('Cache-Control', 'no-store'); // User-specific analytics
    return response;
  },
});
