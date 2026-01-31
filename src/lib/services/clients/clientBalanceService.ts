/**
 * Client Balance Service - Stored Procedure Integration
 * 
 * Provides balance fetching using stored procedures instead of inline queries.
 * Replaces direct Prisma queries with sp_ProfitabilityData and sp_RecoverabilityData.
 */

import { executeProfitabilityData, executeRecoverabilityData } from '@/lib/services/reports/storedProcedureService';
import type { WipLTDResult, RecoverabilityDataResult } from '@/types/api';
import type { WIPBalances } from '@/lib/services/clients/clientBalanceCalculation';
import { logger } from '@/lib/utils/logger';

/**
 * Parameters for fetching client balances from stored procedures
 */
export interface FetchClientBalancesParams {
  clientCode: string;
  taskGSTaskIDs: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Result structure matching current client API response format
 */
export interface ClientBalancesResult {
  wipByTask: Map<string, WIPBalances>;
  clientWipBalances: WIPBalances;
  debtorBalance: number;
}

/**
 * Map a single WipLTDResult to WIPBalances format
 * Converts stored procedure fields to match the current API response structure
 */
function mapWipResultToBalance(result: WipLTDResult): WIPBalances {
  return {
    time: result.LTDTimeCharged,
    adjustments: result.LTDAdjustments,
    disbursements: result.LTDDisbCharged,
    fees: result.LTDFeesBilled,
    provision: result.LTDWipProvision,
    grossWip: result.BalWip,
    netWip: result.NetWIP,
    balWIP: result.NetWIP, // Backwards compatibility
    balTime: result.LTDTimeCharged + result.LTDAdjustments - result.LTDFeesBilled,
    balDisb: result.LTDDisbCharged,
  };
}

/**
 * Map WipLTDResult array to task-level WIP balances map
 * Only includes tasks that are in the taskGSTaskIDs filter
 * 
 * @param results - Array of WIP results from sp_ProfitabilityData
 * @param taskGSTaskIDs - Filter to only include these task IDs
 * @returns Map of GSTaskID to WIPBalances
 */
function mapWipResultsToBalances(
  results: WipLTDResult[],
  taskGSTaskIDs: string[]
): Map<string, WIPBalances> {
  const wipByTask = new Map<string, WIPBalances>();
  const taskIdSet = new Set(taskGSTaskIDs);

  results.forEach((result) => {
    // Only include tasks that are in the current page/filter
    if (taskIdSet.has(result.GSTaskID)) {
      wipByTask.set(result.GSTaskID, mapWipResultToBalance(result));
    }
  });

  return wipByTask;
}

/**
 * Aggregate all WIP results to client-level totals
 * Sums all task-level metrics to produce overall client balances
 * 
 * @param results - Array of WIP results from sp_ProfitabilityData
 * @returns Aggregated WIPBalances for entire client
 */
function aggregateWipBalances(results: WipLTDResult[]): WIPBalances {
  // Initialize with zeros
  const totals: WIPBalances = {
    time: 0,
    adjustments: 0,
    disbursements: 0,
    fees: 0,
    provision: 0,
    grossWip: 0,
    netWip: 0,
    balWIP: 0,
    balTime: 0,
    balDisb: 0,
  };

  // Sum all task-level balances
  results.forEach((result) => {
    totals.time += result.LTDTimeCharged;
    totals.adjustments += result.LTDAdjustments;
    totals.disbursements += result.LTDDisbCharged;
    totals.fees += result.LTDFeesBilled;
    totals.provision += result.LTDWipProvision;
    totals.grossWip += result.BalWip;
    totals.netWip += result.NetWIP;
  });

  // Calculate derived fields
  totals.balWIP = totals.netWip; // Backwards compatibility
  totals.balTime = totals.time + totals.adjustments - totals.fees;
  totals.balDisb = totals.disbursements;

  return totals;
}

/**
 * Fetch client balances using stored procedures
 * Replaces inline Prisma queries with sp_ProfitabilityData and sp_RecoverabilityData
 * 
 * @param params - Client code, task IDs, and optional date range
 * @returns WIP balances by task, client-level WIP, and debtors balance
 */
export async function fetchClientBalancesFromSP(
  params: FetchClientBalancesParams
): Promise<ClientBalancesResult> {
  const startTime = Date.now();

  try {
    // Execute both stored procedures in parallel
    const [wipResults, debtorResults] = await Promise.all([
      // sp_ProfitabilityData: Task-level WIP with profitability metrics
      executeProfitabilityData({
        clientCode: params.clientCode,
        dateFrom: params.dateFrom ?? new Date('1900-01-01'),
        dateTo: params.dateTo ?? new Date('2099-12-31'),
      }),
      
      // sp_RecoverabilityData: Client-serviceline debtors with aging
      executeRecoverabilityData({
        billerCode: '*', // Get all billers for this client
        asOfDate: new Date(),
        clientCode: params.clientCode,
      }),
    ]);

    // Map WIP results to task-level balances (only for current page tasks)
    const wipByTask = mapWipResultsToBalances(wipResults, params.taskGSTaskIDs);

    // Aggregate all tasks to client-level WIP totals
    const clientWipBalances = aggregateWipBalances(wipResults);

    // Aggregate debtors across all service lines
    const debtorBalance = debtorResults.reduce((sum, row) => sum + row.TotalBalance, 0);

    const duration = Date.now() - startTime;

    // Performance logging
    logger.info('Client balances fetched from stored procedures', {
      clientCode: params.clientCode,
      taskCount: params.taskGSTaskIDs.length,
      wipResultCount: wipResults.length,
      debtorServiceLineCount: debtorResults.length,
      clientNetWip: clientWipBalances.netWip,
      debtorBalance,
      durationMs: duration,
      source: 'stored-procedures',
    });

    return {
      wipByTask,
      clientWipBalances,
      debtorBalance,
    };
  } catch (error) {
    logger.error('Failed to fetch client balances from stored procedures', {
      clientCode: params.clientCode,
      taskCount: params.taskGSTaskIDs.length,
      error,
    });
    throw error;
  }
}
