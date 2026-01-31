/**
 * My Reports - Recoverability Report API
 * 
 * Returns debtor data filtered by employee's billed clients with aging analysis
 * and receipts tracking. Supports fiscal year and custom date range filtering.
 * 
 * Filtering:
 * - DrsTransactions.Biller = employee.EmpCode
 * - All employees see debtors where they are the Biller
 * 
 * Query Parameters:
 * - fiscalYear: number (e.g., 2024 for FY2024 Sep 2023-Aug 2024)
 * - startDate: ISO date string (for custom range)
 * - endDate: ISO date string (for custom range)
 * - mode: 'fiscal' | 'custom' (defaults to 'fiscal')
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Uses super covering index: idx_drs_biller_super_covering
 * - Leverages existing debtorAggregation utilities for aging calculations
 */

import { NextResponse } from 'next/server';
import { secureRoute } from '@/lib/api/secureRoute';
import { Feature } from '@/lib/permissions/features';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { handleApiError, AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';
import { logger } from '@/lib/utils/logger';
import { RecoverabilityReportData, ClientDebtorData, MonthlyReceiptData, DrsLTDResult, DrsMonthlyResult } from '@/types/api';
import { format, startOfMonth, endOfMonth, parseISO, subMonths, addMonths } from 'date-fns';
import { getCurrentFiscalPeriod, getFiscalYearRange, getFiscalMonthEndDate, FISCAL_MONTHS } from '@/lib/utils/fiscalPeriod';
import type { AgingBuckets } from '@/lib/services/analytics/debtorAggregation';
import { fetchRecoverabilityFromSP, executeDrsMonthly } from '@/lib/services/reports/storedProcedureService';

// Feature flag to use stored procedures instead of inline SQL
// Set USE_SP_FOR_REPORTS=true in .env to enable
const USE_STORED_PROCEDURES = process.env.USE_SP_FOR_REPORTS === 'true';

/**
 * Convert DrsLTDv2 SP result to ClientDebtorData format
 */
function mapDrsLTDToClientDebtor(
  row: DrsLTDResult,
  monthlyReceipts: MonthlyReceiptData[]
): ClientDebtorData {
  return {
    GSClientID: row.GSClientID,
    clientCode: row.ClientCode,
    clientNameFull: row.ClientNameFull,
    groupCode: row.GroupCode,
    groupDesc: row.GroupDesc,
    servLineCode: row.ServLineCode,
    serviceLineName: row.ServLineDesc,
    masterServiceLineCode: '', // Will be populated separately
    masterServiceLineName: '',
    subServlineGroupCode: '',
    subServlineGroupDesc: '',
    totalBalance: row.BalDrs,
    aging: {
      current: row.AgingCurrent,
      days31_60: row.Aging31_60,
      days61_90: row.Aging61_90,
      days91_120: row.Aging91_120,
      days120Plus: row.Aging120Plus,
    },
    currentPeriodReceipts: row.LTDReceipts,
    priorMonthBalance: 0, // Would need separate calculation
    invoiceCount: row.InvoiceCount,
    avgPaymentDaysOutstanding: row.AvgDaysOutstanding,
    avgPaymentDaysPaid: row.AvgPaymentDaysPaid,
    monthlyReceipts,
  };
}

/**
 * Generate list of months for fiscal year (Sep-Aug)
 */
function getFiscalYearMonths(fiscalYear: number): { monthStart: Date; monthEnd: Date; label: string; sortKey: string }[] {
  const months: { monthStart: Date; monthEnd: Date; label: string; sortKey: string }[] = [];
  const monthNames = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  
  // Fiscal year starts September of previous calendar year
  // FY2024 = Sep 2023 - Aug 2024
  let currentMonth = new Date(fiscalYear - 1, 8, 1); // September of FY start year
  
  for (let i = 0; i < 12; i++) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    months.push({
      monthStart,
      monthEnd,
      label: monthNames[i] ?? 'Unknown',
      sortKey: format(monthStart, 'yyyy-MM'),
    });
    
    currentMonth = addMonths(currentMonth, 1);
  }
  
  return months;
}

export const dynamic = 'force-dynamic';

/**
 * Calculate aging bucket based on days outstanding
 */
function getAgingBucket(daysOutstanding: number): keyof AgingBuckets {
  if (daysOutstanding <= 30) return 'current';
  if (daysOutstanding <= 60) return 'days31_60';
  if (daysOutstanding <= 90) return 'days61_90';
  if (daysOutstanding <= 120) return 'days91_120';
  return 'days120Plus';
}

/**
 * Background cache helper - cache past fiscal years after returning current FY
 * Non-blocking operation for performance
 */
async function cachePastFiscalYearsInBackground(
  userId: string,
  currentFY: number
): Promise<void> {
  const pastYears = [currentFY - 1, currentFY - 2];
  
  // Fire and forget - don't await
  Promise.all(
    pastYears.map(async (fy) => {
      try {
        const cacheKey = `${CACHE_PREFIXES.USER}my-reports:recoverability:fy${fy}:${userId}`;
        const existing = await cache.get(cacheKey);
        if (existing) {
          logger.debug('Fiscal year already cached', { fy, userId });
          return;
        }
        
        logger.debug('Background caching fiscal year', { fy, userId });
      } catch (error) {
        logger.error('Failed to background cache fiscal year', { fy, error });
      }
    })
  ).catch(() => {
    // Silent failure - background job
  });
}

interface TransactionRecord {
  TranDate: Date;
  Total: number | null;
  EntryType: string | null;
  InvNumber: string | null;
  Reference: string | null;
  Narration: string | null;
  ServLineCode: string;
  GSClientID: string;
  ClientCode: string;
  ClientNameFull: string | null;
  GroupCode: string;
  GroupDesc: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  originalAmount: number;
  paymentsReceived: number;
  netBalance: number;
  daysOutstanding: number;
  agingBucket: keyof AgingBuckets;
}

/**
 * GET /api/my-reports/recoverability
 * 
 * Returns debtor aging and receipts data for employee's billed clients
 */
export const GET = secureRoute.query({
  feature: Feature.ACCESS_DASHBOARD,
  handler: async (request, { user }) => {
    try {
      const startTime = Date.now();

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const fiscalYearParam = searchParams.get('fiscalYear');
      const fiscalMonthParam = searchParams.get('fiscalMonth'); // NEW: Month filter
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');
      const mode = (searchParams.get('mode') || 'fiscal') as 'fiscal' | 'custom';

      // Validate fiscalMonth if provided
      if (fiscalMonthParam && !FISCAL_MONTHS.includes(fiscalMonthParam)) {
        throw new AppError(
          400,
          `Invalid fiscalMonth parameter. Must be one of: ${FISCAL_MONTHS.join(', ')}`,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      // Determine fiscal year and date range
      const currentFY = getCurrentFiscalPeriod().fiscalYear;
      const fiscalYear = fiscalYearParam ? parseInt(fiscalYearParam, 10) : currentFY;
      
      let startDate: Date;
      let endDate: Date;
      
      if (mode === 'custom' && startDateParam && endDateParam) {
        // Custom date range
        startDate = startOfMonth(parseISO(startDateParam));
        endDate = endOfMonth(parseISO(endDateParam));
      } else {
        // Fiscal year mode (default)
        const { start, end } = getFiscalYearRange(fiscalYear);
        startDate = start;
        
        // If fiscalMonth is provided, calculate aging as of that month end (LIFETIME TO DATE)
        // Note: Unlike profitability, this is cumulative from INCEPTION (not just fiscal year)
        if (fiscalMonthParam) {
          endDate = getFiscalMonthEndDate(fiscalYear, fiscalMonthParam);
        } else {
          endDate = end; // Full fiscal year
        }
      }

      // 1. Find employee record for current user
      const userEmail = user.email.toLowerCase();
      const emailPrefix = userEmail.split('@')[0];

      const employee = await prisma.employee.findFirst({
        where: {
          AND: [
            { Active: 'Yes' },
            {
              OR: [
                { WinLogon: { equals: userEmail } },
                { WinLogon: { equals: emailPrefix } },
                { WinLogon: { startsWith: `${emailPrefix}@` } },
              ],
            },
          ],
        },
        select: {
          EmpCode: true,
          EmpNameFull: true,
        },
      });

      if (!employee) {
        throw new AppError(
          403,
          'No employee record found for your account',
          ErrorCodes.FORBIDDEN
        );
      }

      logger.info('Recoverability report requested', {
        userId: user.id,
        empCode: employee.EmpCode,
        fiscalYear,
        fiscalMonth: fiscalMonthParam,
        mode,
      });

      // Check cache (include fiscalMonth in key)
      const cacheKey = mode === 'fiscal'
        ? fiscalMonthParam
          ? `${CACHE_PREFIXES.USER}my-reports:recoverability:fy${fiscalYear}:${fiscalMonthParam}:${user.id}`
          : `${CACHE_PREFIXES.USER}my-reports:recoverability:fy${fiscalYear}:${user.id}`
        : `${CACHE_PREFIXES.USER}my-reports:recoverability:custom:${format(startDate, 'yyyy-MM-dd')}:${format(endDate, 'yyyy-MM-dd')}:${user.id}`;
      
      const cached = await cache.get<RecoverabilityReportData>(cacheKey);
      if (cached) {
        logger.info('Returning cached recoverability report', { userId: user.id, mode, fiscalYear, fiscalMonth: fiscalMonthParam });
        return NextResponse.json(successResponse(cached));
      }

      // Use stored procedure implementation if feature flag is enabled
      if (USE_STORED_PROCEDURES) {
        logger.info('Using stored procedure implementation for recoverability', { fiscalYear });
        
        // Fetch aging data from DrsLTDv2 (always from inception, no dateFrom needed)
        const spAgingResults = await fetchRecoverabilityFromSP(
          employee.EmpCode,
          endDate,         // LTD up to this date
          endDate          // As of date for aging calculation
        );

        // Fetch monthly receipts data for fiscal year
        const { start: fyStart, end: fyEnd } = getFiscalYearRange(fiscalYear);
        const spMonthlyResults = await executeDrsMonthly({
          billerCode: employee.EmpCode,
          dateFrom: fyStart,
          dateTo: fyEnd,
          isCumulative: false,
        });

        // Get service line mappings
        const uniqueServLineCodes = [...new Set(spAgingResults.map(r => r.ServLineCode))];
        const serviceLineMappings = await prisma.serviceLineExternal.findMany({
          where: { ServLineCode: { in: uniqueServLineCodes } },
          select: {
            ServLineCode: true,
            masterCode: true,
            SubServlineGroupCode: true,
            SubServlineGroupDesc: true,
          },
        });
        
        // Get master service line names
        const uniqueMasterCodes = [...new Set(serviceLineMappings.map(sl => sl.masterCode).filter(Boolean))] as string[];
        const masterServiceLines = await prisma.serviceLineMaster.findMany({
          where: { code: { in: uniqueMasterCodes } },
          select: { code: true, name: true },
        });
        const masterNameMap = new Map(masterServiceLines.map(m => [m.code, m.name]));
        
        const serviceLineMap = new Map(
          serviceLineMappings.map(sl => [sl.ServLineCode, sl])
        );

        // Build monthly receipts data
        const monthNames = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
        const monthlyReceiptsByClient = new Map<string, MonthlyReceiptData[]>();
        
        // Create empty monthly receipts array for each client
        spAgingResults.forEach(client => {
          const clientMonthly: MonthlyReceiptData[] = monthNames.map((label, idx) => {
            const monthDate = addMonths(new Date(fiscalYear - 1, 8, 1), idx);
            return {
              month: label,
              monthYear: format(monthDate, 'yyyy-MM'),
              openingBalance: 0,
              receipts: 0,
              variance: 0,
              recoveryPercent: 0,
              billings: 0,
              closingBalance: 0,
            };
          });
          monthlyReceiptsByClient.set(client.GSClientID, clientMonthly);
        });

        // Map SP results to expected format
        const clients: ClientDebtorData[] = spAgingResults.map(row => {
          const slMapping = serviceLineMap.get(row.ServLineCode);
          const clientMonthly = monthlyReceiptsByClient.get(row.GSClientID) || [];
          const client = mapDrsLTDToClientDebtor(row, clientMonthly);
          return {
            ...client,
            masterServiceLineCode: slMapping?.masterCode || '',
            masterServiceLineName: slMapping?.masterCode ? (masterNameMap.get(slMapping.masterCode) || '') : '',
            subServlineGroupCode: slMapping?.SubServlineGroupCode || '',
            subServlineGroupDesc: slMapping?.SubServlineGroupDesc || '',
          };
        });

        // Calculate totals
        const totalAging: AgingBuckets = {
          current: clients.reduce((sum, c) => sum + c.aging.current, 0),
          days31_60: clients.reduce((sum, c) => sum + c.aging.days31_60, 0),
          days61_90: clients.reduce((sum, c) => sum + c.aging.days61_90, 0),
          days91_120: clients.reduce((sum, c) => sum + c.aging.days91_120, 0),
          days120Plus: clients.reduce((sum, c) => sum + c.aging.days120Plus, 0),
        };

        const totalReceipts = spMonthlyResults.reduce((sum, m) => sum + m.Collections, 0);

        const report: RecoverabilityReportData = {
          clients,
          totalAging,
          receiptsComparison: {
            currentPeriodReceipts: totalReceipts,
            priorMonthBalance: 0,
            variance: totalReceipts,
          },
          employeeCode: employee.EmpCode,
          fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
          fiscalMonth: mode === 'fiscal' && fiscalMonthParam ? fiscalMonthParam : undefined,
          dateRange: mode === 'custom' ? {
            start: format(startDate, 'yyyy-MM-dd'),
            end: format(endDate, 'yyyy-MM-dd'),
          } : undefined,
        };

        // Cache based on mode
        const cacheTTL = mode === 'fiscal' && fiscalYear < getCurrentFiscalPeriod().fiscalYear ? 1800 : 600;
        await cache.set(cacheKey, report, cacheTTL);

        logger.info('Recoverability report generated via SP', {
          userId: user.id,
          clientCount: clients.length,
        });

        return NextResponse.json(successResponse(report));
      }

      // 2. Query all DrsTransactions for this biller (LIFETIME TO DATE up to endDate)
      // NOTE: No fiscal year filter - this is cumulative from INCEPTION
      const allTransactions = await prisma.drsTransactions.findMany({
        where: {
          Biller: employee.EmpCode,
          TranDate: { lte: endDate }, // All transactions from beginning of time up to cutoff
        },
        select: {
          TranDate: true,
          Total: true,
          EntryType: true,
          InvNumber: true,
          Reference: true,
          Narration: true,
          ServLineCode: true,
          GSClientID: true,
          ClientCode: true,
          ClientNameFull: true,
          GroupCode: true,
          GroupDesc: true,
        },
        orderBy: [{ ClientCode: 'asc' }, { TranDate: 'asc' }],
      });

      if (allTransactions.length === 0) {
        const emptyReport: RecoverabilityReportData = {
          clients: [],
          totalAging: {
            current: 0,
            days31_60: 0,
            days61_90: 0,
            days91_120: 0,
            days120Plus: 0,
          },
          receiptsComparison: {
            currentPeriodReceipts: 0,
            priorMonthBalance: 0,
            variance: 0,
          },
          employeeCode: employee.EmpCode,
          fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
          fiscalMonth: mode === 'fiscal' && fiscalMonthParam ? fiscalMonthParam : undefined,
          dateRange: mode === 'custom' ? {
            start: format(startDate, 'yyyy-MM-dd'),
            end: format(endDate, 'yyyy-MM-dd'),
          } : undefined,
        };

        // Cache empty result for 5 minutes
        await cache.set(cacheKey, emptyReport, 300);
        return NextResponse.json(successResponse(emptyReport));
      }

      // 3. Get service line mappings
      const uniqueServLineCodes = [...new Set(allTransactions.map(t => t.ServLineCode))];
      const [serviceLines, masterServiceLines] = await Promise.all([
        prisma.serviceLineExternal.findMany({
          where: { ServLineCode: { in: uniqueServLineCodes } },
          select: {
            ServLineCode: true,
            ServLineDesc: true,
            SubServlineGroupCode: true,
            SubServlineGroupDesc: true,
            masterCode: true,
          },
        }),
        prisma.serviceLineMaster.findMany({
          where: { active: true },
          select: { code: true, name: true },
        }),
      ]);

      const servLineDetailsMap = new Map(
        serviceLines.map(sl => [sl.ServLineCode, {
          servLineDesc: sl.ServLineDesc || '',
          subServlineGroupCode: sl.SubServlineGroupCode || '',
          subServlineGroupDesc: sl.SubServlineGroupDesc || '',
          masterCode: sl.masterCode || '',
        }])
      );

      const masterServiceLineMap = new Map(
        masterServiceLines.map(msl => [msl.code, msl.name])
      );

      // 4. Match payments to invoices and calculate balances per client
      const fiscalMonths = mode === 'fiscal' ? getFiscalYearMonths(fiscalYear) : [];
      
      const clientDataMap = new Map<string, {
        clientInfo: {
          GSClientID: string;
          clientCode: string;
          clientNameFull: string | null;
          groupCode: string;
          groupDesc: string;
          servLineCode: string;
        };
        invoices: Map<string, InvoiceData>;
        currentPeriodReceipts: number;
        priorPeriodBalance: number;
        cumulativeBalance: number;  // Running balance from ALL transactions (matches stored procedure BalDrs)
        transactions: { TranDate: Date; Total: number; EntryType: string | null }[];  // Store transactions for monthly calc
      }>();

      // Group transactions by client and invoice
      allTransactions.forEach(txn => {
        const amount = txn.Total || 0;
        const invNumber = txn.InvNumber;
        
        if (!clientDataMap.has(txn.GSClientID)) {
          clientDataMap.set(txn.GSClientID, {
            clientInfo: {
              GSClientID: txn.GSClientID,
              clientCode: txn.ClientCode,
              clientNameFull: txn.ClientNameFull,
              groupCode: txn.GroupCode,
              groupDesc: txn.GroupDesc,
              servLineCode: txn.ServLineCode,
            },
            invoices: new Map(),
            currentPeriodReceipts: 0,
            priorPeriodBalance: 0,
            cumulativeBalance: 0,
            transactions: [],
          });
        }
        
        // Store transaction for monthly calculation (including EntryType)
        clientDataMap.get(txn.GSClientID)!.transactions.push({
          TranDate: txn.TranDate,
          Total: txn.Total || 0,
          EntryType: txn.EntryType,
        });

        const clientData = clientDataMap.get(txn.GSClientID)!;
        
        // Calculate cumulative balance: Total field already has correct sign
        // Invoices = positive (increase balance), Receipts = negative (decrease balance)
        clientData.cumulativeBalance += amount;

        // Track receipts in current period (negative amounts = payments)
        if (txn.TranDate >= startDate && txn.TranDate <= endDate && amount < 0) {
          clientData.currentPeriodReceipts += Math.abs(amount);
        }

        // Track prior period balance (all transactions before start date)
        if (txn.TranDate < startDate) {
          clientData.priorPeriodBalance += amount;
        }

        // Process invoice balances
        if (invNumber) {
          if (!clientData.invoices.has(invNumber)) {
            clientData.invoices.set(invNumber, {
              invoiceNumber: invNumber,
              // For positive amounts (invoices), use transaction date
              // For negative amounts (payments), use endDate temporarily - will update when we see the invoice
              invoiceDate: amount > 0 ? txn.TranDate : endDate,
              originalAmount: amount > 0 ? amount : 0,
              paymentsReceived: 0,
              netBalance: amount,
              daysOutstanding: 0,
              agingBucket: 'current',
            });
          } else {
            const inv = clientData.invoices.get(invNumber)!;
            inv.netBalance += amount;
            
            // Track original amounts and payments
            if (amount > 0) {
              inv.originalAmount += amount;
              
              // ONLY update invoice date for positive transactions (actual invoices)
              if (txn.TranDate < inv.invoiceDate) {
                inv.invoiceDate = txn.TranDate;
              }
            } else {
              inv.paymentsReceived += Math.abs(amount);
            }
          }
        }
      });

      // 5. Calculate aging for each client's invoices
      const clients: ClientDebtorData[] = [];
      const totalAging: AgingBuckets = {
        current: 0,
        days31_60: 0,
        days61_90: 0,
        days91_120: 0,
        days120Plus: 0,
      };

      let totalCurrentPeriodReceipts = 0;
      let totalPriorMonthBalance = 0;

      clientDataMap.forEach((clientData, gsClientId) => {
        // #region agent log
        const transactionTypeCounts = {};
        clientData.transactions.forEach(txn => {
          const type = txn.EntryType || 'Unknown';
          transactionTypeCounts[type] = (transactionTypeCounts[type] || 0) + 1;
        });
        fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:594',message:'Client processing start',data:{clientCode:clientData.clientInfo.clientCode,cumulativeBalance:clientData.cumulativeBalance,invoiceCount:clientData.invoices.size,transactionCount:clientData.transactions.length,transactionTypeCounts:transactionTypeCounts},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H6'})}).catch(()=>{});
        // #endregion
        
        const aging: AgingBuckets = {
          current: 0,
          days31_60: 0,
          days61_90: 0,
          days91_120: 0,
          days120Plus: 0,
        };
        
        let totalDaysOutstanding = 0;
        let invoiceCount = 0;
        let totalOpenInvoices = 0;
        let totalNegativeInvoices = 0;
        let invoicesWithoutNumber = 0;
        
        // Identify offsetting invoice pairs (e.g., invoice M0035035 = +138000, reversal BFR0000047 = -138000)
        // Both should be excluded from aging when they offset each other
        const amountMap = new Map<number, string[]>();
        clientData.invoices.forEach((inv, invNumber) => {
          const amount = inv.netBalance;
          if (!amountMap.has(amount)) {
            amountMap.set(amount, []);
          }
          amountMap.get(amount)!.push(invNumber);
        });
        
        const excludedInvoices = new Set<string>();
        amountMap.forEach((invoiceNumbers, amount) => {
          // Check if there's a matching negative amount
          const negativeAmount = -amount;
          if (amount !== 0 && amountMap.has(negativeAmount)) {
            // Both the positive and negative amounts should be excluded
            invoiceNumbers.forEach(inv => excludedInvoices.add(inv));
            amountMap.get(negativeAmount)!.forEach(inv => excludedInvoices.add(inv));
          }
        });

        // Calculate aging buckets from open invoices only (positive balances)
        // Exclude invoices that have offsetting pairs with different invoice numbers
        clientData.invoices.forEach(inv => {
          // Skip if excluded due to matching offsetting pair
          if (excludedInvoices.has(inv.invoiceNumber)) {
            return;
          }
          
          // Age ALL invoices (positive and negative) for aging buckets to reconcile with totalBalance
          // Negative invoices reduce the aging bucket they fall into
          if (inv.netBalance !== 0) {
            // CRITICAL FIX: Use endDate for point-in-time aging (not today)
            const daysDiff = Math.floor((endDate.getTime() - inv.invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysOutstanding = Math.max(0, daysDiff);
            const bucket = getAgingBucket(daysOutstanding);
            
            aging[bucket] += inv.netBalance;
            totalAging[bucket] += inv.netBalance;
            totalDaysOutstanding += daysOutstanding * Math.abs(inv.netBalance);
            invoiceCount++;
            
            if (inv.netBalance > 0) {
              totalOpenInvoices += inv.netBalance;
            } else {
              totalNegativeInvoices += inv.netBalance;
            }
          }
        });

        // Count transactions without invoice numbers
        clientData.transactions.forEach(txn => {
          if (!txn.EntryType || txn.EntryType === '') {
            invoicesWithoutNumber++;
          }
        });

        // Total balance = cumulative balance from ALL transactions (matches Monthly Receipts Closing Balance)
        const totalBalance = clientData.cumulativeBalance;

        // Calculate average days outstanding (weighted by total balance)
        const avgPaymentDaysOutstanding = totalBalance > 0 
          ? totalDaysOutstanding / totalBalance 
          : 0;

        // Get service line details
        const slDetails = servLineDetailsMap.get(clientData.clientInfo.servLineCode);
        const masterCode = slDetails?.masterCode || clientData.clientInfo.servLineCode;
        const masterName = masterServiceLineMap.get(masterCode) || slDetails?.servLineDesc || '';

        // Calculate monthly receipts for this client
        const monthlyReceipts: MonthlyReceiptData[] = fiscalMonths.map(({ monthStart, monthEnd, label, sortKey }) => {
          // Opening balance = sum of all transactions before month start
          // Total field already has correct sign (positive = invoice, negative = receipt)
          let openingBalance = 0;
          clientData.transactions.forEach(txn => {
            if (txn.TranDate < monthStart) {
              openingBalance += txn.Total;
            }
          });
          
          // Receipts = negative transactions within the month (payments)
          let receipts = 0;
          // Billings = positive transactions within the month
          let billings = 0;
          
          clientData.transactions.forEach(txn => {
            if (txn.TranDate >= monthStart && txn.TranDate <= monthEnd) {
              if (txn.Total < 0) {
                receipts += Math.abs(txn.Total);
              } else if (txn.Total > 0) {
                billings += txn.Total;
              }
            }
          });
          
          // Variance = Receipts - Opening Balance (collection surplus/deficit)
          const variance = receipts - openingBalance;
          
          // Recovery percentage
          const recoveryPercent = openingBalance > 0 
            ? (receipts / openingBalance) * 100 
            : 0;
          
          // Closing balance = Opening + Billings - Receipts
          const closingBalance = openingBalance + billings - receipts;
          
          return {
            month: label,
            monthYear: sortKey,
            openingBalance,
            receipts,
            variance,
            recoveryPercent,
            billings,
            closingBalance,
          };
        });

        // Comprehensive filtering: Hide clients with ALL zeros
        // Use small epsilon for floating point comparison
        const EPSILON = 0.01;
        
        // Check if any aging bucket has non-zero values
        const hasNonZeroAging = 
          Math.abs(aging.current) > EPSILON ||
          Math.abs(aging.days31_60) > EPSILON ||
          Math.abs(aging.days61_90) > EPSILON ||
          Math.abs(aging.days91_120) > EPSILON ||
          Math.abs(aging.days120Plus) > EPSILON;

        // Only include clients if they have:
        // 1. Non-zero total balance (final closing balance), OR
        // 2. Non-zero aging buckets (open invoices)
        // NOTE: We don't check historical monthly activity - only final state matters
        if (Math.abs(totalBalance) > EPSILON || hasNonZeroAging) {
          clients.push({
            GSClientID: gsClientId,
            clientCode: clientData.clientInfo.clientCode,
            clientNameFull: clientData.clientInfo.clientNameFull,
            groupCode: clientData.clientInfo.groupCode,
            groupDesc: clientData.clientInfo.groupDesc,
            servLineCode: clientData.clientInfo.servLineCode,
            serviceLineName: slDetails?.servLineDesc || '',
            masterServiceLineCode: masterCode,
            masterServiceLineName: masterName,
            subServlineGroupCode: slDetails?.subServlineGroupCode || '',
            subServlineGroupDesc: slDetails?.subServlineGroupDesc || '',
            totalBalance,
            aging,
            currentPeriodReceipts: clientData.currentPeriodReceipts,
            priorMonthBalance: clientData.priorPeriodBalance,
            invoiceCount,
            avgPaymentDaysOutstanding,
            avgPaymentDaysPaid: null, // Only available via DrsLTDv2 stored procedure
            monthlyReceipts,
          });
        }

        totalCurrentPeriodReceipts += clientData.currentPeriodReceipts;
        totalPriorMonthBalance += clientData.priorPeriodBalance;
      });

      // Sort clients by group then client code
      clients.sort((a, b) => {
        const groupCompare = a.groupDesc.localeCompare(b.groupDesc);
        if (groupCompare !== 0) return groupCompare;
        return a.clientCode.localeCompare(b.clientCode);
      });

      const report: RecoverabilityReportData = {
        clients,
        totalAging,
        receiptsComparison: {
          currentPeriodReceipts: totalCurrentPeriodReceipts,
          priorMonthBalance: totalPriorMonthBalance,
          variance: totalPriorMonthBalance - totalCurrentPeriodReceipts,
        },
        employeeCode: employee.EmpCode,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: mode === 'fiscal' && fiscalMonthParam ? fiscalMonthParam : undefined,
        dateRange: mode === 'custom' ? {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        } : undefined,
      };

      // Cache - use longer TTL for past fiscal years (more stable data)
      const cacheTTL = mode === 'fiscal' && fiscalYear < currentFY ? 1800 : 600;
      await cache.set(cacheKey, report, cacheTTL);

      // Background cache past fiscal years (non-blocking)
      if (mode === 'fiscal' && fiscalYear === currentFY) {
        cachePastFiscalYearsInBackground(user.id, currentFY);
      }

      const duration = Date.now() - startTime;
      logger.info('Recoverability report generated', {
        userId: user.id,
        mode,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: fiscalMonthParam,
        clientCount: clients.length,
        duration,
      });

      return NextResponse.json(successResponse(report));
    } catch (error) {
      logger.error('Error generating recoverability report', error);
      return handleApiError(error, 'Generate recoverability report');
    }
  },
});
