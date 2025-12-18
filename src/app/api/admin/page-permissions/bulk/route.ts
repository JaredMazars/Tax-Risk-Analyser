/**
 * Page Permissions Bulk API Route
 * POST: Bulk create/update permissions for a pathname (all roles at once)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { checkFeature } from '@/lib/permissions/checkFeature';
import { Feature } from '@/lib/permissions/features';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { bulkUpsertPagePermissions } from '@/lib/services/admin/pagePermissionService';
import { PagePermissionBulkSchema } from '@/lib/validation/schemas';
import { sanitizeObject } from '@/lib/utils/sanitization';
import { PageAccessLevel } from '@/types/pagePermissions';

/**
 * POST /api/admin/page-permissions/bulk
 * Bulk upsert permissions for a pathname (all roles)
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
    const validated = PagePermissionBulkSchema.parse(sanitized);

    // 4. Bulk upsert permissions - cast to enum types and convert null to undefined
    const permissions = await bulkUpsertPagePermissions(
      validated.pathname,
      validated.permissions as Record<string, PageAccessLevel>,
      validated.description ?? undefined,
      user.id
    );

    return NextResponse.json(successResponse(permissions));
  } catch (error) {
    return handleApiError(error, 'POST /api/admin/page-permissions/bulk');
  }
}

