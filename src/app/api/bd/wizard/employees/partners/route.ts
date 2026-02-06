/**
 * BD Wizard Employees API
 * GET /api/bd/wizard/employees/partners - Get partner employees
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { prisma } from '@/lib/db/prisma';
import { successResponse } from '@/lib/utils/apiUtils';

export const GET = secureRoute.query({
  feature: Feature.ACCESS_BD,
  handler: async () => {
    const partners = await prisma.employee.findMany({
      where: {
        Active: 'Yes',
        EmpCatCode: { in: ['CARL', 'LOCAL', 'DIR'] },
      },
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

    return NextResponse.json(successResponse(partners));
  },
});
