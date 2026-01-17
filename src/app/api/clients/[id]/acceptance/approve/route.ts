/**
 * POST /api/clients/[id]/acceptance/approve
 * Approve client acceptance (Partner only)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { 
  approveClientAcceptance,
  getClientAcceptance 
} from '@/lib/services/acceptance/clientAcceptanceService';
import { successResponse } from '@/lib/utils/apiUtils';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { GSClientIDSchema } from '@/lib/validation/schemas';

export const POST = secureRoute.mutationWithParams<never, { id: string }>({
  feature: Feature.APPROVE_CLIENT_ACCEPTANCE,
  handler: async (request, { user, params }) => {
    const GSClientID = params.id;
    
    // Validate GUID format
    const validationResult = GSClientIDSchema.safeParse(GSClientID);
    if (!validationResult.success) {
      throw new AppError(400, 'Invalid client ID format', ErrorCodes.VALIDATION_ERROR);
    }

    // Get client ID from GSClientID
    const client = await prisma.client.findUnique({
      where: { GSClientID },
      select: { id: true },
    });

    if (!client) {
      throw new AppError(404, 'Client not found', ErrorCodes.NOT_FOUND);
    }

    // Verify acceptance exists and is ready for approval
    const existing = await getClientAcceptance(client.id);
    if (!existing) {
      throw new AppError(
        404,
        'Client acceptance not found',
        ErrorCodes.NOT_FOUND
      );
    }

    if (!existing.completedAt) {
      throw new AppError(
        400,
        'Cannot approve incomplete client acceptance',
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (existing.approvedAt) {
      throw new AppError(
        400,
        'Client acceptance already approved',
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const acceptance = await approveClientAcceptance({
      clientId: client.id,
      userId: user.id,
    });

    // TODO: Update approval workflow record
    // if (existing.approvalId) {
    //   await approvalService.completeApproval(existing.approvalId, user.id);
    // }

    return NextResponse.json(successResponse(acceptance));
  },
});
