/**
 * BD Wizard Initialization API
 * POST /api/bd/wizard - Create new wizard session
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { z } from 'zod';
import { createWizardSession } from '@/lib/services/bd/wizardService';
import { successResponse } from '@/lib/utils/apiUtils';

const InitializeWizardSchema = z.object({
  serviceLine: z.string().min(1),
});

export const POST = secureRoute.mutation({
  feature: Feature.ACCESS_BD,
  schema: InitializeWizardSchema,
  handler: async (request, { data, user }) => {
    const result = await createWizardSession(user.id, data.serviceLine);

    return NextResponse.json(
      successResponse({
        opportunityId: result.id,
        wizardData: result.wizardData,
      })
    );
  },
});
