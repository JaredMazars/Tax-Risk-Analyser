import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { parseTaskId, successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { checkTaskAccess } from '@/lib/services/tasks/taskAuthorization';
import { toTaskId } from '@/types/branded';
import { sanitizeText } from '@/lib/utils/sanitization';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';
import { invalidateTaskListCache } from '@/lib/services/cache/listCache';
import { TaskStage } from '@/types/task-stages';
import { z } from 'zod';

// Validation schema for stage update
const updateStageSchema = z.object({
  stage: z.enum(['DRAFT', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'ARCHIVED']),
  notes: z.string().max(500).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure context and params exist
    if (!context || !context.params) {
      throw new Error('Invalid route context');
    }
    
    const params = await context.params;
    const taskId = toTaskId(parseTaskId(params?.id));

    // Check task access (any role can view)
    const hasAccess = await checkTaskAccess(user.id, taskId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try to get cached stage data
    const cacheKey = `${CACHE_PREFIXES.TASK}stage:${taskId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(successResponse(cached));
    }

    // Get all stages for this task (history)
    const stages = await prisma.taskStage.findMany({
      where: { taskId },
      select: {
        id: true,
        stage: true,
        movedBy: true,
        notes: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get current stage (most recent)
    const currentStage = stages.length > 0 ? stages[0]?.stage ?? TaskStage.DRAFT : TaskStage.DRAFT;

    const response = {
      currentStage,
      history: stages,
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300);

    return NextResponse.json(successResponse(response));
  } catch (error) {
    return handleApiError(error, 'Get Task Stage');
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure context and params exist
    if (!context || !context.params) {
      throw new Error('Invalid route context');
    }
    
    const params = await context.params;
    const taskId = toTaskId(parseTaskId(params?.id));

    // Check task access (requires EDITOR role or higher)
    const hasAccess = await checkTaskAccess(user.id, taskId, 'EDITOR');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - EDITOR role required' }, { status: 403 });
    }

    const body = await request.json();

    // Validate request body
    const validation = updateStageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { stage, notes } = validation.data;

    // Sanitize notes if provided
    const sanitizedNotes = notes ? sanitizeText(notes, { maxLength: 500, allowNewlines: true }) : null;

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, TaskDesc: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get current stage
    const currentStage = await prisma.taskStage.findFirst({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      select: { stage: true },
    });

    // Don't create duplicate stage entries if stage hasn't changed
    if (currentStage && currentStage.stage === stage) {
      return NextResponse.json(
        { error: 'Task is already in this stage' },
        { status: 400 }
      );
    }

    // Create new stage entry
    const newStage = await prisma.taskStage.create({
      data: {
        taskId,
        stage,
        movedBy: user.id,
        notes: sanitizedNotes,
      },
      select: {
        id: true,
        stage: true,
        movedBy: true,
        notes: true,
        createdAt: true,
      },
    });

    // Invalidate caches
    await cache.invalidate(`${CACHE_PREFIXES.TASK}stage:${taskId}`);
    await cache.invalidate(`${CACHE_PREFIXES.TASK}detail:${taskId}`);
    await invalidateTaskListCache(taskId);

    return NextResponse.json(successResponse({
      stage: newStage,
      message: 'Task stage updated successfully',
    }));
  } catch (error) {
    return handleApiError(error, 'Update Task Stage');
  }
}



