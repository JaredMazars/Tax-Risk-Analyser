/**
 * POST /api/clients/[id]/acceptance/initialize
 * Initialize or get existing client acceptance questionnaire
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { getOrCreateClientAcceptance } from '@/lib/services/acceptance/clientAcceptanceService';
import { successResponse } from '@/lib/utils/apiUtils';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { GSClientIDSchema } from '@/lib/validation/schemas';

export const POST = secureRoute.mutationWithParams<never, { id: string }>({
  feature: Feature.MANAGE_CLIENT_ACCEPTANCE,
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

    const acceptance = await getOrCreateClientAcceptance(client.id, user.id);

    return NextResponse.json(successResponse(acceptance));
  },
});
