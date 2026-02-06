/**
 * Country Management - Profitability Summary API
 * 
 * Returns pre-aggregated profitability data by partner or manager.
 * Uses summary stored procedures that return ~50-300 rows instead of 16K+ tasks.
 * 
 * Query Parameters:
 * - aggregateBy: 'partner' | 'manager' (required)
 * - fiscalYear: number (e.g., 2024 for FY2024 Sep 2023-Aug 2024)
 * - fiscalMonth: string (e.g., 'Aug' for cumulative through August)
 * - startDate: ISO date string (for custom range)
 * - endDate: ISO date string (for custom range)
 * - mode: 'fiscal' | 'custom' (defaults to 'fiscal')
 * - partnerCodes: comma-separated partner codes (optional filter)
 * - managerCodes: comma-separated manager codes (optional filter)
 */

import { NextResponse } from 'next/server';
import { secureRoute } from '@/lib/api/secureRoute';
import { Feature } from '@/lib/permissions/features';
import { handleApiError, AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';
import { logger } from '@/lib/utils/logger';
import type { ProfitabilitySummaryResult } from '@/types/reports';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { getCurrentFiscalPeriod, getFiscalYearRange, getFiscalMonthEndDate, FISCAL_MONTHS } from '@/lib/utils/fiscalPeriod';
import { 
  executeProfitabilitySummaryByPartner, 
  executeProfitabilitySummaryByManager 
} from '@/lib/services/reports/storedProcedureService';

export const dynamic = 'force-dynamic';

export interface ProfitabilitySummaryResponse {
  data: ProfitabilitySummaryResult[];
  aggregateBy: 'partner' | 'manager';
  fiscalYear?: number;
  fiscalMonth?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  totalRows: number;
}

/**
 * GET /api/country-management/reports/profitability/summary
 * 
 * Returns pre-aggregated profitability summary by partner or manager
 */
export const GET = secureRoute.query({
  feature: Feature.ACCESS_ANALYTICS,
  handler: async (request, { user }) => {
    try {
      const startTime = Date.now();

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const aggregateBy = searchParams.get('aggregateBy') as 'partner' | 'manager' | null;
      const fiscalYearParam = searchParams.get('fiscalYear');
      const fiscalMonthParam = searchParams.get('fiscalMonth');
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');
      const mode = (searchParams.get('mode') || 'fiscal') as 'fiscal' | 'custom';
      
      // Optional filters
      const partnerCodesParam = searchParams.get('partnerCodes');
      const managerCodesParam = searchParams.get('managerCodes');
      
      const partnerCodes = partnerCodesParam ? partnerCodesParam.split(',').filter(Boolean) : undefined;
      const managerCodes = managerCodesParam ? managerCodesParam.split(',').filter(Boolean) : undefined;

      // Validate aggregateBy
      if (!aggregateBy || !['partner', 'manager'].includes(aggregateBy)) {
        throw new AppError(
          400,
          'aggregateBy parameter is required and must be "partner" or "manager"',
          ErrorCodes.VALIDATION_ERROR
        );
      }

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

      logger.info('CM Profitability Summary requested', {
        userId: user.id,
        aggregateBy,
        fiscalYear,
        mode,
        partnerCodes: partnerCodes?.length,
        managerCodes: managerCodes?.length,
      });

      // Check cache
      const filterSuffix = [
        partnerCodes?.join('-') || 'all-partners',
        managerCodes?.join('-') || 'all-managers',
      ].join(':');
      
      const cacheKey = mode === 'fiscal'
        ? fiscalMonthParam 
          ? `${CACHE_PREFIXES.ANALYTICS}cm:profitability-summary:${aggregateBy}:fy${fiscalYear}:${fiscalMonthParam}:${filterSuffix}`
          : `${CACHE_PREFIXES.ANALYTICS}cm:profitability-summary:${aggregateBy}:fy${fiscalYear}:${filterSuffix}`
        : `${CACHE_PREFIXES.ANALYTICS}cm:profitability-summary:${aggregateBy}:custom:${format(startDate, 'yyyy-MM-dd')}:${format(endDate, 'yyyy-MM-dd')}:${filterSuffix}`;
      
      const cached = await cache.get<ProfitabilitySummaryResponse>(cacheKey);
      if (cached) {
        logger.info('Returning cached CM profitability summary', { aggregateBy, mode, fiscalYear });
        return NextResponse.json(successResponse(cached));
      }

      // Fetch data using appropriate summary SP
      let data: ProfitabilitySummaryResult[];
      
      if (aggregateBy === 'partner') {
        data = await executeProfitabilitySummaryByPartner({
          dateFrom: startDate,
          dateTo: endDate,
          partnerCodes,
        });
      } else {
        data = await executeProfitabilitySummaryByManager({
          dateFrom: startDate,
          dateTo: endDate,
          managerCodes,
        });
      }

      const response: ProfitabilitySummaryResponse = {
        data,
        aggregateBy,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        fiscalMonth: mode === 'fiscal' && fiscalMonthParam ? fiscalMonthParam : undefined,
        dateRange: mode === 'custom' ? {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        } : undefined,
        totalRows: data.length,
      };

      // Cache for 30 minutes (summary data changes infrequently)
      // Use 1 hour TTL for historical fiscal years (data won't change)
      const isHistoricalFY = mode === 'fiscal' && fiscalYear < currentFY;
      const cacheTTL = isHistoricalFY ? 3600 : 1800;
      await cache.set(cacheKey, response, cacheTTL);

      const duration = Date.now() - startTime;
      logger.info('CM Profitability Summary generated', {
        userId: user.id,
        aggregateBy,
        mode,
        fiscalYear: mode === 'fiscal' ? fiscalYear : undefined,
        rowCount: data.length,
        duration,
      });

      return NextResponse.json(successResponse(response));
    } catch (error) {
      logger.error('Error generating CM profitability summary', error);
      return handleApiError(error, 'Generate CM profitability summary');
    }
  },
});
