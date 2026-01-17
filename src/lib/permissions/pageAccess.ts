/**
 * Page Access Utilities
 * Functions for checking page permissions with 4-tier lookup:
 * 1. Redis Cache
 * 2. Database Override
 * 3. Code-based Configuration
 * 4. Convention-based Defaults
 */

import { prisma } from '@/lib/db/prisma';
import { SystemRole, ServiceLineRole } from '@/types';
import { PageAccessLevel, PageAccessResult, PageRole } from '@/types/pagePermissions';
import { PAGE_PERMISSIONS, getDefaultAccessLevel } from './pagePermissions';
import { logger } from '@/lib/utils/logger';
import { getCachedPagePermission, setCachedPagePermission } from '@/lib/cache/pagePermissionCache';
import { getConventionBasedPermission, extractServiceLineFromPath } from '@/lib/services/admin/pageDiscovery';

/**
 * Get user's highest service line role for the given service line context
 */
async function getUserHighestServiceLineRole(
  userId: string,
  serviceLine: string | null
): Promise<ServiceLineRole | null> {
  if (!serviceLine) {
    return null;
  }

  // Get user's service line assignments
  const assignments = await prisma.serviceLineUser.findMany({
    where: {
      userId,
    },
    select: {
      role: true,
      subServiceLineGroup: true,
    },
  });

  if (assignments.length === 0) {
    return null;
  }

  // Map external service lines to user's assignments
  const externalMappings = await prisma.serviceLineExternal.findMany({
    where: {
      masterCode: serviceLine,
    },
    select: {
      SubServlineGroupCode: true,
    },
  });

  const userSubGroups = new Set(assignments.map((a) => a.subServiceLineGroup));
  const relevantMappings = externalMappings.filter(
    (m) => m.SubServlineGroupCode && userSubGroups.has(m.SubServlineGroupCode)
  );

  if (relevantMappings.length === 0) {
    return null;
  }

  // Get highest role among relevant assignments
  const roleHierarchy: Record<ServiceLineRole, number> = {
    ADMINISTRATOR: 6,
    PARTNER: 5,
    MANAGER: 4,
    SUPERVISOR: 3,
    USER: 2,
    VIEWER: 1,
  };

  let highestRole: ServiceLineRole | null = null;
  let highestRank = 0;

  for (const assignment of assignments) {
    const role = assignment.role as ServiceLineRole;
    const rank = roleHierarchy[role] || 0;
    if (rank > highestRank) {
      highestRole = role;
      highestRank = rank;
    }
  }

  return highestRole;
}

/**
 * Check if a user has access to a specific page
 * 4-tier lookup: Cache -> Database -> Code -> Convention
 * @param userId - User ID
 * @param pathname - Page pathname (e.g., '/dashboard/admin/users')
 * @returns Access result with canAccess flag and access level
 */
export async function checkPageAccess(
  userId: string,
  pathname: string
): Promise<PageAccessResult> {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pageAccess.ts:100',message:'checkPageAccess entry',data:{userId,pathname},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Get user's system role and check for SYSTEM_ADMIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pageAccess.ts:112',message:'user database lookup',data:{hasUser:!!user,userRole:user?.role,roleType:typeof user?.role},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!user) {
      return {
        canAccess: false,
        accessLevel: PageAccessLevel.NONE,
      };
    }

    const systemRole = user.role as SystemRole;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pageAccess.ts:126',message:'SYSTEM_ADMIN check',data:{systemRole,SystemRoleEnum:SystemRole.SYSTEM_ADMIN,isMatch:systemRole===SystemRole.SYSTEM_ADMIN,strictEquality:systemRole==='SYSTEM_ADMIN'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // SYSTEM_ADMIN bypasses all checks
    if (systemRole === SystemRole.SYSTEM_ADMIN) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pageAccess.ts:134',message:'SYSTEM_ADMIN early return triggered',data:{returnValue:{canAccess:true,accessLevel:'FULL'}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return {
        canAccess: true,
        accessLevel: PageAccessLevel.FULL,
        role: SystemRole.SYSTEM_ADMIN,
      };
    }

    // Determine service line context from pathname
    const serviceLine = extractServiceLineFromPath(pathname);

    // Determine the appropriate role to use for permission checks
    let role: SystemRole | ServiceLineRole;
    
    if (serviceLine) {
      // Service line page - requires service line role assignment
      const serviceLineRole = await getUserHighestServiceLineRole(userId, serviceLine);
      
      if (!serviceLineRole) {
        // User has no access to this service line
        return {
          canAccess: false,
          accessLevel: PageAccessLevel.NONE,
        };
      }
      
      role = serviceLineRole;
    } else {
      // System page (e.g., /dashboard/notifications, /dashboard/admin/*) - use SystemRole
      role = systemRole;
    }

    // 1. Check Redis cache
    const cached = await getCachedPagePermission(pathname, role);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pageAccess.ts:150',message:'redis cache check',data:{hasCached:!!cached,cachedValue:cached},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (cached) {
      return cached;
    }

    // Try to find matching pattern
    const matchedPattern = findMatchingPattern(pathname);
    const checkPath = matchedPattern || pathname;

    // 2. Check database override
    const dbPermission = await prisma.pagePermission.findFirst({
      where: {
        pathname: checkPath,
        role,
        active: true,
      },
    });

    if (dbPermission) {
      const result: PageAccessResult = {
        canAccess: dbPermission.accessLevel !== 'NONE',
        accessLevel: dbPermission.accessLevel as PageAccessLevel,
        matchedPattern: checkPath,
        role,
      };

      // Cache the result
      await setCachedPagePermission(pathname, role, result);

      return result;
    }

    // 3. Check code-based overrides
    if (matchedPattern) {
      const permissions = PAGE_PERMISSIONS[matchedPattern];
      const codePermission = permissions ? (permissions as Record<string, PageAccessLevel>)[role] : undefined;
      if (codePermission !== undefined) {
        const result: PageAccessResult = {
          canAccess: codePermission !== PageAccessLevel.NONE,
          accessLevel: codePermission,
          matchedPattern,
          role,
        };

        return result;
      }
    }

    // 4. Fall back to convention-based defaults
    const conventions = getConventionBasedPermission(pathname);
    const accessLevel = (conventions[role] as PageAccessLevel) || PageAccessLevel.NONE;

    const result: PageAccessResult = {
      canAccess: accessLevel !== PageAccessLevel.NONE,
      accessLevel,
      role,
    };

    return result;
  } catch (error) {
    logger.error('Error checking page access', { userId, pathname, error });
    // Fail secure - deny access on error
    return {
      canAccess: false,
      accessLevel: PageAccessLevel.NONE,
    };
  }
}

/**
 * Find the best matching pattern for a pathname
 * More specific patterns take precedence over wildcards
 * @param pathname - Page pathname
 * @returns Matched pattern or null
 */
function findMatchingPattern(pathname: string): string | null {
  const patterns = Object.keys(PAGE_PERMISSIONS);

  // First, try exact match
  if (patterns.includes(pathname)) {
    return pathname;
  }

  // Then, try pattern matches (most specific first)
  const matchedPatterns = patterns
    .filter((pattern) => matchPagePattern(pathname, pattern))
    .sort((a, b) => {
      // Sort by specificity (fewer wildcards = more specific)
      const aWildcards = (a.match(/:/g) || []).length + (a.match(/\*/g) || []).length;
      const bWildcards = (b.match(/:/g) || []).length + (b.match(/\*/g) || []).length;
      return aWildcards - bWildcards;
    });

  return matchedPatterns[0] || null;
}

/**
 * Check if a pathname matches a pattern
 * Supports:
 * - Exact matches: '/dashboard/admin/users'
 * - Wildcards: '/dashboard/admin/*' matches all admin pages
 * - Dynamic params: '/dashboard/tasks/:id' matches '/dashboard/tasks/123'
 * 
 * @param pathname - Actual page pathname
 * @param pattern - Pattern to match against
 * @returns true if pathname matches pattern
 */
export function matchPagePattern(pathname: string, pattern: string): boolean {
  // Exact match
  if (pathname === pattern) {
    return true;
  }

  // Convert pattern to regex
  // Replace :param with regex to match any segment
  // Replace * with regex to match any remaining path
  const regexPattern = pattern
    .replace(/:[^/]+/g, '[^/]+') // :id -> match single segment
    .replace(/\*/g, '.*'); // * -> match any remaining path

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

/**
 * Check page access synchronously (for client-side)
 * Note: This only uses code-based and convention defaults (no DB lookup)
 * @param role - User's role (system or service line)
 * @param pathname - Page pathname
 * @returns Access result
 */
export function checkPageAccessSync(
  role: PageRole,
  pathname: string
): PageAccessResult {
  // SYSTEM_ADMIN bypasses all checks
  if (role === SystemRole.SYSTEM_ADMIN) {
    return {
      canAccess: true,
      accessLevel: PageAccessLevel.FULL,
      role,
    };
  }

  const matchedPattern = findMatchingPattern(pathname);

  // Check code-based permissions
  if (matchedPattern) {
    const permissions = PAGE_PERMISSIONS[matchedPattern];
    // Type assertion needed due to complex union type indexing
    // @ts-expect-error - PageRole union type indexing limitation
    const accessLevel: PageAccessLevel | undefined = permissions?.[role];

    if (accessLevel !== undefined) {
      return {
        canAccess: accessLevel !== PageAccessLevel.NONE,
        accessLevel,
        matchedPattern,
        role,
      };
    }
  }

  // Fall back to convention-based defaults
  const conventions = getConventionBasedPermission(pathname);
  const accessLevel: PageAccessLevel = (conventions[role] as PageAccessLevel) || PageAccessLevel.NONE;

  return {
    canAccess: accessLevel !== PageAccessLevel.NONE,
    accessLevel,
    role,
  };
}

