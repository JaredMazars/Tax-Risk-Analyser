/**
 * WIP Transaction Aggregation Utilities
 * 
 * Aggregates WIPTransactions data to replicate the structure of the Wip table
 * for profitability calculations
 */

export interface WipTransactionRecord {
  TaskServLine: string;
  Amount: number | null;
  Cost: number;
  Hour: number;
  TType: string;
  TranType: string;
  updatedAt: Date;
}

export interface AggregatedWipData {
  ltdTime: number;
  ltdAdjTime: number;
  ltdAdjDisb: number;
  ltdCost: number;
  balWIP: number;
  balTime: number;
  balDisb: number;
  wipProvision: number;
  ltdDisb: number;
  ltdFeeTime: number;
  ltdFeeDisb: number;
  ltdHours: number;
  taskCount: number;
}

/**
 * Transaction Type Classification
 * Based on actual database TType codes
 */
const TTYPE_CATEGORIES = {
  TIME: ['T', 'TI', 'TIM'], // Time transactions
  DISBURSEMENT: ['D', 'DI', 'DIS'], // Disbursement transactions
  FEE: ['F', 'FEE'], // Fee transactions (reversed)
  ADJUSTMENT: ['ADJ'], // Adjustment transactions (differentiated by TranType)
  PROVISION: ['P', 'PRO'], // Provision transactions
};

/**
 * Categorize a transaction type
 */
function categorizeTransaction(tType: string, tranType?: string): {
  isTime: boolean;
  isDisbursement: boolean;
  isFee: boolean;
  isAdjustment: boolean;
  isProvision: boolean;
} {
  const tTypeUpper = tType.toUpperCase();
  
  return {
    isTime: TTYPE_CATEGORIES.TIME.includes(tTypeUpper) || tTypeUpper.startsWith('T'),
    isDisbursement: TTYPE_CATEGORIES.DISBURSEMENT.includes(tTypeUpper) || tTypeUpper.startsWith('D'),
    isFee: TTYPE_CATEGORIES.FEE.includes(tTypeUpper) || tTypeUpper === 'F',
    isAdjustment: TTYPE_CATEGORIES.ADJUSTMENT.includes(tTypeUpper) || tTypeUpper === 'ADJ',
    isProvision: TTYPE_CATEGORIES.PROVISION.includes(tTypeUpper) || tTypeUpper === 'P',
  };
}

/**
 * Aggregate WIP transactions by service line
 * 
 * @param transactions - Array of WIP transaction records
 * @param serviceLineMap - Map of TaskServLine codes to Master Service Line codes
 * @returns Map of Master Service Line code to aggregated data
 */
export function aggregateWipTransactionsByServiceLine(
  transactions: WipTransactionRecord[],
  serviceLineMap: Map<string, string>
): Map<string, AggregatedWipData> {
  const groupedData = new Map<string, AggregatedWipData>();

  transactions.forEach((transaction) => {
    const masterCode = serviceLineMap.get(transaction.TaskServLine) || 'UNKNOWN';
    
    if (!groupedData.has(masterCode)) {
      groupedData.set(masterCode, {
        ltdTime: 0,
        ltdAdjTime: 0,
        ltdAdjDisb: 0,
        ltdCost: 0,
        balWIP: 0,
        balTime: 0,
        balDisb: 0,
        wipProvision: 0,
        ltdDisb: 0,
        ltdFeeTime: 0,
        ltdFeeDisb: 0,
        ltdHours: 0,
        taskCount: 0,
      });
    }

    const group = groupedData.get(masterCode)!;
    const amount = transaction.Amount || 0;
    const cost = transaction.Cost || 0;
    const hours = transaction.Hour || 0;
    
    const category = categorizeTransaction(transaction.TType, transaction.TranType);
    const tranTypeUpper = transaction.TranType.toUpperCase();

    // Accumulate cost (all transactions except provisions)
    if (!category.isProvision) {
      group.ltdCost += cost;
    }

    // Process based on transaction type
    if (category.isProvision) {
      // Provision transactions
      group.wipProvision += amount;
    } else if (category.isFee) {
      // Fee transactions (reversed) - differentiate by TranType
      if (tranTypeUpper.includes('TIME') || tranTypeUpper.includes('REVT')) {
        group.ltdFeeTime += amount;
        group.balTime -= amount;
      } else if (tranTypeUpper.includes('DISB') || tranTypeUpper.includes('REVD')) {
        group.ltdFeeDisb += amount;
        group.balDisb -= amount;
      }
      group.balWIP -= amount;
    } else if (category.isAdjustment) {
      // Adjustment transactions - differentiate by TranType
      if (tranTypeUpper.includes('TIME')) {
        // Time adjustments
        group.ltdAdjTime += amount;
        group.balTime += amount;
      } else if (tranTypeUpper.includes('DISBURSEMENT') || tranTypeUpper.includes('DISB')) {
        // Disbursement adjustments
        group.ltdAdjDisb += amount;
        group.balDisb += amount;
      }
      group.balWIP += amount;
    } else if (category.isTime) {
      // Time transactions - only accumulate hours for time transactions
      group.ltdTime += amount;
      group.balTime += amount;
      group.balWIP += amount;
      group.ltdHours += hours;
    } else if (category.isDisbursement) {
      // Disbursement transactions
      group.ltdDisb += amount;
      group.balDisb += amount;
      group.balWIP += amount;
    } else {
      // Other transactions (default to time-like behavior)
      group.ltdTime += amount;
      group.balTime += amount;
      group.balWIP += amount;
    }
  });

  return groupedData;
}

/**
 * Aggregate overall WIP data from all transactions
 * 
 * @param transactions - Array of WIP transaction records
 * @returns Overall aggregated data
 */
export function aggregateOverallWipData(
  transactions: WipTransactionRecord[]
): AggregatedWipData {
  const overall: AggregatedWipData = {
    ltdTime: 0,
    ltdAdjTime: 0,
    ltdAdjDisb: 0,
    ltdCost: 0,
    balWIP: 0,
    balTime: 0,
    balDisb: 0,
    wipProvision: 0,
    ltdDisb: 0,
    ltdFeeTime: 0,
    ltdFeeDisb: 0,
    ltdHours: 0,
    taskCount: 0,
  };

  transactions.forEach((transaction) => {
    const amount = transaction.Amount || 0;
    const cost = transaction.Cost || 0;
    const hours = transaction.Hour || 0;
    
    const category = categorizeTransaction(transaction.TType, transaction.TranType);
    const tranTypeUpper = transaction.TranType.toUpperCase();

    // Accumulate cost (all transactions except provisions)
    if (!category.isProvision) {
      overall.ltdCost += cost;
    }

    // Process based on transaction type
    if (category.isProvision) {
      // Provision transactions
      overall.wipProvision += amount;
    } else if (category.isFee) {
      // Fee transactions (reversed) - differentiate by TranType
      if (tranTypeUpper.includes('TIME') || tranTypeUpper.includes('REVT')) {
        overall.ltdFeeTime += amount;
        overall.balTime -= amount;
      } else if (tranTypeUpper.includes('DISB') || tranTypeUpper.includes('REVD')) {
        overall.ltdFeeDisb += amount;
        overall.balDisb -= amount;
      }
      overall.balWIP -= amount;
    } else if (category.isAdjustment) {
      // Adjustment transactions - differentiate by TranType
      if (tranTypeUpper.includes('TIME')) {
        // Time adjustments
        overall.ltdAdjTime += amount;
        overall.balTime += amount;
      } else if (tranTypeUpper.includes('DISBURSEMENT') || tranTypeUpper.includes('DISB')) {
        // Disbursement adjustments
        overall.ltdAdjDisb += amount;
        overall.balDisb += amount;
      }
      overall.balWIP += amount;
    } else if (category.isTime) {
      // Time transactions - only accumulate hours for time transactions
      overall.ltdTime += amount;
      overall.balTime += amount;
      overall.balWIP += amount;
      overall.ltdHours += hours;
    } else if (category.isDisbursement) {
      // Disbursement transactions
      overall.ltdDisb += amount;
      overall.balDisb += amount;
      overall.balWIP += amount;
    } else {
      // Other transactions (default to time-like behavior)
      overall.ltdTime += amount;
      overall.balTime += amount;
      overall.balWIP += amount;
    }
  });

  return overall;
}

/**
 * Count unique tasks from transaction records
 * 
 * @param transactions - Array of WIP transaction records with GSTaskID
 * @returns Number of unique tasks
 */
export function countUniqueTasks(transactions: Array<{ GSTaskID: string }>): number {
  const uniqueTasks = new Set(transactions.map(t => t.GSTaskID));
  return uniqueTasks.size;
}

