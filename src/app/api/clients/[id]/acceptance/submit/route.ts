/**
 * POST /api/clients/[id]/acceptance/submit
 * Submit client acceptance for Partner approval
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { submitClientAcceptance } from '@/lib/services/acceptance/clientAcceptanceService';
import { successResponse } from '@/lib/utils/apiUtils';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { GSClientIDSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

const SubmitAcceptanceSchema = z.object({
  answers: z.record(
    z.string(),
    z.object({
      answer: z.string(),
      comment: z.string().optional(),
    })
  ),
});

export const POST = secureRoute.mutationWithParams<typeof SubmitAcceptanceSchema, { id: string }>({
  feature: Feature.MANAGE_CLIENT_ACCEPTANCE,
  schema: SubmitAcceptanceSchema,
  handler: async (request, { user, params, data }) => {
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

    const acceptance = await submitClientAcceptance({
      clientId: client.id,
      answers: data.answers,
      userId: user.id,
    });

    // TODO: Create approval workflow record
    // const approval = await approvalService.createApproval({
    //   workflowType: 'CLIENT_ACCEPTANCE',
    //   workflowId: acceptance.id,
    //   title: `Client Acceptance for ${acceptance.client?.clientNameFull}`,
    //   requestedById: user.id,
    //   context: { clientId },
    // });

    return NextResponse.json(successResponse(acceptance));
  },
});
