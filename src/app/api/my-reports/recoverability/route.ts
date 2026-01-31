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
import { 
  fetchRecoverabilityFromSP, 
  executeDrsMonthly,
  executeRecoverabilityData,
} from '@/lib/services/reports/storedProcedureService';
import type { RecoverabilityDataResult } from '@/types/api';

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

      // Use stored procedure for recoverability report (single SP for both aging and receipts)
      logger.info('Using sp_RecoverabilityData for recoverability report', { fiscalYear, fiscalMonth: fiscalMonthParam });
        
        // Fetch aging data with current period metrics (last 30 days)
        const agingResults = await executeRecoverabilityData({
          billerCode: employee.EmpCode,
          asOfDate: endDate,  // Use selected month for aging snapshot
        });

        // Group aging by client (merge service lines)
        const clientMap = new Map<string, ClientDebtorData>();
        const EPSILON = 0.01;
        
        // Determine month label for receipts display
        const monthLabel = fiscalMonthParam || 'Current';
        
        agingResults.forEach(row => {
          const key = row.GSClientID;
          
          // Create synthetic monthly receipt entry from current period fields
          const syntheticMonthlyReceipt: MonthlyReceiptData = {
            month: monthLabel,
            monthYear: format(endDate, 'yyyy-MM'),
            openingBalance: row.PriorMonthBalance,       // Balance 30 days ago
            receipts: row.CurrentPeriodReceipts,         // Last 30 days receipts
            billings: row.CurrentPeriodBillings,         // Last 30 days billings
            closingBalance: row.TotalBalance,            // Current balance
            variance: row.CurrentPeriodReceipts - row.PriorMonthBalance,
            recoveryPercent: row.PriorMonthBalance > 0 
              ? (row.CurrentPeriodReceipts / row.PriorMonthBalance) * 100 
              : 0,
          };
          
          if (!clientMap.has(key)) {
            // First service line for this client - create new record
            clientMap.set(key, {
              GSClientID: row.GSClientID,
              clientCode: row.ClientCode,
              clientNameFull: row.ClientNameFull,
              groupCode: row.GroupCode,
              groupDesc: row.GroupDesc,
              servLineCode: row.ServLineCode,
              serviceLineName: row.ServLineDesc,
              masterServiceLineCode: row.MasterServiceLineCode,
              masterServiceLineName: row.MasterServiceLineName,
              subServlineGroupCode: row.SubServlineGroupCode,
              subServlineGroupDesc: row.SubServlineGroupDesc,
              totalBalance: row.TotalBalance,
              aging: {
                current: row.AgingCurrent,
                days31_60: row.Aging31_60,
                days61_90: row.Aging61_90,
                days91_120: row.Aging91_120,
                days120Plus: row.Aging120Plus,
              },
              currentPeriodReceipts: row.CurrentPeriodReceipts,
              priorMonthBalance: row.PriorMonthBalance,
              invoiceCount: row.InvoiceCount,
              avgPaymentDaysOutstanding: row.AvgDaysOutstanding,
              avgPaymentDaysPaid: null,
              monthlyReceipts: [syntheticMonthlyReceipt],
            });
          } else {
            // Additional service line - merge into existing client
            const existing = clientMap.get(key)!;
            
            // Add this service line's balances to existing totals
            existing.totalBalance += row.TotalBalance;
            existing.aging.current += row.AgingCurrent;
            existing.aging.days31_60 += row.Aging31_60;
            existing.aging.days61_90 += row.Aging61_90;
            existing.aging.days91_120 += row.Aging91_120;
            existing.aging.days120Plus += row.Aging120Plus;
            existing.currentPeriodReceipts += row.CurrentPeriodReceipts;
            existing.priorMonthBalance += row.PriorMonthBalance;
            existing.invoiceCount += row.InvoiceCount;
            
            // Aggregate monthly receipt entry (only one entry per client)
            const monthlyReceipt = existing.monthlyReceipts[0];
            if (monthlyReceipt) {
              monthlyReceipt.openingBalance += syntheticMonthlyReceipt.openingBalance;
              monthlyReceipt.receipts += syntheticMonthlyReceipt.receipts;
              monthlyReceipt.billings += syntheticMonthlyReceipt.billings;
              monthlyReceipt.closingBalance += syntheticMonthlyReceipt.closingBalance;
              monthlyReceipt.variance = monthlyReceipt.receipts - monthlyReceipt.openingBalance;
              // Recalculate recovery percent after aggregation
              const opening = monthlyReceipt.openingBalance;
              const receipts = monthlyReceipt.receipts;
              monthlyReceipt.recoveryPercent = 
                opening > 0 ? (receipts / opening) * 100 : 0;
            }
            
            // Use service line with largest balance as primary display
            const currentBalanceAbs = Math.abs(row.TotalBalance);
            const existingBalanceAbs = Math.abs(existing.totalBalance - row.TotalBalance);
            
            if (currentBalanceAbs > existingBalanceAbs) {
              existing.servLineCode = row.ServLineCode;
              existing.serviceLineName = row.ServLineDesc;
              existing.masterServiceLineCode = row.MasterServiceLineCode;
              existing.masterServiceLineName = row.MasterServiceLineName;
              existing.subServlineGroupCode = row.SubServlineGroupCode;
              existing.subServlineGroupDesc = row.SubServlineGroupDesc;
            }
          }
        });

        // Filter clients and sort
        const clients: ClientDebtorData[] = Array.from(clientMap.values())
          .filter(client => {
            // Apply epsilon filter: include clients with closing balance or aging
            const hasNonZeroAging = 
              Math.abs(client.aging.current) > EPSILON ||
              Math.abs(client.aging.days31_60) > EPSILON ||
              Math.abs(client.aging.days61_90) > EPSILON ||
              Math.abs(client.aging.days91_120) > EPSILON ||
              Math.abs(client.aging.days120Plus) > EPSILON;
            
            // Check for period activity (opening balance, receipts, or billings)
            // This ensures clients who fully paid off their balance during the period are included
            const firstMonthlyReceipt = client.monthlyReceipts[0];
            const hasPeriodActivity = firstMonthlyReceipt && (
              Math.abs(firstMonthlyReceipt.openingBalance) > EPSILON ||
              Math.abs(firstMonthlyReceipt.receipts) > EPSILON ||
              Math.abs(firstMonthlyReceipt.billings) > EPSILON
            );
            
            return Math.abs(client.totalBalance) > EPSILON || hasNonZeroAging || hasPeriodActivity;
          })
          .sort((a, b) => {
            const groupCompare = a.groupDesc.localeCompare(b.groupDesc);
            if (groupCompare !== 0) return groupCompare;
            return a.clientCode.localeCompare(b.clientCode);
          });

        // Calculate totals
        const totalAging: AgingBuckets = {
          current: 0,
          days31_60: 0,
          days61_90: 0,
          days91_120: 0,
          days120Plus: 0,
        };

        let totalCurrentPeriodReceipts = 0;
        let totalPriorMonthBalance = 0;

        clients.forEach(c => {
          totalAging.current += c.aging.current;
          totalAging.days31_60 += c.aging.days31_60;
          totalAging.days61_90 += c.aging.days61_90;
          totalAging.days91_120 += c.aging.days91_120;
          totalAging.days120Plus += c.aging.days120Plus;
          totalCurrentPeriodReceipts += c.currentPeriodReceipts;
          totalPriorMonthBalance += c.priorMonthBalance;
        });

        const report: RecoverabilityReportData = {
          clients,
          totalAging,
          receiptsComparison: {
            currentPeriodReceipts: totalCurrentPeriodReceipts,
            priorMonthBalance: totalPriorMonthBalance,
            variance: totalCurrentPeriodReceipts - totalPriorMonthBalance,
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
          agingRows: agingResults.length,
          durationMs: Date.now() - startTime,
        });

        return NextResponse.json(successResponse(report));
    } catch (error) {
      logger.error('Error generating recoverability report', error);
      return handleApiError(error, 'Generate recoverability report');
    }
  },
});
