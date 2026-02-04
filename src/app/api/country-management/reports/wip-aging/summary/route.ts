/**
 * Country Management - WIP Aging Summary API
 * 
 * Returns pre-aggregated WIP aging data by partner or manager.
 * Uses summary stored procedures that return ~50-300 rows instead of 16K+ tasks.
 * 
 * Query Parameters:
 * - aggregateBy: 'partner' | 'manager' (required)
 * - asOfDate: ISO date string (defaults to today)
 * - partnerCodes: comma-separated partner codes (optional filter)
 * - managerCodes: comma-separated manager codes (optional filter)
 * - servLineCode: service line code filter (optional)
 */

import { NextResponse } from 'next/server';
import { secureRoute } from '@/lib/api/secureRoute';
import { Feature } from '@/lib/permissions/features';
import { handleApiError, AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';
import { logger } from '@/lib/utils/logger';
import type { WIPAgingSummaryResult } from '@/types/api';
import { format, parseISO } from 'date-fns';
import { 
  executeWIPAgingSummaryByPartner, 
  executeWIPAgingSummaryByManager 
} from '@/lib/services/reports/storedProcedureService';

export const dynamic = 'force-dynamic';

export interface WIPAgingSummaryResponse {
  data: WIPAgingSummaryResult[];
  aggregateBy: 'partner' | 'manager';
  asOfDate: string;
  totalRows: number;
  // Aggregated totals across all rows
  totals: {
    taskCount: number;
    clientCount: number;
    curr: number;
    bal30: number;
    bal60: number;
    bal90: number;
    bal120: number;
    bal150: number;
    bal180: number;
    grossWIP: number;
    balWIP: number;
    nettWIP: number;
  };
}

/**
 * GET /api/country-management/reports/wip-aging/summary
 * 
 * Returns pre-aggregated WIP aging summary by partner or manager
 */
export const GET = secureRoute.query({
  feature: Feature.ACCESS_ANALYTICS,
  handler: async (request, { user }) => {
    try {
      const startTime = Date.now();

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const aggregateBy = searchParams.get('aggregateBy') as 'partner' | 'manager' | null;
      const asOfDateParam = searchParams.get('asOfDate');
      const servLineCode = searchParams.get('servLineCode') || undefined;
      
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

      // Parse asOfDate (defaults to today)
      const asOfDate = asOfDateParam ? parseISO(asOfDateParam) : new Date();

      logger.info('CM WIP Aging Summary requested', {
        userId: user.id,
        aggregateBy,
        asOfDate: format(asOfDate, 'yyyy-MM-dd'),
        servLineCode,
        partnerCodes: partnerCodes?.length,
        managerCodes: managerCodes?.length,
      });

      // Check cache
      const filterSuffix = [
        servLineCode || 'all-sl',
        partnerCodes?.join('-') || 'all-partners',
        managerCodes?.join('-') || 'all-managers',
      ].join(':');
      
      const cacheKey = `${CACHE_PREFIXES.ANALYTICS}cm:wip-aging-summary:${aggregateBy}:${format(asOfDate, 'yyyy-MM-dd')}:${filterSuffix}`;
      
      const cached = await cache.get<WIPAgingSummaryResponse>(cacheKey);
      if (cached) {
        logger.info('Returning cached CM WIP aging summary', { aggregateBy, asOfDate: format(asOfDate, 'yyyy-MM-dd') });
        return NextResponse.json(successResponse(cached));
      }

      // Fetch data using appropriate summary SP
      let data: WIPAgingSummaryResult[];
      
      if (aggregateBy === 'partner') {
        data = await executeWIPAgingSummaryByPartner({
          asOfDate,
          servLineCode,
          partnerCodes,
        });
      } else {
        data = await executeWIPAgingSummaryByManager({
          asOfDate,
          servLineCode,
          managerCodes,
        });
      }

      // Calculate grand totals
      const totals = data.reduce((acc, row) => ({
        taskCount: acc.taskCount + (row.TaskCount || 0),
        clientCount: acc.clientCount + (row.ClientCount || 0),
        curr: acc.curr + (row.Curr || 0),
        bal30: acc.bal30 + (row.Bal30 || 0),
        bal60: acc.bal60 + (row.Bal60 || 0),
        bal90: acc.bal90 + (row.Bal90 || 0),
        bal120: acc.bal120 + (row.Bal120 || 0),
        bal150: acc.bal150 + (row.Bal150 || 0),
        bal180: acc.bal180 + (row.Bal180 || 0),
        grossWIP: acc.grossWIP + (row.GrossWIP || 0),
        balWIP: acc.balWIP + (row.BalWIP || 0),
        nettWIP: acc.nettWIP + (row.NettWIP || 0),
      }), {
        taskCount: 0,
        clientCount: 0,
        curr: 0,
        bal30: 0,
        bal60: 0,
        bal90: 0,
        bal120: 0,
        bal150: 0,
        bal180: 0,
        grossWIP: 0,
        balWIP: 0,
        nettWIP: 0,
      });

      const response: WIPAgingSummaryResponse = {
        data,
        aggregateBy,
        asOfDate: format(asOfDate, 'yyyy-MM-dd'),
        totalRows: data.length,
        totals,
      };

      // Cache for 30 minutes (summary data changes infrequently)
      const cacheTTL = 1800;
      await cache.set(cacheKey, response, cacheTTL);

      const duration = Date.now() - startTime;
      logger.info('CM WIP Aging Summary generated', {
        userId: user.id,
        aggregateBy,
        asOfDate: format(asOfDate, 'yyyy-MM-dd'),
        rowCount: data.length,
        duration,
      });

      return NextResponse.json(successResponse(response));
    } catch (error) {
      logger.error('Error generating CM WIP aging summary', error);
      return handleApiError(error, 'Generate CM WIP aging summary');
    }
  },
});
