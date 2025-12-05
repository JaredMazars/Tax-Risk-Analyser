/**
 * Task Authorization Service
 * Handles task-level permissions and access control
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { TaskId } from '@/types/branded';
import { isSystemAdmin, isPartner } from '@/lib/services/auth/authorization';

/**
 * Check if user has access to a task
 * User must be either:
 * 1. System Admin
 * 2. Member of the task team
 */
export async function checkTaskAccess(
  userId: string,
  taskId: TaskId,
  requiredRole?: string
): Promise<boolean> {
  try {
    // System Admins have access to all tasks
    const isAdmin = await isSystemAdmin(userId);
    if (isAdmin) return true;

    // Check if user is on the task team
    const taskTeamMember = await prisma.taskTeam.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
      select: { role: true },
    });

    if (!taskTeamMember) return false;

    // If a specific role is required, check if user has sufficient permissions
    if (requiredRole) {
      return hasTaskRole(taskTeamMember.role, requiredRole);
    }

    return true;
  } catch (error) {
    logger.error('Error checking task access', { userId, taskId, error });
    return false;
  }
}

/**
 * Get user's role on a specific task
 */
export async function getTaskRole(
  userId: string,
  taskId: TaskId
): Promise<string | null> {
  try {
    // System Admins are treated as ADMIN on all tasks
    const isAdmin = await isSystemAdmin(userId);
    if (isAdmin) return 'ADMIN';

    // Get user's role from task team
    const taskTeamMember = await prisma.taskTeam.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
      select: { role: true },
    });

    return taskTeamMember?.role || null;
  } catch (error) {
    logger.error('Error getting task role', { userId, taskId, error });
    return null;
  }
}

/**
 * Check if user can modify a task
 * User must be either:
 * 1. System Admin
 * 2. Task team member with ADMIN or EDITOR role
 */
export async function canModifyTask(
  userId: string,
  taskId: TaskId
): Promise<boolean> {
  try {
    // System Admins can modify all tasks
    const isAdmin = await isSystemAdmin(userId);
    if (isAdmin) return true;

    // Get user's role on the task
    const role = await getTaskRole(userId, taskId);
    
    // Can modify if role is ADMIN or EDITOR
    return role === 'ADMIN' || role === 'EDITOR';
  } catch (error) {
    logger.error('Error checking modify permission', { userId, taskId, error });
    return false;
  }
}

/**
 * Check if user can approve client acceptance for a task
 * Rules: SYSTEM_ADMIN OR Administrator/Partner (ServiceLineUser.role = ADMINISTRATOR or PARTNER)
 */
export async function canApproveAcceptance(
  userId: string,
  taskId: TaskId
): Promise<boolean> {
  try {
    // Check if user is a system admin
    const isAdmin = await isSystemAdmin(userId);
    if (isAdmin) return true;

    // Get the task's service line
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { ServLineCode: true },
    });

    if (!task) {
      logger.warn('Task not found for approval check', { taskId });
      return false;
    }

    // Check if user is an Administrator or Partner in the task's service line
    const isServiceLinePartner = await isPartner(userId, task.ServLineCode);
    
    // Also verify they have task access
    if (isServiceLinePartner) {
      const hasTaskAccess = await prisma.taskTeam.findUnique({
        where: {
          taskId_userId: {
            taskId,
            userId,
          },
        },
      });
      
      return !!hasTaskAccess;
    }

    return false;
  } catch (error) {
    logger.error('Error checking approval permission', { userId, taskId, error });
    return false;
  }
}

/**
 * Check if user can approve engagement letter for a task
 * Same rules as acceptance: SYSTEM_ADMIN OR Administrator/Partner
 */
export async function canApproveEngagementLetter(
  userId: string,
  taskId: TaskId
): Promise<boolean> {
  // Same logic as acceptance approval
  return canApproveAcceptance(userId, taskId);
}

/**
 * Check if a user has a specific role or higher in the task hierarchy
 * Hierarchy: ADMIN > REVIEWER > EDITOR > VIEWER
 */
function hasTaskRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: { [key: string]: number } = {
    ADMIN: 4,
    REVIEWER: 3,
    EDITOR: 2,
    VIEWER: 1,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Check if user can assign team members to a task
 * User must be either:
 * 1. System Admin
 * 2. Task team member with ADMIN role
 */
export async function canAssignTeam(
  userId: string,
  taskId: TaskId
): Promise<boolean> {
  try {
    // System Admins can assign team members
    const isAdmin = await isSystemAdmin(userId);
    if (isAdmin) return true;

    // Get user's role on the task
    const role = await getTaskRole(userId, taskId);
    
    // Can assign if role is ADMIN
    return role === 'ADMIN';
  } catch (error) {
    logger.error('Error checking assign permission', { userId, taskId, error });
    return false;
  }
}

/**
 * Check if user can delete a task
 * User must be either:
 * 1. System Admin
 * 2. Task team member with ADMIN role
 * 3. Administrator/Partner in the task's service line
 */
export async function canDeleteTask(
  userId: string,
  taskId: TaskId
): Promise<boolean> {
  try {
    // System Admins can delete all tasks
    const isAdmin = await isSystemAdmin(userId);
    if (isAdmin) return true;

    // Get the task's service line
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { ServLineCode: true },
    });

    if (!task) return false;

    // Check if user is an Administrator or Partner in the task's service line
    const isServiceLinePartner = await isPartner(userId, task.ServLineCode);
    if (isServiceLinePartner) return true;

    // Check if user has ADMIN role on the task
    const role = await getTaskRole(userId, taskId);
    return role === 'ADMIN';
  } catch (error) {
    logger.error('Error checking delete permission', { userId, taskId, error });
    return false;
  }
}

/**
 * Get all tasks a user has access to
 */
export async function getUserTaskIds(userId: string): Promise<number[]> {
  try {
    // System Admins have access to all tasks
    const isAdmin = await isSystemAdmin(userId);
    if (isAdmin) {
      const allTasks = await prisma.task.findMany({
        select: { id: true },
      });
      return allTasks.map(t => t.id);
    }

    // Get tasks where user is a team member
    const taskTeam = await prisma.taskTeam.findMany({
      where: { userId },
      select: { taskId: true },
    });

    return taskTeam.map(tt => tt.taskId);
  } catch (error) {
    logger.error('Error getting user tasks', { userId, error });
    return [];
  }
}

