/**
 * My Reports - WIP Aging Report API
 * 
 * Returns flat list of all tasks with WIP aging buckets using FIFO fee allocation.
 * Uses sp_WIPAgingByTask stored procedure for all calculations.
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
 * - Uses sp_WIPAgingByTask stored procedure exclusively
 * - FIFO fee allocation: oldest WIP buckets absorb fees first
 * - 7 aging buckets: Curr, 30, 60, 90, 120, 150, 180+ days
 * - AsOfDate is calculated from fiscal month end date or custom endDate
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
import type { WIPAgingReportData, WIPAgingTaskData, WIPAgingSPResult } from '@/types/api';
import { format, parseISO, endOfMonth } from 'date-fns';
import { fetchWIPAgingFromSP } from '@/lib/services/reports/storedProcedureService';
import { getCurrentFiscalPeriod, getFiscalMonthEndDate, FISCAL_MONTHS } from '@/lib/utils/fiscalPeriod';

export const dynamic = 'force-dynamic';

/**
 * Convert WIP Aging SP result to WIPAgingTaskData format
 * Service line hierarchy now comes directly from SP v3.0+
 */
function mapWIPAgingSPToTask(row: WIPAgingSPResult): WIPAgingTaskData {
  return {
    GSTaskID: row.GSTaskID,
    GSClientID: row.GSClientID,
    taskCode: row.TaskCode,
    clientCode: row.ClientCode,
    groupCode: row.GroupCode,
    servLineCode: row.ServLineCode,
    servLineDesc: row.ServLineDesc,
    // Service line hierarchy from SP (v3.0+)
    masterServiceLineCode: row.masterCode || '',
    masterServiceLineName: row.masterServiceLineName || '',
    subServlineGroupCode: row.SubServlineGroupCode || row.ServLineCode,
    subServlineGroupDesc: row.SubServlineGroupDesc || row.ServLineDesc,
    taskPartner: row.TaskPartner,
    partnerName: row.PartnerName,
    taskManager: row.TaskManager,
    managerName: row.ManagerName,
    taskDesc: row.TaskDesc,
    clientName: row.ClientName,
    groupDesc: row.GroupDesc,
    aging: {
      curr: row.Curr ?? 0,
      bal30: row.Bal30 ?? 0,
      bal60: row.Bal60 ?? 0,
      bal90: row.Bal90 ?? 0,
      bal120: row.Bal120 ?? 0,
      bal150: row.Bal150 ?? 0,
      bal180: row.Bal180 ?? 0,
    },
    grossWip: row.GrossWip ?? 0,
    balWip: row.BalWip ?? 0,
    provision: row.Provision ?? 0,
    nettWip: row.NettWip ?? 0,
  };
}

/**
 * GET /api/my-reports/wip-aging
 * 
 * Returns flat list of tasks with WIP aging data
 */
export const GET = secureRoute.query({
  feature: Feature.ACCESS_DASHBOARD,
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

      // Validate fiscalMonth if provided
      if (fiscalMonthParam && !FISCAL_MONTHS.includes(fiscalMonthParam)) {
        throw new AppError(
          400,
          `Invalid fiscalMonth parameter. Must be one of: ${FISCAL_MONTHS.join(', ')}`,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      // Determine as-of date based on mode
      const currentFY = getCurrentFiscalPeriod().fiscalYear;
      const fiscalYear = fiscalYearParam ? parseInt(fiscalYearParam, 10) : currentFY;
      
      let asOfDate: Date;
      
      if (mode === 'custom' && endDateParam) {
        // Custom date range: use endDate as as-of date
        asOfDate = endOfMonth(parseISO(endDateParam));
      } else {
        // Fiscal year mode: use fiscal month end date
        const fiscalMonth = fiscalMonthParam || 'Aug'; // Default to full fiscal year
        asOfDate = getFiscalMonthEndDate(fiscalYear, fiscalMonth);
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

      logger.info('WIP Aging report requested', {
        userId: user.id,
        empCode: employee.EmpCode,
        empCatCode: employee.EmpCatCode,
        mode,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: fiscalMonthParam,
        asOfDate: format(asOfDate, 'yyyy-MM-dd'),
      });

      // 2. Determine filter mode based on employee category
      const partnerCategories = ['CARL', 'Local', 'DIR'];
      const isPartnerReport = partnerCategories.includes(employee.EmpCatCode);
      const filterMode = isPartnerReport ? 'PARTNER' : 'MANAGER';

      // Check cache (mode-specific key, include fiscalMonth)
      const asOfDateStr = format(asOfDate, 'yyyy-MM-dd');
      const cacheKey = mode === 'fiscal'
        ? fiscalMonthParam 
          ? `${CACHE_PREFIXES.USER}my-reports:wip-aging:fy${fiscalYear}:${fiscalMonthParam}:${user.id}`
          : `${CACHE_PREFIXES.USER}my-reports:wip-aging:fy${fiscalYear}:${user.id}`
        : `${CACHE_PREFIXES.USER}my-reports:wip-aging:custom:${startDateParam}:${endDateParam}:${user.id}`;
      
      const cached = await cache.get<WIPAgingReportData>(cacheKey);
      if (cached) {
        logger.info('Returning cached WIP aging report', { 
          userId: user.id, 
          filterMode, 
          mode,
          fiscalYear,
          fiscalMonth: fiscalMonthParam,
          asOfDate: asOfDateStr 
        });
        return NextResponse.json(successResponse(cached));
      }

      // Fetch data using stored procedure
      // SP v3.0+ includes service line hierarchy directly, no separate lookups needed
      logger.info('Fetching WIP aging data from sp_WIPAgingByTask', { 
        empCode: employee.EmpCode, 
        isPartnerReport,
        asOfDate: asOfDateStr 
      });
      
      const spResults = await fetchWIPAgingFromSP(employee.EmpCode, isPartnerReport, asOfDate);

      // Map SP results to expected format and filter out tasks with 0 WIP
      const tasks: WIPAgingTaskData[] = spResults
        .filter((row) => (row.BalWip ?? 0) !== 0)
        .map(mapWIPAgingSPToTask);

      const report: WIPAgingReportData = {
        tasks,
        filterMode,
        employeeCode: employee.EmpCode,
        asOfDate: asOfDateStr,
      };

      // Cache based on mode (longer for past fiscal years)
      const cacheTTL = mode === 'fiscal' && fiscalYear < getCurrentFiscalPeriod().fiscalYear ? 1800 : 600;
      await cache.set(cacheKey, report, cacheTTL);

      const duration = Date.now() - startTime;
      logger.info('WIP Aging report generated via SP', {
        userId: user.id,
        filterMode,
        mode,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: fiscalMonthParam,
        asOfDate: asOfDateStr,
        taskCount: tasks.length,
        duration,
      });

      return NextResponse.json(successResponse(report));
    } catch (error) {
      logger.error('Error generating WIP aging report', error);
      return handleApiError(error, 'Generate WIP aging report');
    }
  },
});
