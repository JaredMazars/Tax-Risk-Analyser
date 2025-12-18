/**
 * Page Permission Individual API Routes
 * PUT: Update a page permission
 * DELETE: Delete a page permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { checkFeature } from '@/lib/permissions/checkFeature';
import { Feature } from '@/lib/permissions/features';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import {
  updatePagePermission,
  deletePagePermission,
} from '@/lib/services/admin/pagePermissionService';
import { UpdatePagePermissionSchema } from '@/lib/validation/schemas';
import { sanitizeObject } from '@/lib/utils/sanitization';
import { PageAccessLevel } from '@/types/pagePermissions';

/**
 * PUT /api/admin/page-permissions/[id]
 * Update a page permission
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 3. Parse ID
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // 4. Parse and validate body
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = UpdatePagePermissionSchema.parse(sanitized);

    // 5. Update permission - cast accessLevel to enum type and convert null to undefined
    const permission = await updatePagePermission(id, {
      accessLevel: validated.accessLevel as PageAccessLevel | undefined,
      description: validated.description ?? undefined,
      active: validated.active,
    });

    return NextResponse.json(successResponse(permission));
  } catch (error) {
    return handleApiError(error, 'PUT /api/admin/page-permissions/[id]');
  }
}

/**
 * DELETE /api/admin/page-permissions/[id]
 * Delete a page permission (reverts to defaults)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 3. Parse ID
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // 4. Delete permission
    await deletePagePermission(id);

    return NextResponse.json(successResponse({ message: 'Page permission deleted successfully' }));
  } catch (error) {
    return handleApiError(error, 'DELETE /api/admin/page-permissions/[id]');
  }
}

