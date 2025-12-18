/**
 * Page Permissions API Routes
 * GET: List all page permissions
 * POST: Create a new page permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { checkFeature } from '@/lib/permissions/checkFeature';
import { Feature } from '@/lib/permissions/features';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import {
  getAllPagePermissions,
  createPagePermission,
  getMergedPagePermissions,
} from '@/lib/services/admin/pagePermissionService';
import { PagePermissionSchema } from '@/lib/validation/schemas';
import { sanitizeObject } from '@/lib/utils/sanitization';
import { PageAccessLevel } from '@/types/pagePermissions';

/**
 * GET /api/admin/page-permissions
 * List all page permissions (merged with defaults)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check permissions
    const hasAccess = await checkFeature(user.id, Feature.ACCESS_ADMIN);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const showMerged = searchParams.get('merged') === 'true';
    const pathname = searchParams.get('pathname') || undefined;
    const role = searchParams.get('role') || undefined;
    const activeOnly = searchParams.get('active') !== 'false';

    // 4. Get permissions
    let permissions;
    
    if (showMerged) {
      // Get merged view with defaults
      permissions = await getMergedPagePermissions();
    } else {
      // Get database overrides only
      permissions = await getAllPagePermissions({
        pathname,
        role,
        active: activeOnly ? true : undefined,
      });
    }

    return NextResponse.json(successResponse(permissions));
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/page-permissions');
  }
}

/**
 * POST /api/admin/page-permissions
 * Create a new page permission override
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check permissions
    const hasAccess = await checkFeature(user.id, Feature.ACCESS_ADMIN);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Parse and validate body
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = PagePermissionSchema.parse(sanitized);

    // 4. Create permission - cast to enum types and convert null to undefined
    const permission = await createPagePermission({
      pathname: validated.pathname,
      role: validated.role,
      accessLevel: validated.accessLevel as PageAccessLevel,
      description: validated.description ?? undefined,
      createdBy: user.id,
    });

    return NextResponse.json(successResponse(permission), { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/admin/page-permissions');
  }
}

