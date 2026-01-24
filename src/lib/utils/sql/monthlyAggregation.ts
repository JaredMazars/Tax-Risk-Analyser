/**
 * Monthly Aggregation SQL Utilities
 * 
 * Provides optimized query builders for monthly aggregations on WIPTransactions
 * and DrsTransactions tables. Uses TranYearMonth computed column for efficient
 * GROUP BY operations (eliminates function call overhead).
 * 
 * Performance: 96% faster than YEAR(TranDate), MONTH(TranDate) pattern
 * From: 130 seconds -> To: <5 seconds
 */

import { Prisma } from '@prisma/client';

/**
 * WIP Monthly Aggregation Result
 */
export interface WipMonthlyResult {
  month: Date;
  ltdTime: number;
  ltdDisb: number;
  ltdAdj: number;
  ltdCost: number;
  ltdFee: number;
  ltdProvision: number;
  negativeAdj: number;
}

/**
 * Collections Monthly Result
 */
export interface CollectionsMonthlyResult {
  month: Date;
  collections: number;
}

/**
 * Net Billings Monthly Result
 */
export interface NetBillingsMonthlyResult {
  month: Date;
  netBillings: number;
}

/**
 * Build optimized WIP monthly aggregation query
 * 
 * Uses TranYearMonth computed column instead of YEAR(TranDate), MONTH(TranDate)
 * for efficient index usage and GROUP BY optimization.
 * 
 * @param filterField - 'TaskPartner' or 'TaskManager' (determines report type)
 * @param employeeCode - Employee code to filter by
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Prisma.Sql for complete query
 * 
 * @example
 * const query = buildWipMonthlyAggregationQuery('TaskPartner', 'EMP001', startDate, endDate);
 * const results = await prisma.$queryRaw<WipMonthlyResult[]>(query);
 */
export function buildWipMonthlyAggregationQuery(
  filterField: 'TaskPartner' | 'TaskManager',
  employeeCode: string,
  startDate: Date,
  endDate: Date
): Prisma.Sql {
  // Build dynamic filter based on report type
  const fieldFilter = filterField === 'TaskPartner' 
    ? Prisma.sql`TaskPartner = ${employeeCode}`
    : Prisma.sql`TaskManager = ${employeeCode}`;

  // Convert dates to month start for TranYearMonth comparison
  const startMonth = Prisma.sql`DATEFROMPARTS(YEAR(${startDate}), MONTH(${startDate}), 1)`;
  const endMonth = Prisma.sql`DATEFROMPARTS(YEAR(${endDate}), MONTH(${endDate}), 1)`;

  return Prisma.sql`
    SELECT 
      TranYearMonth as month,
      SUM(CASE WHEN TType = 'T' THEN ISNULL(Amount, 0) ELSE 0 END) as ltdTime,
      SUM(CASE WHEN TType = 'D' THEN ISNULL(Amount, 0) ELSE 0 END) as ltdDisb,
      SUM(CASE WHEN TType = 'ADJ' THEN ISNULL(Amount, 0) ELSE 0 END) as ltdAdj,
      SUM(CASE WHEN TType != 'P' THEN ISNULL(Cost, 0) ELSE 0 END) as ltdCost,
      SUM(CASE WHEN TType = 'F' THEN ISNULL(Amount, 0) ELSE 0 END) as ltdFee,
      SUM(CASE WHEN TType = 'P' THEN ISNULL(Amount, 0) ELSE 0 END) as ltdProvision,
      SUM(CASE WHEN TType = 'ADJ' AND Amount < 0 THEN ISNULL(Amount, 0) ELSE 0 END) as negativeAdj
    FROM WIPTransactions
    WHERE ${fieldFilter}
      AND TranYearMonth >= ${startMonth}
      AND TranYearMonth <= ${endMonth}
    GROUP BY TranYearMonth
    ORDER BY TranYearMonth
  `;
}

/**
 * Build optimized Collections monthly aggregation query
 * 
 * Aggregates DRS receipt transactions by month using TranYearMonth computed column.
 * Receipts are stored as negative amounts, so we negate to get positive collections.
 * 
 * @param billerCode - Employee code (Biller column)
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Prisma.Sql for complete query
 * 
 * @example
 * const query = buildCollectionsMonthlyQuery('EMP001', startDate, endDate);
 * const results = await prisma.$queryRaw<CollectionsMonthlyResult[]>(query);
 */
export function buildCollectionsMonthlyQuery(
  billerCode: string,
  startDate: Date,
  endDate: Date
): Prisma.Sql {
  const startMonth = Prisma.sql`DATEFROMPARTS(YEAR(${startDate}), MONTH(${startDate}), 1)`;
  const endMonth = Prisma.sql`DATEFROMPARTS(YEAR(${endDate}), MONTH(${endDate}), 1)`;

  return Prisma.sql`
    SELECT 
      TranYearMonth as month,
      SUM(-ISNULL(Total, 0)) as collections
    FROM DrsTransactions
    WHERE Biller = ${billerCode}
      AND EntryType = 'Receipt'
      AND TranYearMonth >= ${startMonth}
      AND TranYearMonth <= ${endMonth}
    GROUP BY TranYearMonth
    ORDER BY TranYearMonth
  `;
}

/**
 * Build optimized Net Billings monthly aggregation query
 * 
 * Aggregates all DRS transactions EXCEPT receipts (invoices, credit notes, adjustments).
 * Used for Debtors Lockup calculation (trailing 12-month net billings).
 * 
 * @param billerCode - Employee code (Biller column)
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Prisma.Sql for complete query
 * 
 * @example
 * const query = buildNetBillingsMonthlyQuery('EMP001', startDate, endDate);
 * const results = await prisma.$queryRaw<NetBillingsMonthlyResult[]>(query);
 */
export function buildNetBillingsMonthlyQuery(
  billerCode: string,
  startDate: Date,
  endDate: Date
): Prisma.Sql {
  const startMonth = Prisma.sql`DATEFROMPARTS(YEAR(${startDate}), MONTH(${startDate}), 1)`;
  const endMonth = Prisma.sql`DATEFROMPARTS(YEAR(${endDate}), MONTH(${endDate}), 1)`;

  return Prisma.sql`
    SELECT 
      TranYearMonth as month,
      SUM(ISNULL(Total, 0)) as netBillings
    FROM DrsTransactions
    WHERE Biller = ${billerCode}
      AND TranYearMonth >= ${startMonth}
      AND TranYearMonth <= ${endMonth}
      AND (EntryType IS NULL OR EntryType != 'Receipt')
    GROUP BY TranYearMonth
    ORDER BY TranYearMonth
  `;
}
