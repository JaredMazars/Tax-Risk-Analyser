/**
 * BD Opportunity API Routes
 * 
 * GET /api/bd/opportunities/[id] - Get a single opportunity
 * DELETE /api/bd/opportunities/[id] - Delete a draft opportunity
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { successResponse, parseNumericId } from '@/lib/utils/apiUtils';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { invalidateWorkspaceCounts } from '@/lib/services/cache/cacheInvalidation';
import { getOpportunityById } from '@/lib/services/bd/opportunityService';

/**
 * GET /api/bd/opportunities/[id]
 * Get a single BD opportunity with all relations
 */
export const GET = secureRoute.queryWithParams({
  feature: Feature.ACCESS_BD,
  handler: async (request, { user, params }) => {
    const opportunityId = parseNumericId(params.id, 'Opportunity ID');

    const opportunity = await getOpportunityById(opportunityId);

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(opportunity));
  },
});

/**
 * DELETE /api/bd/opportunities/[id]
 * Delete a draft BD opportunity
 */
export const DELETE = secureRoute.mutationWithParams({
  feature: Feature.MANAGE_OPPORTUNITIES,
  handler: async (request, { user, params }) => {
    const opportunityId = parseNumericId(params.id, 'Opportunity ID');

    // Verify opportunity exists and is a draft
    const opportunity = await prisma.bDOpportunity.findUnique({
      where: { id: opportunityId },
      select: { 
        id: true, 
        status: true, 
        createdBy: true,
        serviceLine: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Only allow deleting drafts
    if (opportunity.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Only draft opportunities can be deleted' },
        { status: 400 }
      );
    }

    // Delete the draft opportunity (cascade deletes related records)
    await prisma.bDOpportunity.delete({
      where: { id: opportunityId },
    });

    // Invalidate caches
    await invalidateWorkspaceCounts(opportunity.serviceLine, undefined);

    logger.info('Draft opportunity deleted', {
      opportunityId,
      userId: user.id,
      createdBy: opportunity.createdBy,
    });

    return NextResponse.json(
      successResponse({ message: 'Draft deleted successfully' })
    );
  },
});
