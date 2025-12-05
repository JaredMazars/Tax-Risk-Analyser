/**
 * Authorization middleware for acceptance and continuance module
 * Validates user access to projects and questionnaires
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';

export type TaskRole = 'VIEWER' | 'USER' | 'MANAGER' | 'ADMIN';

/**
 * Validate that a user has access to a project
 * Returns true if user has access (either through project membership or SYSTEM_ADMIN role)
 */
export async function validateAcceptanceAccess(
  taskId: number,
  userId: string,
  requiredRole?: TaskRole
): Promise<boolean> {
  try {
    // Check if user has access to project
    const access = await prisma.taskTeam.findFirst({
      where: {
        taskId,
        userId,
      },
      select: {
        role: true,
        Task: {
          select: {
            serviceLine: true,
          },
        },
      },
    });

    if (!access) {
      // Check if user is SYSTEM_ADMIN
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'SYSTEM_ADMIN') {
        logger.warn('User access denied', {
          userId,
          taskId,
          reason: 'No project membership and not SYSTEM_ADMIN',
        });
        return false;
      }

      // SYSTEM_ADMIN has access
      return true;
    }

    // Check role if specified
    if (requiredRole) {
      const roleHierarchy: Record<TaskRole, number> = {
        VIEWER: 0,
        USER: 1,
        MANAGER: 2,
        ADMIN: 3,
      };

      const userRoleLevel = roleHierarchy[access.role as TaskRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        logger.warn('User role insufficient', {
          userId,
          taskId,
          userRole: access.role,
          requiredRole,
        });
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Error validating acceptance access', {
      error,
      userId,
      taskId,
    });
    return false;
  }
}

/**
 * Validate that a user can approve acceptance (Partner/Administrator or SYSTEM_ADMIN only)
 */
export async function canApproveAcceptanceValidation(
  taskId: number,
  userId: string
): Promise<boolean> {
  try {
    // Check if user is SYSTEM_ADMIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'SYSTEM_ADMIN') {
      return true;
    }

    // Check if user is Partner/Administrator for the project's service line
    const task = await prisma.task.findUnique({
      where: { id: projectId },
      select: { serviceLine: true },
    });

    if (!project) {
      return false;
    }

    const serviceLineAccess = await prisma.serviceLineUser.findUnique({
      where: {
        userId_serviceLine: {
          userId,
          serviceLine: project.serviceLine,
        },
      },
      select: { role: true },
    });

    return serviceLineAccess?.role === 'ADMINISTRATOR';
  } catch (error) {
    logger.error('Error checking approval permission', {
      error,
      userId,
      taskId,
    });
    return false;
  }
}

/**
 * Validate document access
 * Checks that the document belongs to a questionnaire response for a project the user can access
 */
export async function validateDocumentAccess(
  documentId: number,
  userId: string
): Promise<{ hasAccess: boolean; projectId?: number }> {
  try {
    const document = await prisma.acceptanceDocument.findUnique({
      where: { id: documentId },
      select: {
        ClientAcceptanceResponse: {
          select: {
            taskId: true,
          },
        },
      },
    });

    if (!document) {
      return { hasAccess: false };
    }

    const taskId = document.ClientAcceptanceResponse.projectId;
    const hasAccess = await validateAcceptanceAccess(taskId, userId);

    return { hasAccess, projectId };
  } catch (error) {
    logger.error('Error validating document access', {
      error,
      userId,
      documentId,
    });
    return { hasAccess: false };
  }
}











