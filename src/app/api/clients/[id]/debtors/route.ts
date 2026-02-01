import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse, parseGSClientID } from '@/lib/utils/apiUtils';
import { executeRecoverabilityData } from '@/lib/services/reports/storedProcedureService';
import { getCurrentFiscalPeriod, getFiscalYearRange, getFiscalMonthEndDate, FISCAL_MONTHS } from '@/lib/utils/fiscalPeriod';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { logger } from '@/lib/utils/logger';
import type { DebtorMetrics } from '@/lib/services/analytics/debtorAggregation';

/**
 * GET /api/clients/[id]/debtors
 * Get aggregated debtor balances and recoverability metrics for a client
 * 
 * Query Parameters:
 * - fiscalYear: number (optional) - Fiscal year filter (e.g., 2024)
 * - fiscalMonth: string (optional) - Fiscal month name for cumulative through month (e.g., 'November')
 * - mode: 'fiscal' | 'custom' (optional, defaults to 'fiscal')
 * - startDate: ISO date string (optional) - For custom date range
 * - endDate: ISO date string (optional) - For custom date range
 * 
 * Returns:
 * - Overall debtor metrics (balance, aging, payment days)
 * - Debtor metrics grouped by Master Service Line
 * - Master Service Line information
 * - Invoice count
 * - Latest update timestamp
 * - Time period: Fiscal year filtered (defaults to current FY)
 * 
 * Note: Uses sp_RecoverabilityData stored procedure for efficient aggregation.
 * The asOfDate is set to the end of the selected period for aging calculations.
 */
export const GET = secureRoute.queryWithParams({
  feature: Feature.ACCESS_CLIENTS,
  handler: async (request, { user, params }) => {
    const startTime = Date.now();
    
    // Parse and validate GSClientID
    const GSClientID = parseGSClientID(params.id);

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { GSClientID },
      select: {
        id: true,
        GSClientID: true,
        clientCode: true,
        clientNameFull: true,
      },
    });

    if (!client) {
      throw new AppError(404, 'Client not found', ErrorCodes.NOT_FOUND);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const fiscalYearParam = searchParams.get('fiscalYear');
    const fiscalMonthParam = searchParams.get('fiscalMonth');
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
    
    let asOfDate: Date;
    
    if (mode === 'custom' && endDateParam) {
      // Custom date range - use end date as asOfDate
      asOfDate = endOfMonth(parseISO(endDateParam));
    } else {
      // Fiscal year mode (default)
      const { end } = getFiscalYearRange(fiscalYear);
      
      // If fiscalMonth is provided, use end of that month as asOfDate
      if (fiscalMonthParam) {
        asOfDate = getFiscalMonthEndDate(fiscalYear, fiscalMonthParam);
      } else {
        // For current fiscal year, use today's date for real-time aging
        // For past/future fiscal years, use fiscal year end for historical/projected snapshot
        if (fiscalYear === currentFY) {
          asOfDate = new Date(); // Current aging state
        } else {
          asOfDate = end; // Historical or projected snapshot
        }
      }
    }

    logger.debug('Fetching client debtors data', {
      clientCode: client.clientCode,
      mode,
      fiscalYear,
      fiscalMonth: fiscalMonthParam,
      asOfDate: asOfDate.toISOString(),
      isCurrentFY: fiscalYear === currentFY,
    });

    // Call stored procedure
    const spResults = await executeRecoverabilityData({
      billerCode: '*', // All billers for client view
      asOfDate,
      clientCode: client.clientCode,
    });

    // Aggregate by masterCode
    const groupedData = new Map<string, DebtorMetrics>();
    const overallTotals: DebtorMetrics = {
      totalBalance: 0,
      aging: {
        current: 0,
        days31_60: 0,
        days61_90: 0,
        days91_120: 0,
        days120Plus: 0,
      },
      avgPaymentDaysOutstanding: 0,
      avgPaymentDaysPaid: 0,
      invoiceCount: 0,
      transactionCount: 0,
    };

    const masterServiceLinesMap = new Map<string, string>(); // code -> name (from SP data)
    let totalInvoiceCount = 0;
    let totalWeightedDaysOutstanding = 0;
    let totalWeightedDaysPaid = 0;
    let totalBalanceForDaysOutstanding = 0;

    spResults.forEach(row => {
      const masterCode = row.MasterServiceLineCode || 'UNKNOWN';
      
      // Track master service lines from SP data (proper deduplication)
      if (row.MasterServiceLineCode && row.MasterServiceLineName) {
        masterServiceLinesMap.set(row.MasterServiceLineCode, row.MasterServiceLineName);
      }
      
      if (!groupedData.has(masterCode)) {
        groupedData.set(masterCode, {
          totalBalance: 0,
          aging: {
            current: 0,
            days31_60: 0,
            days61_90: 0,
            days91_120: 0,
            days120Plus: 0,
          },
          avgPaymentDaysOutstanding: 0,
          avgPaymentDaysPaid: 0,
          invoiceCount: 0,
          transactionCount: 0,
        });
      }

      const current = groupedData.get(masterCode)!;
      
      // Sum balances
      const totalBalance = Number(row.TotalBalance || 0);
      current.totalBalance += totalBalance;
      current.aging.current += Number(row.AgingCurrent || 0);
      current.aging.days31_60 += Number(row.Aging31_60 || 0);
      current.aging.days61_90 += Number(row.Aging61_90 || 0);
      current.aging.days91_120 += Number(row.Aging91_120 || 0);
      current.aging.days120Plus += Number(row.Aging120Plus || 0);
      current.invoiceCount += Number(row.InvoiceCount || 0);
      current.transactionCount += 1; // Each SP result row represents a client-serviceline combination
      
      // Track for weighted average calculation
      const daysOutstanding = Number(row.AvgDaysOutstanding || 0);
      if (totalBalance > 0 && daysOutstanding > 0) {
        totalWeightedDaysOutstanding += daysOutstanding * totalBalance;
        totalBalanceForDaysOutstanding += totalBalance;
      }
      
      // Add to overall totals
      overallTotals.totalBalance += totalBalance;
      overallTotals.aging.current += Number(row.AgingCurrent || 0);
      overallTotals.aging.days31_60 += Number(row.Aging31_60 || 0);
      overallTotals.aging.days61_90 += Number(row.Aging61_90 || 0);
      overallTotals.aging.days91_120 += Number(row.Aging91_120 || 0);
      overallTotals.aging.days120Plus += Number(row.Aging120Plus || 0);
      totalInvoiceCount += Number(row.InvoiceCount || 0);
      overallTotals.transactionCount += 1; // Each SP result row
    });

    // Calculate weighted average days outstanding for overall
    overallTotals.avgPaymentDaysOutstanding = totalBalanceForDaysOutstanding > 0 
      ? totalWeightedDaysOutstanding / totalBalanceForDaysOutstanding 
      : 0;
    overallTotals.invoiceCount = totalInvoiceCount;
    
    // Calculate weighted average for each master service line
    groupedData.forEach((data, masterCode) => {
      const relevantRows = spResults.filter(row => (row.MasterServiceLineCode || 'UNKNOWN') === masterCode);
      let weightedSum = 0;
      let totalWeight = 0;
      
      relevantRows.forEach(row => {
        const balance = Number(row.TotalBalance || 0);
        const days = Number(row.AvgDaysOutstanding || 0);
        if (balance > 0 && days > 0) {
          weightedSum += days * balance;
          totalWeight += balance;
        }
      });
      
      data.avgPaymentDaysOutstanding = totalWeight > 0 ? weightedSum / totalWeight : 0;
    });

    // Convert master service lines map to array (no DB query needed - data from SP)
    const masterServiceLines = Array.from(masterServiceLinesMap.entries()).map(([code, name]) => ({
      code,
      name,
    }));

    // Convert grouped data to response format
    const byMasterServiceLine: Record<string, DebtorMetrics> = {};
    groupedData.forEach((data, masterCode) => {
      byMasterServiceLine[masterCode] = data;
    });

    const responseData = {
      GSClientID: client.GSClientID,
      clientCode: client.clientCode,
      clientName: client.clientNameFull,
      overall: overallTotals,
      byMasterServiceLine,
      masterServiceLines, // Already in correct format
      transactionCount: spResults.length,
      lastUpdated: new Date().toISOString(), // SP doesn't return updatedAt, use current timestamp
      // Period information
      period: {
        mode,
        fiscalYear,
        fiscalMonth: fiscalMonthParam,
        asOfDate: asOfDate.toISOString(),
      },
    };

    logger.info('Client debtors data fetched from SP', {
      clientCode: client.clientCode,
      invoiceCount: totalInvoiceCount,
      masterServiceLines: masterServiceLinesMap.size,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json(successResponse(responseData));
  },
});

