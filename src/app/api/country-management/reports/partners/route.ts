/**
 * Partners List API Route
 * 
 * GET /api/country-management/reports/partners
 * Fetches all active partners (employees with EmpCatCode in CARL, LOCAL, DIR)
 * for the partner filter dropdown in Country Management reports.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/country-management/reports/partners
 * Get list of all partners for filtering
 */
export const GET = secureRoute.query({
  feature: Feature.ACCESS_ANALYTICS,
  handler: async () => {
    // Fetch all active partners (CARL, LOCAL, DIR)
    const employees = await prisma.employee.findMany({
      where: {
        Active: 'Yes',
        EmpCatCode: {
          in: ['CARL', 'LOCAL', 'DIR'],
        },
      },
      select: {
        EmpCode: true,
        EmpName: true,
      },
      orderBy: {
        EmpName: 'asc',
      },
    });

    const partners = employees.map((emp) => ({
      empCode: emp.EmpCode,
      empName: emp.EmpName || emp.EmpCode,
    }));

    return NextResponse.json({ partners });
  },
});
