/**
 * BD Wizard Progress API
 * PUT /api/bd/wizard/[id]/progress - Save wizard progress
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { z } from 'zod';
import { saveWizardProgress } from '@/lib/services/bd/wizardService';
import { parseNumericId, successResponse } from '@/lib/utils/apiUtils';

const SaveProgressSchema = z.object({
  step: z.number().int().min(1).max(8),
  wizardData: z.record(z.unknown()),
});

export const PUT = secureRoute.mutationWithParams({
  feature: Feature.ACCESS_BD,
  schema: SaveProgressSchema,
  handler: async (request, { data, params }) => {
    const opportunityId = parseNumericId(params.id, 'Opportunity');

    await saveWizardProgress(
      opportunityId,
      data.step,
      data.wizardData as any
    );

    return NextResponse.json(
      successResponse({ message: 'Progress saved' })
    );
  },
});
