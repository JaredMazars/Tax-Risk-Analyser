/**
 * Country Management - Profitability Report API
 * 
 * Returns business-wide profitability data with optional partner/manager filtering.
 * Supports fiscal year and custom date range filtering.
 * 
 * Query Parameters:
 * - fiscalYear: number (e.g., 2024 for FY2024 Sep 2023-Aug 2024)
 * - fiscalMonth: string (e.g., 'Aug' for cumulative through August)
 * - startDate: ISO date string (for custom range)
 * - endDate: ISO date string (for custom range)
 * - mode: 'fiscal' | 'custom' (defaults to 'fiscal')
 * - partnerCodes: comma-separated partner codes (optional filter)
 * - managerCodes: comma-separated manager codes (optional filter)
 * 
 * Unlike My Reports, this returns ALL tasks business-wide (no employee filtering)
 * with optional partner/manager filtering.
 */

import { NextResponse } from 'next/server';
import { secureRoute } from '@/lib/api/secureRoute';
import { Feature } from '@/lib/permissions/features';
import { handleApiError, AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';
import { logger } from '@/lib/utils/logger';
import type { ProfitabilityReportData, TaskWithWIPAndServiceLine, WipLTDResult } from '@/types/reports';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { getCurrentFiscalPeriod, getFiscalYearRange, getFiscalMonthEndDate, FISCAL_MONTHS } from '@/lib/utils/fiscalPeriod';
import { fetchProfitabilityFromSPBusinessWide } from '@/lib/services/reports/storedProcedureService';

export const dynamic = 'force-dynamic';

/**
 * Convert WipLTD SP result to TaskWithWIPAndServiceLine format
 */
function mapWipLTDToTask(row: WipLTDResult): TaskWithWIPAndServiceLine {
  const netWip = row.NetWIP;
  const netRevenue = row.NetRevenue;
  const grossProduction = row.LTDTimeCharged;
  const grossProfit = row.GrossProfit;
  const adjustmentPercentage = grossProduction !== 0 ? (row.LTDAdjustments / grossProduction) * 100 : 0;
  const grossProfitPercentage = netRevenue !== 0 ? (grossProfit / netRevenue) * 100 : 0;

  return {
    id: 0,
    TaskCode: row.TaskCode,
    TaskDesc: '',
    TaskPartner: row.TaskPartner,
    TaskPartnerName: row.TaskPartnerName,
    TaskManager: row.TaskManager,
    TaskManagerName: row.TaskManagerName,
    GSClientID: row.GSClientID,
    clientCode: row.clientCode,
    clientNameFull: row.clientNameFull,
    groupCode: row.groupCode,
    groupDesc: row.groupDesc,
    servLineCode: row.ServLineCode,
    serviceLineName: row.ServLineDesc,
    masterServiceLineCode: row.masterCode || '',
    masterServiceLineName: row.masterServiceLineName || '',
    subServlineGroupCode: row.SubServlineGroupCode || '',
    subServlineGroupDesc: row.SubServlineGroupDesc || '',
    netWip,
    ltdHours: row.LTDHours,
    ltdTime: row.LTDTimeCharged,
    ltdDisb: row.LTDDisbCharged,
    ltdAdj: row.LTDAdjustments,
    ltdCost: row.LTDCost,
    ltdWipProvision: row.LTDWipProvision,
    balWip: row.BalWip,
    grossProduction,
    netRevenue,
    adjustmentPercentage,
    grossProfit,
    grossProfitPercentage,
  };
}

/**
 * GET /api/country-management/reports/profitability
 * 
 * Returns business-wide profitability data
 */
export const GET = secureRoute.query({
  feature: Feature.ACCESS_ANALYTICS,
  handler: async (request, { user }) => {
    try {
      const startTime = Date.now();

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const fiscalYearParam = searchParams.get('fiscalYear');
      const fiscalMonthParam = searchParams.get('fiscalMonth');
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');
      const mode = (searchParams.get('mode') || 'fiscal') as 'fiscal' | 'custom';
      
      // Optional partner/manager filters
      const partnerCodesParam = searchParams.get('partnerCodes');
      const managerCodesParam = searchParams.get('managerCodes');
      
      const partnerCodes = partnerCodesParam ? partnerCodesParam.split(',').filter(Boolean) : undefined;
      const managerCodes = managerCodesParam ? managerCodesParam.split(',').filter(Boolean) : undefined;

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
        startDate = startOfMonth(parseISO(startDateParam));
        endDate = endOfMonth(parseISO(endDateParam));
      } else {
        const { start, end } = getFiscalYearRange(fiscalYear);
        startDate = start;
        
        if (fiscalMonthParam) {
          endDate = getFiscalMonthEndDate(fiscalYear, fiscalMonthParam);
        } else {
          endDate = end;
        }
      }

      logger.info('Country Management Profitability report requested', {
        userId: user.id,
        fiscalYear,
        mode,
        partnerCodes: partnerCodes?.length,
        managerCodes: managerCodes?.length,
      });

      // Check cache (include filter params in key)
      const filterSuffix = [
        partnerCodes?.join('-') || 'all-partners',
        managerCodes?.join('-') || 'all-managers',
      ].join(':');
      
      const cacheKey = mode === 'fiscal'
        ? fiscalMonthParam 
          ? `${CACHE_PREFIXES.ANALYTICS}cm:profitability:fy${fiscalYear}:${fiscalMonthParam}:${filterSuffix}`
          : `${CACHE_PREFIXES.ANALYTICS}cm:profitability:fy${fiscalYear}:${filterSuffix}`
        : `${CACHE_PREFIXES.ANALYTICS}cm:profitability:custom:${format(startDate, 'yyyy-MM-dd')}:${format(endDate, 'yyyy-MM-dd')}:${filterSuffix}`;
      
      const cached = await cache.get<ProfitabilityReportData>(cacheKey);
      if (cached) {
        logger.info('Returning cached CM profitability report', { mode, fiscalYear, fiscalMonth: fiscalMonthParam });
        return NextResponse.json(successResponse(cached));
      }

      // Fetch data using stored procedure (business-wide)
      logger.info('Fetching business-wide profitability data from sp_ProfitabilityData', { fiscalYear });
      
      const spResults = await fetchProfitabilityFromSPBusinessWide(
        startDate,
        endDate,
        partnerCodes,
        managerCodes
      );

      // Map SP results to expected format
      const tasks: TaskWithWIPAndServiceLine[] = spResults.map(mapWipLTDToTask);

      const report: ProfitabilityReportData = {
        tasks,
        filterMode: 'PARTNER', // Business-wide data - not filtered by employee
        employeeCode: '', // Not employee-specific
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: mode === 'fiscal' && fiscalMonthParam ? fiscalMonthParam : undefined,
        dateRange: mode === 'custom' ? {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        } : undefined,
        isPeriodFiltered: true,
      };

      // Cache for 5 minutes (shorter since it's aggregate data)
      const cacheTTL = 300;
      await cache.set(cacheKey, report, cacheTTL);

      const duration = Date.now() - startTime;
      logger.info('CM Profitability report generated via SP', {
        userId: user.id,
        mode,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: fiscalMonthParam,
        taskCount: tasks.length,
        duration,
      });

      return NextResponse.json(successResponse(report));
    } catch (error) {
      logger.error('Error generating CM profitability report', error);
      return handleApiError(error, 'Generate CM profitability report');
    }
  },
});
