/**
 * BD Wizard Employees API
 * GET /api/bd/wizard/employees - Get employees filtered by role
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { prisma } from '@/lib/db/prisma';
import { successResponse } from '@/lib/utils/apiUtils';

export const GET = secureRoute.query({
  feature: Feature.ACCESS_BD,
  handler: async (request) => {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role'); // 'partner', 'manager', 'incharge', or 'all'
    const exclude = searchParams.get('exclude')?.split(',').filter(Boolean) || [];

    // Build where clause based on role
    const where: any = {
      Active: 'Yes',
    };

    // If excluding certain employees
    if (exclude.length > 0) {
      where.EmpCode = { notIn: exclude };
    }

    // Partner role requires specific categories
    if (role === 'partner') {
      where.EmpCatCode = { in: ['CARL', 'LOCAL', 'DIR'] };
    }

    const employees = await prisma.employee.findMany({
      where,
      select: {
        EmpCode: true,
        EmpName: true,
        EmpNameFull: true,
        ServLineDesc: true,
        EmpCatCode: true,
        EmpCatDesc: true,
      },
      orderBy: { EmpNameFull: 'asc' },
    });

    return NextResponse.json(successResponse(employees));
  },
});
