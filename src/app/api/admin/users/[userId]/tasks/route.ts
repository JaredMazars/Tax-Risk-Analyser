import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isSystemAdmin } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';

/**
 * POST /api/admin/users/[userId]/tasks
 * Add user to multiple tasks
 * Admin only
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSystemAdmin(currentUser.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const body = await request.json();
    const { taskIds, role } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'Task IDs array is required' }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add user to all specified tasks
    const results = await Promise.allSettled(
      taskIds.map((taskId: number) =>
        prisma.taskTeam.upsert({
          where: {
            taskId_userId: {
              taskId,
              userId: params.userId,
            },
          },
          update: {
            role,
          },
          create: {
            taskId,
            userId: params.userId,
            role,
          },
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Added user to ${successful} tasks${failed > 0 ? `, ${failed} failed` : ''}`,
      stats: { successful, failed },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/users/[userId]/tasks
 * Update user role across multiple tasks
 * Admin only
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSystemAdmin(currentUser.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const body = await request.json();
    const { taskIds, role } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'Task IDs array is required' }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Update role for specified tasks
    await prisma.taskTeam.updateMany({
      where: {
        userId: params.userId,
        taskId: { in: taskIds },
      },
      data: {
        role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Updated role to ${role} for ${taskIds.length} tasks`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/users/[userId]/tasks
 * Remove user from multiple tasks
 * Admin only
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSystemAdmin(currentUser.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const body = await request.json();
    const { taskIds } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'Task IDs array is required' }, { status: 400 });
    }

    // Remove user from specified tasks
    await prisma.taskTeam.deleteMany({
      where: {
        userId: params.userId,
        taskId: { in: taskIds },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Removed user from ${taskIds.length} tasks`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

