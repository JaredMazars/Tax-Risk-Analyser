import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'groups/[groupCode]/analytics/graphs/route.ts:122',message:'Handler entry',data:{groupCode:params.groupCode,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
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

    // BATCH 1: Get group info and clients in parallel
    const [groupInfo, clients] = await Promise.all([
      prisma.client.findFirst({
        where: { groupCode },
        select: {
          groupCode: true,
          groupDesc: true,
        },
      }),
      prisma.client.findMany({
        where: { groupCode },
        select: { GSClientID: true },
        take: 10000, // Reasonable upper bound for group size
      }),
    ]);

    if (!groupInfo || clients.length === 0) {
      throw new AppError(404, 'Group not found or no clients', ErrorCodes.NOT_FOUND);
    }

    const clientIds = clients.map(client => client.GSClientID);

    // Log query parameters for debugging
    logger.info('Group graphs query started', {
      groupCode,
      clientCount: clients.length,
      dateRange: { startDate, endDate },
    });

    // Build where clauses for WIPTransactions
    // Query by GSClientID only - all WIP transactions are properly linked to clients
    // Uses composite index: idx_wip_gsclientid_trandate_ttype for optimal performance
    const wipWhereClause = {
      GSClientID: { in: clientIds },
      TranDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    const openingWhereClause = {
      GSClientID: { in: clientIds },
      TranDate: {
        lt: startDate,
      },
    };

    // BATCH 2: Fetch service line mappings, opening balance aggregates, and WIP transactions in parallel
    // OPTIMIZATION: Use database aggregation for opening balance instead of fetching all records
    const [servLineToMasterMap, openingBalanceAggregates, actualTransactions] = await Promise.all([
      getServiceLineMappings(),
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
          GSClientID: true, // For debugging
          GSTaskID: true, // For debugging
        },
        orderBy: {
          TranDate: 'asc',
        },
        take: 50000, // CRITICAL: Prevent unbounded queries - reduced from 250k to 50k for performance
      }),
    ]);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'groups/[groupCode]/analytics/graphs/route.ts:259',message:'After parallel queries',data:{aggregatesCount:openingBalanceAggregates?.length,aggregatesSample:openingBalanceAggregates?.[0],transactionsCount:actualTransactions?.length,hasServLineMap:!!servLineToMasterMap},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H2,H5'})}).catch(()=>{});
    // #endregion

    // Warn if transaction limits are hit
    if (actualTransactions.length >= 50000) {
      logger.warn('Period transactions limit reached', {
        groupCode,
        limit: 50000,
        dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        message: 'Some transaction data may be excluded',
      });
    }

    // Log transaction counts by type for debugging
    const transactionsByType = actualTransactions.reduce((acc, txn) => {
      acc[txn.TType] = (acc[txn.TType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    logger.info('Group graphs transactions fetched', {
      groupCode,
      totalTransactions: actualTransactions.length,
      openingAggregateGroups: openingBalanceAggregates.length,
      byType: transactionsByType,
      transactionsWithClientID: actualTransactions.filter(t => t.GSClientID).length,
      transactionsOnlyWithTaskID: actualTransactions.filter(t => !t.GSClientID && t.GSTaskID).length,
    });

    // Calculate opening WIP balance from aggregates (much faster than processing individual records)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'groups/[groupCode]/analytics/graphs/route.ts:289',message:'Before calculateOpeningBalanceFromAggregates',data:{aggregates:openingBalanceAggregates,aggregatesType:typeof openingBalanceAggregates,isArray:Array.isArray(openingBalanceAggregates)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H3,H5'})}).catch(()=>{});
    // #endregion
    const openingWipBalance = calculateOpeningBalanceFromAggregates(openingBalanceAggregates);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'groups/[groupCode]/analytics/graphs/route.ts:291',message:'After calculateOpeningBalanceFromAggregates',data:{openingWipBalance,openingWipBalanceType:typeof openingWipBalance},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    // Helper function to aggregate transactions
    const aggregateTransactions = (txns: typeof actualTransactions, openingBalance: number = 0) => {
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
        let daily = dailyMap.get(dateKey);
        if (!daily) {
          daily = {
            date: dateKey,
            production: 0,
            adjustments: 0,
            disbursements: 0,
            billing: 0,
            provisions: 0,
            wipBalance: 0,
          };
          dailyMap.set(dateKey, daily);
        }

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
    const overall = aggregateTransactions(actualTransactions, openingWipBalance);

    // Group transactions by Master Service Line
    const transactionsByMasterServiceLine = new Map<string, typeof actualTransactions>();
    actualTransactions.forEach((txn) => {
      const masterCode = servLineToMasterMap.get(txn.TaskServLine) || 'UNKNOWN';
      const existing = transactionsByMasterServiceLine.get(masterCode) || [];
      existing.push(txn);
      transactionsByMasterServiceLine.set(masterCode, existing);
    });

    // Aggregate by Master Service Line with opening balances
    // Note: Using overall opening balance for all service lines since aggregates don't include TaskServLine
    const byMasterServiceLine: Record<string, ServiceLineGraphData> = {};
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'groups/[groupCode]/analytics/graphs/route.ts:397',message:'Before service line aggregation',data:{serviceLineCount:transactionsByMasterServiceLine.size,serviceLineCodes:Array.from(transactionsByMasterServiceLine.keys()),openingWipBalance},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    transactionsByMasterServiceLine.forEach((txns, masterCode) => {
      // Use overall opening balance as starting point for each service line
      // This is acceptable since opening balance is just the starting WIP value
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'groups/[groupCode]/analytics/graphs/route.ts:400',message:'Processing service line',data:{masterCode,txnsCount:txns.length,openingWipBalance},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
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
      groupCode: groupInfo.groupCode,
      groupDesc: groupInfo.groupDesc,
      clientCount: clients.length,
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
    logger.info('Group analytics graphs generated', {
      userId: user.id,
      groupCode,
      resolution: queryParams.resolution,
      clientCount: clients.length,
      transactionCount: actualTransactions.length,
      openingAggregateGroups: openingBalanceAggregates.length,
      dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    });

    const response = NextResponse.json(successResponse(responseData));
    response.headers.set('Cache-Control', 'no-store'); // User-specific analytics
    return response;
    } catch (error) {
      // #region agent log
      const err = error as any;
      fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'groups/[groupCode]/analytics/graphs/route.ts:473',message:'Handler error',data:{errorName:err?.name,errorMessage:err?.message,errorStack:err?.stack,groupCode:params.groupCode},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1,H2,H3,H4,H5'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  },
});

