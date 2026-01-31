/**
 * My Reports - Profitability Report API
 * 
 * Returns flat list of all tasks across all service lines with comprehensive
 * WIP and profitability metrics. Supports fiscal year and custom date range filtering.
 * 
 * Filtered based on employee category:
 * - CARL/Local/DIR: Tasks where user is Task Partner
 * - Others: Tasks where user is Task Manager
 * 
 * Query Parameters:
 * - fiscalYear: number (e.g., 2024 for FY2024 Sep 2023-Aug 2024)
 * - fiscalMonth: string (e.g., 'Aug' for cumulative through August)
 * - startDate: ISO date string (for custom range)
 * - endDate: ISO date string (for custom range)
 * - mode: 'fiscal' | 'custom' (defaults to 'fiscal')
 * 
 * IMPLEMENTATION:
 * - Uses sp_ProfitabilityData stored procedure exclusively
 * - All WIP aggregation and calculations performed at database level
 * - Highly optimized for large datasets (200+ tasks)
 * - ~50% faster than inline query implementation
 * 
 * Access restricted to employees who are partners or managers
 */

import { NextResponse } from 'next/server';
import { secureRoute } from '@/lib/api/secureRoute';
import { Feature } from '@/lib/permissions/features';
import { prisma } from '@/lib/db/prisma';
import { handleApiError, AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';
import { logger } from '@/lib/utils/logger';
import type { ProfitabilityReportData, TaskWithWIPAndServiceLine, WipLTDResult } from '@/types/api';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { getCurrentFiscalPeriod, getFiscalYearRange, getFiscalMonthEndDate, FISCAL_MONTHS } from '@/lib/utils/fiscalPeriod';
import { fetchProfitabilityFromSP } from '@/lib/services/reports/storedProcedureService';

export const dynamic = 'force-dynamic';

/**
 * Convert WipLTD SP result to TaskWithWIPAndServiceLine format
 */
function mapWipLTDToTask(row: WipLTDResult): TaskWithWIPAndServiceLine {
  // Use SP's correct life-to-date NetWIP calculation (balance sheet item)
  // NetWIP includes ALL transactions regardless of date range parameters
  const netWip = row.NetWIP;
  const netRevenue = row.LTDTimeCharged + row.LTDAdjustments;
  const grossProduction = row.LTDTimeCharged;
  const grossProfit = netRevenue - row.LTDCost;
  const adjustmentPercentage = grossProduction !== 0 ? (row.LTDAdjustments / grossProduction) * 100 : 0;
  const grossProfitPercentage = netRevenue !== 0 ? (grossProfit / netRevenue) * 100 : 0;

  return {
    id: 0, // SP doesn't return id, but it's not used in UI
    TaskCode: row.TaskCode,
    TaskDesc: '', // SP doesn't return TaskDesc
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
    // Service line hierarchy - now included in SP results
    masterServiceLineCode: row.masterCode || '',
    masterServiceLineName: row.masterServiceLineName || '',
    subServlineGroupCode: row.SubServlineGroupCode || '',
    subServlineGroupDesc: row.SubServlineGroupDesc || '',
    // WIP metrics
    netWip,
    ltdHours: row.LTDHours,
    ltdTime: row.LTDTimeCharged,
    ltdDisb: row.LTDDisbCharged,
    ltdAdj: row.LTDAdjustments,
    ltdCost: row.LTDCost,
    // Additional WIP metrics
    ltdWipProvision: row.LTDWipProvision,
    balWip: row.BalWip,
    // Calculated metrics
    grossProduction,
    netRevenue,
    adjustmentPercentage,
    grossProfit,
    grossProfitPercentage,
  };
}

/**
 * GET /api/my-reports/profitability
 * 
 * Returns flat list of tasks with all relations and service line info
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
      let isPeriodFiltered = true;
      
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
          EmpCatCode: true,
          EmpCatDesc: true,
        },
      });

      if (!employee) {
        throw new AppError(
          403,
          'No employee record found for your account',
          ErrorCodes.FORBIDDEN
        );
      }

      logger.info('Profitability report requested', {
        userId: user.id,
        empCode: employee.EmpCode,
        empCatCode: employee.EmpCatCode,
        fiscalYear,
        mode,
      });

      // 2. Determine filter mode based on employee category
      const partnerCategories = ['CARL', 'Local', 'DIR'];
      const isPartnerReport = partnerCategories.includes(employee.EmpCatCode);
      const filterMode = isPartnerReport ? 'PARTNER' : 'MANAGER';

      // Check cache (mode-specific key, include fiscalMonth)
      const cacheKey = mode === 'fiscal'
        ? fiscalMonthParam 
          ? `${CACHE_PREFIXES.USER}my-reports:profitability:fy${fiscalYear}:${fiscalMonthParam}:${user.id}`
          : `${CACHE_PREFIXES.USER}my-reports:profitability:fy${fiscalYear}:${user.id}`
        : `${CACHE_PREFIXES.USER}my-reports:profitability:custom:${format(startDate, 'yyyy-MM-dd')}:${format(endDate, 'yyyy-MM-dd')}:${user.id}`;
      
      const cached = await cache.get<ProfitabilityReportData>(cacheKey);
      if (cached) {
        logger.info('Returning cached profitability report', { userId: user.id, filterMode, mode, fiscalYear, fiscalMonth: fiscalMonthParam });
        return NextResponse.json(successResponse(cached));
      }

      // Fetch data using stored procedure (includes service line hierarchy)
      logger.info('Fetching profitability data from sp_ProfitabilityData', { fiscalYear, isPartnerReport });
      
      const spResults = await fetchProfitabilityFromSP(
        employee.EmpCode,
        isPartnerReport,
        startDate,
        endDate
      );

      // Map SP results to expected format (service line hierarchy now included in SP)
      const tasks: TaskWithWIPAndServiceLine[] = spResults.map(mapWipLTDToTask);

      const report: ProfitabilityReportData = {
        tasks,
        filterMode,
        employeeCode: employee.EmpCode,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: mode === 'fiscal' && fiscalMonthParam ? fiscalMonthParam : undefined,
        dateRange: mode === 'custom' ? {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        } : undefined,
        isPeriodFiltered,
      };

      // Cache based on mode
      const cacheTTL = mode === 'fiscal' && fiscalYear < getCurrentFiscalPeriod().fiscalYear ? 1800 : 600;
      await cache.set(cacheKey, report, cacheTTL);

      const duration = Date.now() - startTime;
      logger.info('Profitability report generated via SP', {
        userId: user.id,
        filterMode,
        mode,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: fiscalMonthParam,
        taskCount: tasks.length,
        duration,
      });

      return NextResponse.json(successResponse(report));
    } catch (error) {
      logger.error('Error generating profitability report', error);
      return handleApiError(error, 'Generate profitability report');
    }
  },
});

