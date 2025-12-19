/**
 * Page Registry API Route
 * GET: Get all pages in the registry (auto-discovered)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { checkFeature } from '@/lib/permissions/checkFeature';
import { Feature } from '@/lib/permissions/features';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { getPageRegistry } from '@/lib/services/admin/pagePermissionService';

/**
 * GET /api/admin/page-permissions/registry
 * Get all pages in the registry
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
    const activeOnly = searchParams.get('active') !== 'false';
    const category = searchParams.get('category') || undefined;

    // 4. Get registry
    const registry = await getPageRegistry({
      active: activeOnly ? true : undefined,
      category,
    });

    return NextResponse.json(successResponse(registry));
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/page-permissions/registry');
  }
}



