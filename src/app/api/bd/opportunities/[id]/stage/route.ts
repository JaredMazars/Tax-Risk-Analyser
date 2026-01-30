/**
 * Update BD Opportunity Stage API Route
 * 
 * PUT /api/bd/opportunities/[id]/stage
 * Updates the stage of a BD opportunity (for kanban drag-and-drop).
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { successResponse, parseNumericId } from '@/lib/utils/apiUtils';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// Zod schema for stage update
const UpdateStageSchema = z.object({
  stageId: z.number().int().positive(),
}).strict();

/**
 * PUT /api/bd/opportunities/[id]/stage
 * Update opportunity stage
 */
export const PUT = secureRoute.mutationWithParams({
  feature: Feature.MANAGE_OPPORTUNITIES,
  schema: UpdateStageSchema,
  handler: async (request, { user, data, params }) => {
    const opportunityId = parseNumericId(params.id, 'Opportunity ID');
    const { stageId } = data;

    // Validate stage exists
    const stage = await prisma.bDStage.findUnique({
      where: { id: stageId },
      select: { id: true, name: true, isActive: true },
    });

    if (!stage || !stage.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive stage' },
        { status: 400 }
      );
    }

    // Verify opportunity exists
    const opportunity = await prisma.bDOpportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true, stageId: true, status: true },
    });

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Can't move DRAFT opportunities
    if (opportunity.status === 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Cannot move draft opportunities' },
        { status: 400 }
      );
    }

    // Update opportunity stage
    const updated = await prisma.bDOpportunity.update({
      where: { id: opportunityId },
      data: { stageId },
      select: {
        id: true,
        stageId: true,
        updatedAt: true,
      },
    });

    logger.info('BD opportunity stage updated', {
      opportunityId,
      oldStageId: opportunity.stageId,
      newStageId: stageId,
      userId: user.id,
    });

    return NextResponse.json(successResponse(updated));
  },
});
