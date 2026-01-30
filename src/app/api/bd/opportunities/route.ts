/**
 * BD Opportunities API Routes
 * GET /api/bd/opportunities - List opportunities with filters
 */

import { NextResponse } from 'next/server';
import { successResponse } from '@/lib/utils/apiUtils';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { BDOpportunityFiltersSchema } from '@/lib/validation/schemas';
import { getOpportunities } from '@/lib/services/bd/opportunityService';

/**
 * GET /api/bd/opportunities
 * List opportunities with filters
 */
export const GET = secureRoute.query({
  feature: Feature.ACCESS_BD,
  handler: async (request, { user }) => {
    const { searchParams } = new URL(request.url);

    const filters = BDOpportunityFiltersSchema.parse({
      serviceLine: searchParams.get('serviceLine') || undefined,
      stageId: searchParams.get('stageId') ? Number.parseInt(searchParams.get('stageId')!) : undefined,
      status: searchParams.get('status') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      search: searchParams.get('search') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      page: searchParams.get('page') ? Number.parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? Number.parseInt(searchParams.get('pageSize')!) : 20,
    });

    const result = await getOpportunities(filters);

    return NextResponse.json(
      successResponse({
        opportunities: result.opportunities,
        total: result.total,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: Math.ceil(result.total / filters.pageSize),
      })
    );
  },
});
