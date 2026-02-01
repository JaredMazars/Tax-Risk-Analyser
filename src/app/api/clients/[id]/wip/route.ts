import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse, parseGSClientID } from '@/lib/utils/apiUtils';
import { executeProfitabilityData } from '@/lib/services/reports/storedProcedureService';
import { getCurrentFiscalPeriod, getFiscalYearRange, getFiscalMonthEndDate, FISCAL_MONTHS } from '@/lib/utils/fiscalPeriod';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { logger } from '@/lib/utils/logger';

interface ProfitabilityMetrics {
  grossProduction: number;
  ltdAdjustment: number;
  netRevenue: number;
  adjustmentPercentage: number;
  ltdCost: number;
  grossProfit: number;
  grossProfitPercentage: number;
  averageChargeoutRate: number;
  averageRecoveryRate: number;
  balWIP: number;
  balTime: number;
  balDisb: number;
  wipProvision: number;
  ltdTime: number;
  ltdDisb: number;
  ltdAdj: number; // Merged adjustments
  ltdFee: number; // Merged fees
  ltdHours: number;
  taskCount: number;
  // Legacy fields for backwards compatibility
  ltdAdjTime: number;
  ltdAdjDisb: number;
  ltdFeeTime: number;
  ltdFeeDisb: number;
}

/**
 * Calculate profitability metrics from raw WIP data
 */
function calculateProfitabilityMetrics(data: {
  ltdTime: number;
  ltdAdj: number;
  ltdCost: number;
  balWIP: number;
  balTime: number;
  balDisb: number;
  wipProvision: number;
  ltdDisb: number;
  ltdFee: number;
  ltdHours: number;
  taskCount: number;
}): ProfitabilityMetrics {
  const grossProduction = data.ltdTime + data.ltdDisb;
  const ltdAdjustment = data.ltdAdj;
  const netRevenue = grossProduction + ltdAdjustment;
  const adjustmentPercentage = grossProduction !== 0 ? (ltdAdjustment / grossProduction) * 100 : 0;
  const grossProfit = netRevenue - data.ltdCost;
  const grossProfitPercentage = netRevenue !== 0 ? (grossProfit / netRevenue) * 100 : 0;
  const averageChargeoutRate = data.ltdHours !== 0 ? grossProduction / data.ltdHours : 0;
  const averageRecoveryRate = data.ltdHours !== 0 ? netRevenue / data.ltdHours : 0;

  return {
    grossProduction,
    ltdAdjustment,
    netRevenue,
    adjustmentPercentage,
    ltdCost: data.ltdCost,
    grossProfit,
    grossProfitPercentage,
    averageChargeoutRate,
    averageRecoveryRate,
    balWIP: data.balWIP,
    balTime: data.balTime,
    balDisb: data.balDisb,
    wipProvision: data.wipProvision,
    ltdTime: data.ltdTime,
    ltdDisb: data.ltdDisb,
    ltdAdj: data.ltdAdj,
    ltdFee: data.ltdFee,
    ltdHours: data.ltdHours,
    taskCount: data.taskCount,
    // Legacy fields for backwards compatibility - set to 0
    ltdAdjTime: 0,
    ltdAdjDisb: 0,
    ltdFeeTime: 0,
    ltdFeeDisb: 0,
  };
}

/**
 * GET /api/clients/[id]/wip
 * Get aggregated Work in Progress and Profitability data for a client
 * 
 * Query Parameters:
 * - fiscalYear: number (optional) - Fiscal year filter (e.g., 2024)
 * - fiscalMonth: string (optional) - Fiscal month name for cumulative through month (e.g., 'November')
 * - mode: 'fiscal' | 'custom' (optional, defaults to 'fiscal')
 * - startDate: ISO date string (optional) - For custom date range
 * - endDate: ISO date string (optional) - For custom date range
 * 
 * Returns:
 * - Overall profitability metrics (period-filtered)
 * - Profitability metrics grouped by Master Service Line
 * - Master Service Line information
 * - Task count contributing to WIP
 * - Latest update timestamp
 * - Time period: Fiscal year filtered (defaults to current FY)
 * 
 * Note: Uses sp_ProfitabilityData stored procedure for efficient aggregation.
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
      
      // If fiscalMonth is provided, calculate cumulative through that month (FISCAL YTD)
      if (fiscalMonthParam) {
        endDate = getFiscalMonthEndDate(fiscalYear, fiscalMonthParam);
      } else {
        endDate = end; // Full fiscal year
      }
    }

    logger.debug('Fetching client WIP data', {
      clientCode: client.clientCode,
      mode,
      fiscalYear,
      fiscalMonth: fiscalMonthParam,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    });

    // Call stored procedure
    const spResults = await executeProfitabilityData({
      clientCode: client.clientCode,
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Aggregate by masterCode (group service line totals)
    const groupedData = new Map<string, {
      ltdTime: number;
      ltdAdj: number;
      ltdCost: number;
      ltdDisb: number;
      ltdFee: number;
      ltdHours: number;
      balWIP: number;
      balTime: number;
      balDisb: number;
      wipProvision: number;
      taskCount: number;
    }>();
    
    const overallTotals = {
      ltdTime: 0,
      ltdAdj: 0,
      ltdCost: 0,
      ltdDisb: 0,
      ltdFee: 0,
      ltdHours: 0,
      balWIP: 0,
      balTime: 0,
      balDisb: 0,
      wipProvision: 0,
      taskCount: 0,
    };

    const masterServiceLinesMap = new Map<string, string>(); // code -> name (from SP data)
    const taskCountByMaster = new Map<string, Set<string>>();

    spResults.forEach(row => {
      const masterCode = row.masterCode || 'UNKNOWN';
      
      // Track master service lines from SP data (proper deduplication)
      if (row.masterCode && row.masterServiceLineName) {
        masterServiceLinesMap.set(row.masterCode, row.masterServiceLineName);
      }
      
      if (!groupedData.has(masterCode)) {
        groupedData.set(masterCode, {
          ltdTime: 0,
          ltdAdj: 0,
          ltdCost: 0,
          ltdDisb: 0,
          ltdFee: 0,
          ltdHours: 0,
          balWIP: 0,
          balTime: 0,
          balDisb: 0,
          wipProvision: 0,
          taskCount: 0,
        });
        taskCountByMaster.set(masterCode, new Set());
      }

      const current = groupedData.get(masterCode)!;
      const taskSet = taskCountByMaster.get(masterCode)!;
      
      // Sum all metrics
      current.ltdTime += Number(row.LTDTimeCharged || 0);
      current.ltdAdj += Number(row.LTDAdjustments || 0);
      current.ltdCost += Number(row.LTDCost || 0);
      current.ltdDisb += Number(row.LTDDisbCharged || 0);
      current.ltdFee += Number(row.LTDFeesBilled || 0);
      current.ltdHours += Number(row.LTDHours || 0);
      current.balWIP += Number(row.BalWip || 0);
      current.wipProvision += Number(row.LTDWipProvision || 0);
      
      // Track unique tasks per master code
      taskSet.add(row.GSTaskID);
      
      // Calculate balTime and balDisb (matching old logic)
      current.balTime += Number(row.LTDTimeCharged || 0) + Number(row.LTDAdjustments || 0) - Number(row.LTDFeesBilled || 0);
      current.balDisb += Number(row.LTDDisbCharged || 0);
      
      // Add to overall totals
      overallTotals.ltdTime += Number(row.LTDTimeCharged || 0);
      overallTotals.ltdAdj += Number(row.LTDAdjustments || 0);
      overallTotals.ltdCost += Number(row.LTDCost || 0);
      overallTotals.ltdDisb += Number(row.LTDDisbCharged || 0);
      overallTotals.ltdFee += Number(row.LTDFeesBilled || 0);
      overallTotals.ltdHours += Number(row.LTDHours || 0);
      overallTotals.balWIP += Number(row.BalWip || 0);
      overallTotals.wipProvision += Number(row.LTDWipProvision || 0);
      overallTotals.balTime += Number(row.LTDTimeCharged || 0) + Number(row.LTDAdjustments || 0) - Number(row.LTDFeesBilled || 0);
      overallTotals.balDisb += Number(row.LTDDisbCharged || 0);
    });

    // Set task counts
    taskCountByMaster.forEach((taskSet, masterCode) => {
      const data = groupedData.get(masterCode);
      if (data) {
        data.taskCount = taskSet.size;
      }
    });
    
    // Count unique tasks overall
    const allTaskIds = new Set(spResults.map(row => row.GSTaskID));
    overallTotals.taskCount = allTaskIds.size;

    // Convert master service lines map to array (no DB query needed - data from SP)
    const masterServiceLines = Array.from(masterServiceLinesMap.entries()).map(([code, name]) => ({
      code,
      name,
    }));

    // Calculate profitability metrics for each Master Service Line
    const byMasterServiceLine: Record<string, ProfitabilityMetrics> = {};
    groupedData.forEach((data, masterCode) => {
      byMasterServiceLine[masterCode] = calculateProfitabilityMetrics(data);
    });

    // Calculate overall profitability metrics
    const overall = calculateProfitabilityMetrics(overallTotals);

    const responseData = {
      GSClientID: client.GSClientID,
      clientCode: client.clientCode,
      clientName: client.clientNameFull,
      overall,
      byMasterServiceLine,
      masterServiceLines, // Already in correct format
      taskCount: overallTotals.taskCount,
      lastUpdated: new Date().toISOString(), // SP doesn't return updatedAt, use current timestamp
      // Period information
      period: {
        mode,
        fiscalYear,
        fiscalMonth: fiscalMonthParam,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };

    logger.info('Client WIP data fetched from SP', {
      clientCode: client.clientCode,
      taskCount: overallTotals.taskCount,
      masterServiceLines: masterServiceLinesMap.size,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json(successResponse(responseData));
  },
});
