/**
 * Stored Procedure Service for My Reports
 * 
 * Provides wrapper functions to call WipLTD, WipMonthly, DrsLTD, and DrsMonthly
 * stored procedures with proper TypeScript typing.
 * 
 * These functions can be used as drop-in replacements for the existing
 * inline SQL queries in the My Reports API routes.
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import type { 
  WipLTDResult, 
  WipMonthlyResult, 
  DrsLTDResult, 
  DrsMonthlyResult,
  MonthlyMetrics 
} from '@/types/api';
import { format, subMonths } from 'date-fns';

// ============================================================================
// ProfitabilityData - Task-level WIP aggregations for Profitability
// ============================================================================

export interface ProfitabilityDataParams {
  servLineCode?: string;
  partnerCode?: string;
  managerCode?: string;
  groupCode?: string;
  clientCode?: string;
  taskCode?: string;
  dateFrom: Date;
  dateTo: Date;
  empCode?: string;
}

/**
 * Execute sp_ProfitabilityData stored procedure
 * Returns task-level WIP aggregations with profitability metrics
 */
export async function executeProfitabilityData(params: ProfitabilityDataParams): Promise<WipLTDResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<WipLTDResult[]>`
      EXEC dbo.sp_ProfitabilityData 
        @ServLineCode = ${params.servLineCode ?? '*'},
        @PartnerCode = ${params.partnerCode ?? '*'},
        @ManagerCode = ${params.managerCode ?? '*'},
        @GroupCode = ${params.groupCode ?? '*'},
        @ClientCode = ${params.clientCode ?? '*'},
        @TaskCode = ${params.taskCode ?? '*'},
        @DateFrom = ${params.dateFrom},
        @DateTo = ${params.dateTo},
        @EmpCode = ${params.empCode ?? '*'}
    `;

    logger.debug('sp_ProfitabilityData executed', {
      params: { ...params, dateFrom: params.dateFrom.toISOString(), dateTo: params.dateTo.toISOString() },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('sp_ProfitabilityData execution failed', { params, error });
    throw error;
  }
}

// ============================================================================
// WipMonthly - Monthly WIP aggregations for Overview charts
// ============================================================================

export interface WipMonthlyParams {
  partnerCode?: string;
  managerCode?: string;
  servLineCode?: string;
  dateFrom: Date;
  dateTo: Date;
  isCumulative?: boolean;
}

/**
 * Execute WipMonthly stored procedure
 * Returns monthly WIP aggregations for Overview charts
 */
export async function executeWipMonthly(params: WipMonthlyParams): Promise<WipMonthlyResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<WipMonthlyResult[]>`
      EXEC dbo.WipMonthly 
        @PartnerCode = ${params.partnerCode ?? '*'},
        @ManagerCode = ${params.managerCode ?? '*'},
        @ServLineCode = ${params.servLineCode ?? '*'},
        @DateFrom = ${params.dateFrom},
        @DateTo = ${params.dateTo},
        @IsCumulative = ${params.isCumulative !== false ? 1 : 0}
    `;

    logger.debug('WipMonthly executed', {
      params: { ...params, dateFrom: params.dateFrom.toISOString(), dateTo: params.dateTo.toISOString() },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('WipMonthly execution failed', { params, error });
    throw error;
  }
}

// ============================================================================
// DrsLTDv2 - Client-level debtors aggregations for Recoverability
// High-performance version with payment metrics
// ============================================================================

export interface DrsLTDParams {
  servLineCode?: string;
  groupCode?: string;
  clientCode?: string;
  billerCode: string;  // Required - filters by Biller
  dateTo: Date;        // LTD up to this date (no dateFrom - always from inception)
  asOfDate?: Date;     // For aging calculation (defaults to dateTo)
}

/**
 * Execute DrsLTDv2 stored procedure
 * Returns client-level debtors aggregations with aging buckets and payment metrics
 * 
 * New in v2:
 * - AvgPaymentDaysPaid: Weighted average days to pay for fully paid invoices
 * - Improved invoice matching logic
 * - Single-pass CTE architecture for better performance
 */
export async function executeDrsLTD(params: DrsLTDParams): Promise<DrsLTDResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<DrsLTDResult[]>`
      EXEC dbo.DrsLTDv2 
        @ServLineCode = ${params.servLineCode ?? '*'},
        @GroupCode = ${params.groupCode ?? '*'},
        @ClientCode = ${params.clientCode ?? '*'},
        @BillerCode = ${params.billerCode},
        @DateTo = ${params.dateTo},
        @AsOfDate = ${params.asOfDate ?? params.dateTo}
    `;

    logger.debug('DrsLTDv2 executed', {
      params: { ...params, dateTo: params.dateTo.toISOString() },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('DrsLTDv2 execution failed', { params, error });
    throw error;
  }
}

// ============================================================================
// DrsMonthly - Monthly debtors aggregations for Overview charts
// ============================================================================

export interface DrsMonthlyParams {
  billerCode: string;  // Required - filters by Biller
  servLineCode?: string;
  dateFrom: Date;
  dateTo: Date;
  isCumulative?: boolean;
}

/**
 * Execute DrsMonthly stored procedure
 * Returns monthly debtors aggregations for Overview charts
 */
export async function executeDrsMonthly(params: DrsMonthlyParams): Promise<DrsMonthlyResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<DrsMonthlyResult[]>`
      EXEC dbo.DrsMonthly 
        @BillerCode = ${params.billerCode},
        @ServLineCode = ${params.servLineCode ?? '*'},
        @DateFrom = ${params.dateFrom},
        @DateTo = ${params.dateTo},
        @IsCumulative = ${params.isCumulative !== false ? 1 : 0}
    `;

    logger.debug('DrsMonthly executed', {
      params: { ...params, dateFrom: params.dateFrom.toISOString(), dateTo: params.dateTo.toISOString() },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('DrsMonthly execution failed', { params, error });
    throw error;
  }
}

// ============================================================================
// High-level functions for My Reports
// ============================================================================

export interface OverviewMetricsParams {
  empCode: string;
  isPartnerReport: boolean;
  dateFrom: Date;
  dateTo: Date;
  servLineCode?: string;
}

/**
 * Fetch all metrics needed for Overview report using stored procedures
 * Combines WipMonthly and DrsMonthly results into MonthlyMetrics array
 */
export async function fetchOverviewMetricsFromSP(
  params: OverviewMetricsParams
): Promise<MonthlyMetrics[]> {
  const startTime = Date.now();
  
  // Determine partner/manager filter
  const partnerCode = params.isPartnerReport ? params.empCode : undefined;
  const managerCode = params.isPartnerReport ? undefined : params.empCode;
  
  // Fetch trailing 12 months before dateFrom for lockup calculations
  const trailing12Start = subMonths(params.dateFrom, 12);

  // Execute all SP calls in parallel
  const [
    wipCumulativeData,
    wipNonCumulativeData,
    drsCumulativeData,
    drsNonCumulativeData,
  ] = await Promise.all([
    // WIP cumulative for display
    executeWipMonthly({
      partnerCode,
      managerCode,
      servLineCode: params.servLineCode,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      isCumulative: true,
    }),
    // WIP non-cumulative for lockup calculations (includes trailing 12 months)
    executeWipMonthly({
      partnerCode,
      managerCode,
      servLineCode: params.servLineCode,
      dateFrom: trailing12Start,
      dateTo: params.dateTo,
      isCumulative: false,
    }),
    // DRS cumulative for collections display
    executeDrsMonthly({
      billerCode: params.empCode,
      servLineCode: params.servLineCode,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      isCumulative: true,
    }),
    // DRS non-cumulative for lockup calculations (includes trailing 12 months)
    executeDrsMonthly({
      billerCode: params.empCode,
      servLineCode: params.servLineCode,
      dateFrom: trailing12Start,
      dateTo: params.dateTo,
      isCumulative: false,
    }),
  ]);

  // Build monthly metrics map
  const metricsMap = new Map<string, Partial<MonthlyMetrics>>();

  // Process WIP cumulative data (for display)
  wipCumulativeData.forEach(row => {
    const monthKey = format(new Date(row.Month), 'yyyy-MM');
    const netRevenue = row.LTDTime + row.LTDAdj;
    const grossProfit = netRevenue - row.LTDCost;
    const writeoffAmount = row.LTDNegativeAdj + row.LTDProvision;
    const writeoffPercentage = row.LTDTime !== 0 ? (writeoffAmount / row.LTDTime) * 100 : 0;

    metricsMap.set(monthKey, {
      month: monthKey,
      netRevenue,
      grossProfit,
      writeoffPercentage,
      negativeAdj: row.LTDNegativeAdj,
      provisions: row.LTDProvision,
      grossTime: row.LTDTime,
      wipBalance: row.BalWip,
    });
  });

  // Add collections and debtors balance from DRS data
  drsCumulativeData.forEach(row => {
    const monthKey = format(new Date(row.Month), 'yyyy-MM');
    const existing = metricsMap.get(monthKey) || { month: monthKey };
    
    metricsMap.set(monthKey, {
      ...existing,
      collections: row.Collections,
      debtorsBalance: row.BalDrs,
    });
  });

  // Calculate lockup days using non-cumulative data
  wipCumulativeData.forEach(row => {
    const monthKey = format(new Date(row.Month), 'yyyy-MM');
    const monthDate = new Date(row.Month);
    const trailing12Start = subMonths(monthDate, 11);
    
    // Calculate trailing 12-month net revenue for WIP lockup
    let trailing12Revenue = 0;
    wipNonCumulativeData.forEach(wipRow => {
      const wipDate = new Date(wipRow.Month);
      if (wipDate >= trailing12Start && wipDate <= monthDate) {
        trailing12Revenue += wipRow.LTDTime + wipRow.LTDAdj;
      }
    });

    // Calculate trailing 12-month net billings for debtors lockup
    let trailing12Billings = 0;
    drsNonCumulativeData.forEach(drsRow => {
      const drsDate = new Date(drsRow.Month);
      if (drsDate >= trailing12Start && drsDate <= monthDate) {
        trailing12Billings += drsRow.NetBillings;
      }
    });

    const existing = metricsMap.get(monthKey);
    if (existing) {
      const wipBalance = existing.wipBalance ?? 0;
      const debtorsBalance = existing.debtorsBalance ?? 0;
      
      metricsMap.set(monthKey, {
        ...existing,
        wipLockupDays: trailing12Revenue !== 0 ? (wipBalance * 365) / trailing12Revenue : 0,
        debtorsLockupDays: trailing12Billings !== 0 ? (debtorsBalance * 365) / trailing12Billings : 0,
        trailing12Revenue,
        trailing12Billings,
      });
    }
  });

  // Convert to sorted array
  const monthlyMetrics = Array.from(metricsMap.values())
    .sort((a, b) => (a.month ?? '').localeCompare(b.month ?? ''))
    .map(m => ({
      month: m.month ?? '',
      netRevenue: m.netRevenue ?? 0,
      grossProfit: m.grossProfit ?? 0,
      collections: m.collections ?? 0,
      wipLockupDays: m.wipLockupDays ?? 0,
      debtorsLockupDays: m.debtorsLockupDays ?? 0,
      writeoffPercentage: m.writeoffPercentage ?? 0,
      negativeAdj: m.negativeAdj,
      provisions: m.provisions,
      grossTime: m.grossTime,
      wipBalance: m.wipBalance,
      debtorsBalance: m.debtorsBalance,
      trailing12Revenue: m.trailing12Revenue,
      trailing12Billings: m.trailing12Billings,
    } as MonthlyMetrics));

  logger.info('Overview metrics fetched from SPs', {
    empCode: params.empCode,
    isPartnerReport: params.isPartnerReport,
    monthCount: monthlyMetrics.length,
    durationMs: Date.now() - startTime,
  });

  return monthlyMetrics;
}

/**
 * Fetch profitability data using sp_ProfitabilityData stored procedure
 */
export async function fetchProfitabilityFromSP(
  empCode: string,
  isPartnerReport: boolean,
  dateFrom: Date,
  dateTo: Date,
  servLineCode?: string
): Promise<WipLTDResult[]> {
  return executeProfitabilityData({
    partnerCode: isPartnerReport ? empCode : undefined,
    managerCode: isPartnerReport ? undefined : empCode,
    servLineCode,
    dateFrom,
    dateTo,
  });
}

/**
 * Fetch recoverability data using DrsLTDv2 stored procedure
 * 
 * Note: DrsLTDv2 always fetches from inception (no dateFrom needed).
 * The dateTo parameter controls the LTD cutoff, and asOfDate controls aging calculation.
 */
export async function fetchRecoverabilityFromSP(
  empCode: string,
  dateTo: Date,
  asOfDate?: Date,
  servLineCode?: string
): Promise<DrsLTDResult[]> {
  return executeDrsLTD({
    billerCode: empCode,
    servLineCode,
    dateTo,
    asOfDate,
  });
}

// ============================================================================
// Combined Recoverability Data (AGING ONLY)
// ============================================================================

export interface RecoverabilityDataParams {
  billerCode: string;
  asOfDate: Date;
  clientCode?: string;        // Optional client filter
  servLineCode?: string;      // Optional service line filter
}

/**
 * Execute sp_RecoverabilityData stored procedure
 * Returns per-client-serviceline combination with aging metrics:
 * - Aging buckets (Current, 31-60, 61-90, 91-120, 120+)
 * - Current period billings and receipts (last 30 days)
 * - Prior month balance (30 days ago)
 * - Service line mapping at transaction level (accurate for multi-serviceline clients)
 */
export async function executeRecoverabilityData(
  params: RecoverabilityDataParams
): Promise<import('@/types/api').RecoverabilityDataResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<import('@/types/api').RecoverabilityDataResult[]>`
      EXEC dbo.sp_RecoverabilityData 
        @BillerCode = ${params.billerCode},
        @AsOfDate = ${params.asOfDate},
        @ClientCode = ${params.clientCode ?? '*'},
        @ServLineCode = ${params.servLineCode ?? '*'}
    `;

    logger.debug('sp_RecoverabilityData executed', {
      params: { 
        ...params, 
        asOfDate: params.asOfDate.toISOString(),
        clientCode: params.clientCode ?? '*',
        servLineCode: params.servLineCode ?? '*'
      },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('sp_RecoverabilityData execution failed', { params, error });
    throw error;
  }
}

// ============================================================================
// Monthly Receipts Data (PROPER FISCAL MONTH BOUNDARIES)
// ============================================================================

export interface RecoverabilityMonthlyParams {
  billerCode: string;
  dateFrom: Date;
  dateTo: Date;
  servLineCode?: string;
}

/**
 * Execute sp_RecoverabilityMonthly stored procedure
 * Returns per-client-serviceline monthly receipts with proper fiscal boundaries:
 * - Opening balance = cumulative before month start (ensures Nov closing = Dec opening)
 * - Receipts = negative transactions in month
 * - Billings = positive transactions in month
 * - Closing balance = Opening + Billings - Receipts
 */
export async function executeRecoverabilityMonthly(
  params: RecoverabilityMonthlyParams
): Promise<import('@/types/api').RecoverabilityMonthlyResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<import('@/types/api').RecoverabilityMonthlyResult[]>`
      EXEC dbo.sp_RecoverabilityMonthly
        @BillerCode = ${params.billerCode},
        @DateFrom = ${params.dateFrom},
        @DateTo = ${params.dateTo},
        @ServLineCode = ${params.servLineCode ?? '*'}
    `;

    logger.debug('sp_RecoverabilityMonthly executed', {
      params: { 
        ...params, 
        dateFrom: params.dateFrom.toISOString(),
        dateTo: params.dateTo.toISOString()
      },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('sp_RecoverabilityMonthly execution failed', { params, error });
    throw error;
  }
}

// ============================================================================
// Graph Data - Daily WIP transaction metrics for analytics graphs
// ============================================================================

export interface GraphDataParams {
  dateFrom: Date;
  dateTo: Date;
  servLineCode?: string;
}

export interface ClientGraphDataParams extends GraphDataParams {
  GSClientID: string;
}

export interface GroupGraphDataParams extends GraphDataParams {
  groupCode: string;
}

export interface GraphDataResult {
  TranDate: Date;
  ServLineCode: string;
  masterCode: string | null;
  masterServiceLineName: string | null;
  Production: number;
  Adjustments: number;
  Disbursements: number;
  Billing: number;
  Provisions: number;
  OpeningBalance: number;
}

/**
 * Execute sp_ClientGraphData stored procedure
 * Returns daily WIP transaction metrics for a single client
 */
export async function executeClientGraphData(
  params: ClientGraphDataParams
): Promise<GraphDataResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<GraphDataResult[]>`
      EXEC dbo.sp_ClientGraphData
        @GSClientID = ${params.GSClientID},
        @DateFrom = ${params.dateFrom},
        @DateTo = ${params.dateTo},
        @ServLineCode = ${params.servLineCode ?? '*'}
    `;

    logger.debug('sp_ClientGraphData executed', {
      params: { 
        ...params, 
        dateFrom: params.dateFrom.toISOString(),
        dateTo: params.dateTo.toISOString()
      },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('sp_ClientGraphData execution failed', { params, error });
    throw error;
  }
}

/**
 * Execute sp_GroupGraphData stored procedure
 * Returns daily WIP transaction metrics aggregated across all clients in a group
 */
export async function executeGroupGraphData(
  params: GroupGraphDataParams
): Promise<GraphDataResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<GraphDataResult[]>`
      EXEC dbo.sp_GroupGraphData
        @GroupCode = ${params.groupCode},
        @DateFrom = ${params.dateFrom},
        @DateTo = ${params.dateTo},
        @ServLineCode = ${params.servLineCode ?? '*'}
    `;

    logger.debug('sp_GroupGraphData executed', {
      params: { 
        ...params, 
        dateFrom: params.dateFrom.toISOString(),
        dateTo: params.dateTo.toISOString()
      },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('sp_GroupGraphData execution failed', { params, error });
    throw error;
  }
}
