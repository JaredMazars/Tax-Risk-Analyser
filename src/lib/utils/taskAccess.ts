/**
 * Task Access Utilities
 * 
 * Simplified and clear task access checking with detailed access metadata.
 * Consolidates the complex task access logic from auth.ts into a single,
 * easy-to-understand API.
 */

import { prisma } from '@/lib/db/prisma';
import { isSystemAdmin } from './systemAdmin';
import { hasServiceLineRole } from './roleHierarchy';
import { logger } from './logger';

/**
 * Task access type - indicates HOW the user has access
 */
export enum TaskAccessType {
  /** User is a SYSTEM_ADMIN with global access */
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  /** User is Partner/Admin in task's service line (can see all tasks) */
  SERVICE_LINE_ADMIN = 'SERVICE_LINE_ADMIN',
  /** User is explicitly assigned as TaskTeam member */
  TASK_MEMBER = 'TASK_MEMBER',
  /** User has no access */
  NO_ACCESS = 'NO_ACCESS',
}

/**
 * Task access result with detailed metadata
 */
export interface TaskAccessResult {
  /** Whether user has access */
  canAccess: boolean;
  /** How the user has access */
  accessType: TaskAccessType;
  /** User's role in task (if applicable) */
  taskRole?: string;
  /** User's role in service line (if applicable) */
  serviceLineRole?: string;
  /** Service line the task belongs to */
  serviceLine?: string;
  /** Whether user is SYSTEM_ADMIN */
  isSystemAdmin: boolean;
}

/**
 * Check if user can access a task
 * 
 * Returns detailed information about HOW the user has access.
 * 
 * Access Rules:
 * 1. SYSTEM_ADMIN → Full access (global)
 * 2. ADMIN/PARTNER in task's service line → Can see all tasks
 * 3. TaskTeam member → Access based on role
 * 
 * @param userId - User ID to check
 * @param taskId - Task ID to check access for
 * @param requiredRole - Optional minimum task role required
 * @returns Detailed access result
 */
/**
 * Helper: Check if user is system admin
 */
async function checkSystemAdminAccess(userId: string): Promise<TaskAccessResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return {
      canAccess: false,
      accessType: TaskAccessType.NO_ACCESS,
      isSystemAdmin: false,
    };
  }

  if (isSystemAdmin(user)) {
    return {
      canAccess: true,
      accessType: TaskAccessType.SYSTEM_ADMIN,
      isSystemAdmin: true,
    };
  }

  return null;
}

/**
 * Helper: Check service line admin access
 */
async function checkServiceLineAccess(
  userId: string,
  serviceLine: string
): Promise<{ isAdmin: boolean; role?: string }> {
  const serviceLineUser = await prisma.serviceLineUser.findUnique({
    where: {
      userId_serviceLine: { userId, serviceLine },
    },
    select: { role: true },
  });

  const isAdmin = serviceLineUser?.role === 'ADMINISTRATOR' || serviceLineUser?.role === 'PARTNER';
  return { isAdmin, role: serviceLineUser?.role };
}

/**
 * Helper: Check task membership and role
 */
async function checkTaskMembership(
  userId: string,
  taskId: number,
  requiredRole?: string
): Promise<{ hasAccess: boolean; role?: string; meetsRoleRequirement?: boolean }> {
  const taskTeam = await prisma.taskTeam.findUnique({
    where: {
      taskId_userId: { taskId, userId },
    },
    select: { role: true },
  });

  if (!taskTeam) {
    return { hasAccess: false };
  }

  if (requiredRole) {
    const { hasTaskRole } = await import('./roleHierarchy');
    const meetsRoleRequirement = hasTaskRole(taskTeam.role, requiredRole);
    return { hasAccess: true, role: taskTeam.role, meetsRoleRequirement };
  }

  return { hasAccess: true, role: taskTeam.role, meetsRoleRequirement: true };
}

/**
 * Main function: Check if user can access task
 * Refactored to reduce cognitive complexity
 */
export async function canAccessTask(
  userId: string,
  taskId: number,
  requiredRole?: string
): Promise<TaskAccessResult> {
  try {
    // Check system admin access first
    const adminAccess = await checkSystemAdminAccess(userId);
    if (adminAccess) return adminAccess;

    // Get task info
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { ServLineCode: true },
    });

    if (!task) {
      return {
        canAccess: false,
        accessType: TaskAccessType.NO_ACCESS,
        isSystemAdmin: false,
      };
    }

    // Check service line admin access
    const { isAdmin: isServiceLineAdmin, role: serviceLineRole } = await checkServiceLineAccess(
      userId,
      task.ServLineCode
    );

    if (isServiceLineAdmin) {
      return {
        canAccess: true,
        accessType: TaskAccessType.SERVICE_LINE_ADMIN,
        serviceLineRole,
        serviceLine: task.ServLineCode,
        isSystemAdmin: false,
      };
    }

    // Check task membership
    const membership = await checkTaskMembership(userId, taskId, requiredRole);

    if (!membership.hasAccess) {
      return {
        canAccess: false,
        accessType: TaskAccessType.NO_ACCESS,
        serviceLine: task.ServLineCode,
        isSystemAdmin: false,
      };
    }

    if (requiredRole && !membership.meetsRoleRequirement) {
      return {
        canAccess: false,
        accessType: TaskAccessType.TASK_MEMBER,
        taskRole: membership.role,
        serviceLine: task.ServLineCode,
        serviceLineRole,
        isSystemAdmin: false,
      };
    }

    return {
      canAccess: true,
      accessType: TaskAccessType.TASK_MEMBER,
      taskRole: membership.role,
      serviceLine: task.ServLineCode,
      serviceLineRole,
      isSystemAdmin: false,
    };
  } catch (error) {
    logger.error('Error checking task access', { userId, taskId, error });
    return {
      canAccess: false,
      accessType: TaskAccessType.NO_ACCESS,
      isSystemAdmin: false,
    };
  }
}

/**
 * Simple boolean check for task access
 * @param userId - User ID
 * @param taskId - Task ID
 * @param requiredRole - Optional minimum role required
 * @returns true if user can access task
 */
export async function hasTaskAccess(
  userId: string,
  taskId: number,
  requiredRole?: string
): Promise<boolean> {
  const result = await canAccessTask(userId, taskId, requiredRole);
  return result.canAccess;
}

/**
 * Require task access, throw error if user doesn't have access
 * @param userId - User ID
 * @param taskId - Task ID
 * @param requiredRole - Optional minimum role required
 * @throws Error if user doesn't have access
 */
export async function requireTaskAccess(
  userId: string,
  taskId: number,
  requiredRole?: string
): Promise<void> {
  const result = await canAccessTask(userId, taskId, requiredRole);
  
  if (!result.canAccess) {
    const message = requiredRole
      ? `Access denied: ${requiredRole} role required`
      : 'Access denied: Not a task member';
    throw new Error(message);
  }
}

/**
 * Get user's effective role in task
 * 
 * Returns the highest applicable role:
 * - SYSTEM_ADMIN → 'SYSTEM_ADMIN'
 * - Service Line Administrator → 'ADMINISTRATOR'
 * - Task Member → Task role
 * 
 * @param userId - User ID
 * @param taskId - Task ID
 * @returns Effective role or null if no access
 */
export async function getEffectiveTaskRole(
  userId: string,
  taskId: number
): Promise<string | null> {
  const access = await canAccessTask(userId, taskId);
  
  if (!access.canAccess) {
    return null;
  }
  
  switch (access.accessType) {
    case TaskAccessType.SYSTEM_ADMIN:
      return 'SYSTEM_ADMIN';
    case TaskAccessType.SERVICE_LINE_ADMIN:
      return 'ADMINISTRATOR'; // Service line administrators have admin-level task access
    case TaskAccessType.TASK_MEMBER:
      return access.taskRole || null;
    default:
      return null;
  }
}

/**
 * Check if user can manage task (assign users, delete, etc.)
 * 
 * Management access requires:
 * - SYSTEM_ADMIN, OR
 * - Service Line ADMIN/PARTNER/MANAGER, OR
 * - Task ADMIN role
 * 
 * @param userId - User ID
 * @param taskId - Task ID
 * @returns true if user can manage task
 */
export async function canManageTask(
  userId: string,
  taskId: number
): Promise<boolean> {
  const access = await canAccessTask(userId, taskId);
  
  if (!access.canAccess) {
    return false;
  }
  
  // SYSTEM_ADMIN can manage all tasks
  if (access.isSystemAdmin) {
    return true;
  }
  
  // Service line ADMIN/PARTNER/MANAGER can manage tasks
  if (access.serviceLineRole && hasServiceLineRole(access.serviceLineRole, 'MANAGER')) {
    return true;
  }
  
  // Task ADMIN can manage
  if (access.taskRole === 'ADMIN') {
    return true;
  }
  
  return false;
}

/**
 * Check if user can delete task
 * 
 * Delete access requires:
 * - SYSTEM_ADMIN, OR
 * - Service Line ADMIN/PARTNER/MANAGER, OR
 * - Task ADMIN role
 * 
 * @param userId - User ID
 * @param taskId - Task ID
 * @returns true if user can delete task
 */
export async function canDeleteTask(
  userId: string,
  taskId: number
): Promise<boolean> {
  // Same rules as manage for now
  return canManageTask(userId, taskId);
}

/**
 * Check if user can assign team members to task
 * 
 * Assignment access requires:
 * - SYSTEM_ADMIN, OR
 * - Service Line ADMIN/PARTNER/MANAGER, OR
 * - Task ADMIN role
 * 
 * @param userId - User ID
 * @param taskId - Task ID
 * @returns true if user can assign team members
 */
export async function canAssignTeamMembers(
  userId: string,
  taskId: number
): Promise<boolean> {
  // Same rules as manage for now
  return canManageTask(userId, taskId);
}

/**
 * Format access type for display
 * @param accessType - Access type
 * @returns Formatted string
 */
export function formatAccessType(accessType: TaskAccessType): string {
  switch (accessType) {
    case TaskAccessType.SYSTEM_ADMIN:
      return 'System Administrator';
    case TaskAccessType.SERVICE_LINE_ADMIN:
      return 'Service Line Administrator';
    case TaskAccessType.TASK_MEMBER:
      return 'Task Member';
    case TaskAccessType.NO_ACCESS:
      return 'No Access';
    default:
      return 'Unknown';
  }
}

/**
 * Get detailed access summary for UI display
 * @param result - Task access result
 * @returns Human-readable access summary
 */
export function getAccessSummary(result: TaskAccessResult): string {
  if (!result.canAccess) {
    return 'You do not have access to this task.';
  }
  
  switch (result.accessType) {
    case TaskAccessType.SYSTEM_ADMIN:
      return 'You have full access as a System Administrator.';
    case TaskAccessType.SERVICE_LINE_ADMIN:
      return `You have access as a ${result.serviceLineRole} in the ${result.serviceLine} service line.`;
    case TaskAccessType.TASK_MEMBER:
      return `You are a task member with ${result.taskRole} role.`;
    default:
      return 'You have access to this task.';
  }
}



