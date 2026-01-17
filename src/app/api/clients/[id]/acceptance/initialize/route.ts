/**
 * POST /api/clients/[id]/acceptance/initialize
 * Initialize or get existing client acceptance questionnaire
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { getOrCreateClientAcceptance } from '@/lib/services/acceptance/clientAcceptanceService';
import { validateClientPartner } from '@/lib/services/clients/partnerValidation';
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

    // Get client with full details for team selection
    const client = await prisma.client.findUnique({
      where: { GSClientID },
      select: { 
        id: true,
        clientCode: true,
        clientNameFull: true,
        groupCode: true,
        groupDesc: true,
        clientPartner: true,
        clientManager: true,
        clientIncharge: true,
        industry: true,
        forvisMazarsIndustry: true,
        forvisMazarsSector: true,
        forvisMazarsSubsector: true,
      },
    });

    if (!client) {
      throw new AppError(404, 'Client not found', ErrorCodes.NOT_FOUND);
    }

    // Validate current partner status (but don't block - UI will handle partner selection)
    const validation = await validateClientPartner(client.id);

    const acceptance = await getOrCreateClientAcceptance(client.id, user.id);

    return NextResponse.json(successResponse({
      acceptance,
      client: {
        id: client.id,
        clientCode: client.clientCode,
        clientNameFull: client.clientNameFull,
        groupCode: client.groupCode,
        groupDesc: client.groupDesc,
        clientPartner: client.clientPartner,
        clientManager: client.clientManager,
        clientIncharge: client.clientIncharge,
        industry: client.industry,
        forvisMazarsIndustry: client.forvisMazarsIndustry,
        forvisMazarsSector: client.forvisMazarsSector,
        forvisMazarsSubsector: client.forvisMazarsSubsector,
      },
      currentPartnerValidation: {
        isValid: validation.isValid,
        reason: validation.reason,
        partner: validation.partner,
      },
    }));
  },
});
