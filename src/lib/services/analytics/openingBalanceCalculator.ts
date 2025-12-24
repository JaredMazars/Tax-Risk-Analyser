/**
 * Opening Balance Calculator
 * 
 * Efficiently calculates WIP opening balances from database aggregates
 * instead of fetching and processing thousands of individual transactions.
 * 
 * IMPORTANT: This must match the calculation logic in calculateWIPBalances()
 */

import { categorizeTransaction } from '@/lib/services/clients/clientBalanceCalculation';

type AggregateResult = {
  TType: string;
  TranType: string;
  _sum: {
    Amount: number | null;
  };
};

/**
 * Calculate opening WIP balance from aggregated transaction data
 * 
 * Formula (matching calculateWIPBalances):
 * - Gross WIP = time + timeAdjustments + disbursements + disbursementAdjustments - fees
 * - Net WIP = Gross WIP + provision
 * 
 * @param aggregates - Aggregated transaction data grouped by TType and TranType
 * @returns Opening WIP balance (Net WIP)
 */
export function calculateOpeningBalanceFromAggregates(
  aggregates: AggregateResult[]
): number {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openingBalanceCalculator.ts:32',message:'Function entry',data:{aggregatesCount:aggregates?.length,isArray:Array.isArray(aggregates),firstAggregate:aggregates?.[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H3,H5'})}).catch(()=>{});
  // #endregion
  
  let time = 0;
  let timeAdjustments = 0;
  let disbursements = 0;
  let disbursementAdjustments = 0;
  let fees = 0;
  let provision = 0;

  for (const agg of aggregates) {
    const amount = agg._sum.Amount ?? 0;
    const category = categorizeTransaction(agg.TType, agg.TranType);
    const tranTypeUpper = agg.TranType?.toUpperCase() || '';
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openingBalanceCalculator.ts:50',message:'Processing aggregate',data:{TType:agg.TType,TranType:agg.TranType,amount,category,sumAmount:agg._sum?.Amount},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H3,H5'})}).catch(()=>{});
    // #endregion

    if (category.isProvision) {
      // Provision tracked separately
      provision += amount;
    } else if (category.isFee) {
      // Fees are reversed (subtracted)
      fees += amount;
    } else if (category.isAdjustment) {
      // Adjustment transactions - differentiate by TranType
      if (tranTypeUpper.includes('TIME')) {
        timeAdjustments += amount;
      } else if (tranTypeUpper.includes('DISBURSEMENT') || tranTypeUpper.includes('DISB')) {
        disbursementAdjustments += amount;
      }
    } else if (category.isTime) {
      // Time transactions
      time += amount;
    } else if (category.isDisbursement) {
      // Disbursement transactions
      disbursements += amount;
    } else {
      // Other transactions default to time-like behavior
      time += amount;
    }
  }

  // Calculate WIP using the same formula as calculateWIPBalances()
  // Gross WIP = Time + Time Adjustments + Disbursements + Disbursement Adjustments - Fees
  const grossWip = time + timeAdjustments + disbursements + disbursementAdjustments - fees;
  
  // Net WIP = Gross WIP + Provision (provisions are ADDED, not subtracted!)
  const netWip = grossWip + provision;

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openingBalanceCalculator.ts:92',message:'Function exit',data:{time,timeAdjustments,disbursements,disbursementAdjustments,fees,provision,grossWip,netWip},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H3'})}).catch(()=>{});
  // #endregion

  return netWip;
}

