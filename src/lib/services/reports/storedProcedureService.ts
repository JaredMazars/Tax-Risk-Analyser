/**
 * Stored Procedure Service for My Reports
 * 
 * Provides wrapper functions to call sp_WipMonthly, sp_DrsMonthly, and other
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
 * Execute sp_WipMonthly stored procedure
 * Returns monthly WIP aggregations for Overview charts
 */
export async function executeWipMonthly(params: WipMonthlyParams): Promise<WipMonthlyResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<WipMonthlyResult[]>`
      EXEC dbo.sp_WipMonthly 
        @PartnerCode = ${params.partnerCode ?? '*'},
        @ManagerCode = ${params.managerCode ?? '*'},
        @ServLineCode = ${params.servLineCode ?? '*'},
        @DateFrom = ${params.dateFrom},
        @DateTo = ${params.dateTo},
        @IsCumulative = ${params.isCumulative !== false ? 1 : 0}
    `;

    logger.debug('sp_WipMonthly executed', {
      params: { ...params, dateFrom: params.dateFrom.toISOString(), dateTo: params.dateTo.toISOString() },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('sp_WipMonthly execution failed', { params, error });
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
 * Execute sp_DrsMonthly stored procedure
 * Returns monthly debtors aggregations for Overview charts
 */
export async function executeDrsMonthly(params: DrsMonthlyParams): Promise<DrsMonthlyResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<DrsMonthlyResult[]>`
      EXEC dbo.sp_DrsMonthly 
        @BillerCode = ${params.billerCode},
        @ServLineCode = ${params.servLineCode ?? '*'},
        @DateFrom = ${params.dateFrom},
        @DateTo = ${params.dateTo},
        @IsCumulative = ${params.isCumulative !== false ? 1 : 0}
    `;

    logger.debug('sp_DrsMonthly executed', {
      params: { ...params, dateFrom: params.dateFrom.toISOString(), dateTo: params.dateTo.toISOString() },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('sp_DrsMonthly execution failed', { params, error });
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
  // NetRevenue formula matches sp_ProfitabilityData: T + ADJ + Provisions
  wipCumulativeData.forEach(row => {
    const monthKey = format(new Date(row.Month), 'yyyy-MM');
    const netRevenue = row.LTDTime + row.LTDAdj + row.LTDProvision;
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
    // NetRevenue formula matches sp_ProfitabilityData: T + ADJ + Provisions
    let trailing12Revenue = 0;
    wipNonCumulativeData.forEach(wipRow => {
      const wipDate = new Date(wipRow.Month);
      if (wipDate >= trailing12Start && wipDate <= monthDate) {
        trailing12Revenue += wipRow.LTDTime + wipRow.LTDAdj + wipRow.LTDProvision;
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
 * Fetch business-wide profitability data using sp_ProfitabilityData stored procedure
 * 
 * Unlike fetchProfitabilityFromSP, this function returns ALL tasks business-wide
 * with optional filtering by partner and/or manager codes.
 * 
 * @param dateFrom - Start date for the period
 * @param dateTo - End date for the period
 * @param partnerCodes - Optional array of partner codes to filter by (comma-separated to SP)
 * @param managerCodes - Optional array of manager codes to filter by (comma-separated to SP)
 */
export async function fetchProfitabilityFromSPBusinessWide(
  dateFrom: Date,
  dateTo: Date,
  partnerCodes?: string[],
  managerCodes?: string[]
): Promise<WipLTDResult[]> {
  // Convert arrays to comma-separated strings for SP
  // '*' means no filter (all data)
  const partnerCode = partnerCodes && partnerCodes.length > 0 
    ? partnerCodes.join(',') 
    : '*';
  const managerCode = managerCodes && managerCodes.length > 0 
    ? managerCodes.join(',') 
    : '*';

  return executeProfitabilityData({
    partnerCode,
    managerCode,
    dateFrom,
    dateTo,
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
// WIP Aging - Task-level WIP aging with FIFO fee allocation
// ============================================================================

export interface WIPAgingParams {
  taskPartner?: string;
  taskManager?: string;
  clientCode?: string;
  groupCode?: string;
  servLineCode?: string;
  taskCode?: string;
  asOfDate: Date;
}

/**
 * Execute sp_WIPAgingByTask stored procedure
 * Returns task-level WIP aging with FIFO fee allocation:
 * - 7 aging buckets (Curr, Bal30, Bal60, Bal90, Bal120, Bal150, Bal180)
 * - Fees applied against oldest WIP first (FIFO)
 * - Net buckets represent WIP after credit allocation
 */
export async function executeWIPAging(
  params: WIPAgingParams
): Promise<import('@/types/api').WIPAgingSPResult[]> {
  const startTime = Date.now();
  
  try {
    const results = await prisma.$queryRaw<import('@/types/api').WIPAgingSPResult[]>`
      EXEC dbo.sp_WIPAgingByTask
        @TaskPartner = ${params.taskPartner ?? '*'},
        @TaskManager = ${params.taskManager ?? '*'},
        @ClientCode = ${params.clientCode ?? '*'},
        @GroupCode = ${params.groupCode ?? '*'},
        @ServLineCode = ${params.servLineCode ?? '*'},
        @TaskCode = ${params.taskCode ?? '*'},
        @AsOfDate = ${params.asOfDate}
    `;

    logger.debug('sp_WIPAgingByTask executed', {
      params: { 
        ...params, 
        asOfDate: params.asOfDate.toISOString()
      },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('sp_WIPAgingByTask execution failed', { params, error });
    throw error;
  }
}

/**
 * Fetch WIP aging data for a specific user (partner or manager)
 */
export async function fetchWIPAgingFromSP(
  empCode: string,
  isPartnerReport: boolean,
  asOfDate: Date
): Promise<import('@/types/api').WIPAgingSPResult[]> {
  return executeWIPAging({
    taskPartner: isPartnerReport ? empCode : undefined,
    taskManager: isPartnerReport ? undefined : empCode,
    asOfDate,
  });
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

// ============================================================================
// Country Management Summary SPs
// Pre-aggregated data for executive dashboards
// ============================================================================

export interface ProfitabilitySummaryParams {
  servLineCode?: string;
  partnerCodes?: string[];
  managerCodes?: string[];
  dateFrom: Date;
  dateTo: Date;
}

export interface WIPAgingSummaryParams {
  servLineCode?: string;
  partnerCodes?: string[];
  managerCodes?: string[];
  asOfDate: Date;
}

/**
 * Execute sp_ProfitabilitySummaryByPartner stored procedure
 * Returns partner-level profitability summary (~50-100 rows)
 * Uses extended timeout (120s) for business-wide queries
 */
export async function executeProfitabilitySummaryByPartner(
  params: ProfitabilitySummaryParams
): Promise<import('@/types/api').ProfitabilitySummaryResult[]> {
  const startTime = Date.now();
  
  // Convert arrays to comma-separated strings
  const partnerCode = params.partnerCodes && params.partnerCodes.length > 0 
    ? params.partnerCodes.join(',') 
    : '*';
  
  try {
    // Use transaction with extended timeout for business-wide queries
    const results = await prisma.$transaction(
      async (tx) => {
        return tx.$queryRaw<import('@/types/api').ProfitabilitySummaryResult[]>`
          EXEC dbo.sp_ProfitabilitySummaryByPartner
            @ServLineCode = ${params.servLineCode ?? '*'},
            @PartnerCode = ${partnerCode},
            @DateFrom = ${params.dateFrom},
            @DateTo = ${params.dateTo}
        `;
      },
      { timeout: 120000 } // 2 minutes timeout
    );

    logger.debug('sp_ProfitabilitySummaryByPartner executed', {
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
    logger.error('sp_ProfitabilitySummaryByPartner execution failed', { params, error });
    throw error;
  }
}

/**
 * Execute sp_ProfitabilitySummaryByManager stored procedure
 * Returns manager-level profitability summary (~200-300 rows)
 * Uses extended timeout (120s) for business-wide queries
 */
export async function executeProfitabilitySummaryByManager(
  params: ProfitabilitySummaryParams
): Promise<import('@/types/api').ProfitabilitySummaryResult[]> {
  const startTime = Date.now();
  
  // Convert arrays to comma-separated strings
  const managerCode = params.managerCodes && params.managerCodes.length > 0 
    ? params.managerCodes.join(',') 
    : '*';
  
  try {
    // Use transaction with extended timeout for business-wide queries
    const results = await prisma.$transaction(
      async (tx) => {
        return tx.$queryRaw<import('@/types/api').ProfitabilitySummaryResult[]>`
          EXEC dbo.sp_ProfitabilitySummaryByManager
            @ServLineCode = ${params.servLineCode ?? '*'},
            @ManagerCode = ${managerCode},
            @DateFrom = ${params.dateFrom},
            @DateTo = ${params.dateTo}
        `;
      },
      { timeout: 120000 } // 2 minutes timeout
    );

    logger.debug('sp_ProfitabilitySummaryByManager executed', {
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
    logger.error('sp_ProfitabilitySummaryByManager execution failed', { params, error });
    throw error;
  }
}

/**
 * Execute sp_WIPAgingSummaryByPartner stored procedure
 * Returns partner-level WIP aging summary (~50-100 rows)
 * Uses extended timeout (120s) for business-wide queries
 */
export async function executeWIPAgingSummaryByPartner(
  params: WIPAgingSummaryParams
): Promise<import('@/types/api').WIPAgingSummaryResult[]> {
  const startTime = Date.now();
  
  // Convert arrays to comma-separated strings
  const partnerCode = params.partnerCodes && params.partnerCodes.length > 0 
    ? params.partnerCodes.join(',') 
    : '*';
  
  try {
    // Use transaction with extended timeout for business-wide queries
    const results = await prisma.$transaction(
      async (tx) => {
        return tx.$queryRaw<import('@/types/api').WIPAgingSummaryResult[]>`
          EXEC dbo.sp_WIPAgingSummaryByPartner
            @ServLineCode = ${params.servLineCode ?? '*'},
            @PartnerCode = ${partnerCode},
            @AsOfDate = ${params.asOfDate}
        `;
      },
      { timeout: 120000 } // 2 minutes timeout
    );

    logger.debug('sp_WIPAgingSummaryByPartner executed', {
      params: { 
        ...params, 
        asOfDate: params.asOfDate.toISOString()
      },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('sp_WIPAgingSummaryByPartner execution failed', { params, error });
    throw error;
  }
}

/**
 * Execute sp_WIPAgingSummaryByManager stored procedure
 * Returns manager-level WIP aging summary (~200-300 rows)
 * Uses extended timeout (120s) for business-wide queries
 */
export async function executeWIPAgingSummaryByManager(
  params: WIPAgingSummaryParams
): Promise<import('@/types/api').WIPAgingSummaryResult[]> {
  const startTime = Date.now();
  
  // Convert arrays to comma-separated strings
  const managerCode = params.managerCodes && params.managerCodes.length > 0 
    ? params.managerCodes.join(',') 
    : '*';
  
  try {
    // Use transaction with extended timeout for business-wide queries
    const results = await prisma.$transaction(
      async (tx) => {
        return tx.$queryRaw<import('@/types/api').WIPAgingSummaryResult[]>`
          EXEC dbo.sp_WIPAgingSummaryByManager
            @ServLineCode = ${params.servLineCode ?? '*'},
            @ManagerCode = ${managerCode},
            @AsOfDate = ${params.asOfDate}
        `;
      },
      { timeout: 120000 } // 2 minutes timeout
    );

    logger.debug('sp_WIPAgingSummaryByManager executed', {
      params: { 
        ...params, 
        asOfDate: params.asOfDate.toISOString()
      },
      resultCount: results.length,
      durationMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('sp_WIPAgingSummaryByManager execution failed', { params, error });
    throw error;
  }
}
