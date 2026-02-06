/**
 * BD Wizard Create Client API
 * POST /api/bd/wizard/[id]/create-client - Create prospect client
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { z } from 'zod';
import { createProspectClient } from '@/lib/services/bd/wizardService';
import { parseNumericId, successResponse } from '@/lib/utils/apiUtils';
import type { BDWizardData } from '@/types/bd-wizard';

const CreateClientSchema = z.object({
  wizardData: z.object({
    prospectDetails: z.object({
      companyName: z.string().min(1),
      industry: z.string().optional(),
      sector: z.string().optional(),
      contactName: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
      groupCode: z.string().min(1),
    }),
    teamAssignment: z.object({
      partnerCode: z.string().min(1).max(10),
      managerCode: z.string().min(1).max(10),
      inchargeCode: z.string().min(1).max(10),
    }),
    opportunityDetails: z.object({
      serviceLine: z.string(),
      title: z.string(),
      stageId: z.number(),
    }),
  }).passthrough(),
});

export const POST = secureRoute.mutationWithParams({
  feature: Feature.ACCESS_BD,
  schema: CreateClientSchema,
  handler: async (request, { data, user, params }) => {
    const opportunityId = parseNumericId(params.id, 'Opportunity');

    const result = await createProspectClient(
      opportunityId,
      data.wizardData as unknown as BDWizardData,
      user.id
    );

    return NextResponse.json(
      successResponse({
        clientId: result.clientId,
        acceptanceId: result.acceptanceId,
      })
    );
  },
});
