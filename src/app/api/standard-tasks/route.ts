import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { checkFeature } from '@/lib/permissions/checkFeature';
import { Feature } from '@/lib/permissions/features';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';

// Cache TTL for standard tasks: 30 minutes (reference data that rarely changes)
const STANDARD_TASKS_CACHE_TTL = 30 * 60;

interface StandardTaskCached {
  id: number;
  GSStdTaskID: string;
  StdTaskCode: string;
  StdTaskDesc: string;
  ServLineCode: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/standard-tasks?serviceLine={servLineCode}
 * 
 * Fetches standard tasks filtered by service line code
 * Results are cached for 30 minutes as reference data rarely changes
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission to manage tasks
    const hasPermission = await checkFeature(user.id, Feature.MANAGE_TASKS);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions to view standard tasks' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const serviceLine = searchParams.get('serviceLine');

    if (!serviceLine) {
      return NextResponse.json(
        { error: 'serviceLine parameter is required' },
        { status: 400 }
      );
    }

    // Try cache first
    const cacheKey = `${CACHE_PREFIXES.SERVICE_LINE}standard-tasks:${serviceLine}`;
    const cached = await cache.get<StandardTaskCached[]>(cacheKey);
    if (cached) {
      return NextResponse.json(successResponse(cached));
    }

    // Fetch standard tasks filtered by service line
    const standardTasks = await prisma.standardTask.findMany({
      where: {
        ServLineCode: serviceLine,
      },
      select: {
        id: true,
        GSStdTaskID: true,
        StdTaskCode: true,
        StdTaskDesc: true,
        ServLineCode: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        StdTaskCode: 'asc',
      },
    });

    // Cache the results
    await cache.set(cacheKey, standardTasks, STANDARD_TASKS_CACHE_TTL);

    return NextResponse.json(successResponse(standardTasks));
  } catch (error) {
    return handleApiError(error, 'Get Standard Tasks');
  }
}







