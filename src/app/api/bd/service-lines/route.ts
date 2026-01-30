/**
 * BD Service Lines API Route
 * 
 * GET /api/bd/service-lines
 * Fetches all ServiceLineExternal records for a given master service line.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { successResponse } from '@/lib/utils/apiUtils';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const QuerySchema = z.object({
  masterCode: z.string().max(50),
});

/**
 * GET /api/bd/service-lines
 * Get service lines for a master code
 */
export const GET = secureRoute.query({
  feature: Feature.ACCESS_BD,
  handler: async (request, { user }) => {
    const { searchParams } = new URL(request.url);
    
    const { masterCode } = QuerySchema.parse({
      masterCode: searchParams.get('masterCode') || '',
    });

    const serviceLines = await prisma.serviceLineExternal.findMany({
      where: {
        masterCode,
        Active: true,
      },
      select: {
        ServLineCode: true,
        ServLineDesc: true,
        SubServlineGroupCode: true,
        SubServlineGroupDesc: true,
      },
      orderBy: {
        ServLineDesc: 'asc',
      },
    });

    return NextResponse.json(successResponse(serviceLines));
  },
});
