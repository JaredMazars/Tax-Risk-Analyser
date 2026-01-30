/**
 * BD Wizard Draft Loading API Route
 * 
 * GET /api/bd/wizard/[id]
 * Loads draft opportunity data for wizard resume.
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { successResponse, parseNumericId } from '@/lib/utils/apiUtils';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/bd/wizard/[id]
 * Load draft opportunity for wizard resume
 */
export const GET = secureRoute.queryWithParams({
  feature: Feature.ACCESS_BD,
  handler: async (request, { user, params }) => {
    const opportunityId = parseNumericId(params.id, 'Opportunity ID');

    const opportunity = await prisma.bDOpportunity.findUnique({
      where: { id: opportunityId },
      select: {
        id: true,
        status: true,
        wizardStep: true,
        wizardData: true,
        wizardCompleted: true,
        createdBy: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Verify it's a draft
    if (opportunity.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Opportunity is not a draft' },
        { status: 400 }
      );
    }

    return NextResponse.json(successResponse(opportunity));
  },
});
