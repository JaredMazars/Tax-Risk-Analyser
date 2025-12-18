/**
 * Page Discovery API Route
 * POST: Trigger page discovery scan
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { checkFeature } from '@/lib/permissions/checkFeature';
import { Feature } from '@/lib/permissions/features';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { syncPageRegistry } from '@/lib/services/admin/pagePermissionService';

/**
 * POST /api/admin/page-permissions/discover
 * Trigger page discovery scan to find all dashboard pages
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

    // 3. Run discovery
    const result = await syncPageRegistry();

    return NextResponse.json(successResponse({
      message: 'Page discovery completed',
      ...result,
    }));
  } catch (error) {
    return handleApiError(error, 'POST /api/admin/page-permissions/discover');
  }
}

