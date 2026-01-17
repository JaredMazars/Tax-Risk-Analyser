/**
 * GET /api/clients/[id]/acceptance/employees
 * Fetch employees filtered by role for team selection in client acceptance
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { successResponse } from '@/lib/utils/apiUtils';

export const GET = secureRoute.queryWithParams<{ id: string }>({
  feature: Feature.MANAGE_CLIENT_ACCEPTANCE,
  handler: async (request, { user, params }) => {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const excludeManager = searchParams.get('excludeManager');

    let where: any = { Active: 'Yes' };

    if (role === 'partner') {
      // Partners: CARL, LOCAL, or DIR category codes
      where.EmpCatCode = { in: ['CARL', 'LOCAL', 'DIR'] };
    } else {
      // Manager/Incharge: All staff excluding partners (NOT CARL, LOCAL, or DIR)
      where.EmpCatCode = { notIn: ['CARL', 'LOCAL', 'DIR'] };

      // For incharge, also exclude the selected manager
      if (role === 'incharge' && excludeManager) {
        where.EmpCode = { not: excludeManager };
      }
    }

    const employees = await prisma.employee.findMany({
      where,
      select: {
        EmpCode: true,
        EmpNameFull: true,
        EmpCatCode: true,
        EmpCatDesc: true,
        OfficeCode: true,
      },
      orderBy: { EmpNameFull: 'asc' },
      take: 500, // Limit results
    });

    return NextResponse.json(successResponse(employees), {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
      },
    });
  },
});
