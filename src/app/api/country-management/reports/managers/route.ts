/**
 * Managers List API Route
 * 
 * GET /api/country-management/reports/managers
 * Fetches all unique managers who have been assigned to tasks.
 * Used for the manager filter dropdown in Country Management reports.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/country-management/reports/managers
 * Get list of all task managers for filtering
 */
export const GET = secureRoute.query({
  feature: Feature.ACCESS_ANALYTICS,
  handler: async () => {
    // Get distinct managers from tasks
    const tasksWithManagers = await prisma.task.findMany({
      where: {
        TaskManager: {
          not: '',
        },
      },
      select: {
        TaskManager: true,
        TaskManagerName: true,
      },
      distinct: ['TaskManager'],
      orderBy: {
        TaskManagerName: 'asc',
      },
    });

    // Filter out nulls and create unique list
    const managerMap = new Map<string, string>();
    for (const task of tasksWithManagers) {
      if (task.TaskManager && !managerMap.has(task.TaskManager)) {
        managerMap.set(task.TaskManager, task.TaskManagerName || task.TaskManager);
      }
    }

    const managers = Array.from(managerMap.entries())
      .map(([empCode, empName]) => ({ empCode, empName }))
      .sort((a, b) => a.empName.localeCompare(b.empName));

    return NextResponse.json({ managers });
  },
});
