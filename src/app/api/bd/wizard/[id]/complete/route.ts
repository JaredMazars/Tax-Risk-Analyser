/**
 * BD Wizard Complete API
 * POST /api/bd/wizard/[id]/complete - Complete wizard and finalize opportunity
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { z } from 'zod';
import { completeWizard } from '@/lib/services/bd/wizardService';
import { parseNumericId, successResponse } from '@/lib/utils/apiUtils';
import type { BDWizardData } from '@/types/bd-wizard';

const CompleteWizardSchema = z.object({
  finalStageId: z.number().int().positive(),
  wizardData: z.record(z.unknown()),
});

export const POST = secureRoute.mutationWithParams({
  feature: Feature.ACCESS_BD,
  schema: CompleteWizardSchema,
  handler: async (request, { data, params }) => {
    const opportunityId = parseNumericId(params.id, 'Opportunity');

    await completeWizard(
      opportunityId,
      data.finalStageId,
      data.wizardData as unknown as BDWizardData
    );

    return NextResponse.json(
      successResponse({ message: 'Opportunity created successfully' })
    );
  },
});
