/**
 * Authorization Service
 * 
 * @deprecated This module is being phased out. Prefer importing from canonical locations:
 * - `isSystemAdmin` -> `@/lib/services/auth/auth` (async DB) or `@/lib/utils/systemAdmin` (sync)
 * - `canApproveAcceptance` / `canApproveEngagementLetter` -> `@/lib/services/tasks/taskAuthorization`
 * - `hasFeature` / `canManageTasks` etc -> use `checkFeature` from `@/lib/permissions/checkFeature` directly
 * - `getUserSystemRole` / `getServiceLineRole` -> `@/lib/services/service-lines/serviceLineService`
 * 
 * Re-exports are maintained for backward compatibility.
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { SystemRole, ServiceLineRole } from '@/types';
import { checkFeature } from '@/lib/permissions/checkFeature';
import { Feature } from '@/lib/permissions/features';
import {
  getServiceLineRole as getServiceLineRoleFromService,
  checkServiceLineAccess as checkAccessFromService,
} from '@/lib/services/service-lines/serviceLineService';

/**
 * Check if user is a System Admin (database lookup)
 * 
 * @deprecated Use `isSystemAdmin()` from `@/lib/services/auth/auth` instead.
 * This re-export is kept for backward compatibility.
 */
export { isSystemAdmin } from './auth';

/**
 * Get user's system role
 */
export async function getUserSystemRole(userId: string): Promise<SystemRole | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return null;

    // Validate that the role is a valid SystemRole
    if (user.role === SystemRole.SYSTEM_ADMIN || user.role === SystemRole.USER) {
      return user.role as SystemRole;
    }

    // Default to USER if invalid
    return SystemRole.USER;
  } catch (error) {
    logger.error('Error getting user system role', { userId, error });
    return null;
  }
}

/**
 * Get user's role in a specific service line
 * @deprecated Use getServiceLineRole from serviceLineService instead (more flexible typing)
 * This version is kept for internal authorization use only
 */
export async function getServiceLineRole(
  userId: string,
  serviceLine: string
): Promise<ServiceLineRole | null> {
  try {
    // Delegate to serviceLineService which handles sub-groups
    const role = await getServiceLineRoleFromService(userId, serviceLine);
    return role as ServiceLineRole | null;
  } catch (error) {
    logger.error('Error getting service line role', { userId, serviceLine, error });
    return null;
  }
}

/**
 * Check if user is an Administrator or Partner in a service line
 * These are the roles that can approve letters
 */
export async function isPartner(userId: string, serviceLine: string): Promise<boolean> {
  const role = await getServiceLineRole(userId, serviceLine);
  return role === ServiceLineRole.ADMINISTRATOR || role === ServiceLineRole.PARTNER;
}

/**
 * Check if user is a Manager in a service line
 */
export async function isManager(userId: string, serviceLine: string): Promise<boolean> {
  const role = await getServiceLineRole(userId, serviceLine);
  return role === ServiceLineRole.MANAGER;
}

/**
 * Check if user has service line access at all
 * @deprecated Use checkServiceLineAccess from serviceLineService instead (supports role hierarchy)
 * This simplified version is kept for internal authorization use only
 */
export async function hasServiceLineAccess(
  userId: string,
  serviceLine: string
): Promise<boolean> {
  try {
    // Delegate to serviceLineService which handles sub-groups
    return await checkAccessFromService(userId, serviceLine);
  } catch (error) {
    logger.error('Error checking service line access', { userId, serviceLine, error });
    return false;
  }
}

/**
 * Check if user can approve client acceptance for a task
 * @deprecated Use `canApproveAcceptance()` from `@/lib/services/tasks/taskAuthorization` instead.
 */
export { canApproveAcceptance } from '@/lib/services/tasks/taskAuthorization';

/**
 * Check if user can approve engagement letter for a task
 * @deprecated Use `canApproveEngagementLetter()` from `@/lib/services/tasks/taskAuthorization` instead.
 */
export { canApproveEngagementLetter } from '@/lib/services/tasks/taskAuthorization';

/**
 * Check if user has a specific feature
 * Convenience wrapper around checkFeature for use in authorization contexts
 * 
 * @param userId - User ID to check
 * @param feature - Feature to check
 * @param serviceLine - Optional service line context
 * @returns true if user has the feature
 */
export async function hasFeature(
  userId: string,
  feature: Feature,
  serviceLine?: string
): Promise<boolean> {
  return checkFeature(userId, feature, serviceLine);
}

/**
 * Feature-based authorization checks
 * These provide convenient wrappers for common permission checks
 */

export async function canManageTasks(userId: string, serviceLine?: string): Promise<boolean> {
  return checkFeature(userId, Feature.MANAGE_TASKS, serviceLine);
}

export async function canManageClients(userId: string, serviceLine?: string): Promise<boolean> {
  return checkFeature(userId, Feature.MANAGE_CLIENTS, serviceLine);
}

export async function canAccessAdmin(userId: string): Promise<boolean> {
  return checkFeature(userId, Feature.ACCESS_ADMIN);
}

export async function canManageUsers(userId: string): Promise<boolean> {
  return checkFeature(userId, Feature.MANAGE_USERS);
}

export async function canViewAnalytics(userId: string, serviceLine?: string): Promise<boolean> {
  return checkFeature(userId, Feature.ACCESS_ANALYTICS, serviceLine);
}

export async function canExportData(userId: string, serviceLine?: string): Promise<boolean> {
  return checkFeature(userId, Feature.EXPORT_REPORTS, serviceLine);
}



