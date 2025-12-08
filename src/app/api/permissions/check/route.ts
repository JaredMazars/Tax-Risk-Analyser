/**
 * Permission Check API Endpoint
 * Checks if current user has specific feature(s)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { checkFeature, checkAnyFeature, checkAllFeatures } from '@/lib/permissions/checkFeature';
import { Feature } from '@/lib/permissions/features';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature');
    const featuresParam = searchParams.get('features');
    const mode = searchParams.get('mode') || 'any'; // 'any' or 'all'
    const serviceLine = searchParams.get('serviceLine') || undefined;

    // Single feature check
    if (feature) {
      const hasFeature = await checkFeature(user.id, feature as Feature, serviceLine);
      return NextResponse.json(successResponse({ hasFeature }));
    }

    // Multiple features check
    if (featuresParam) {
      const features = featuresParam.split(',').map(f => f.trim() as Feature);
      
      const hasFeature = mode === 'all'
        ? await checkAllFeatures(user.id, features, serviceLine)
        : await checkAnyFeature(user.id, features, serviceLine);

      return NextResponse.json(successResponse({ hasFeature }));
    }

    // No feature specified
    return NextResponse.json(
      { error: 'Missing feature or features parameter' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error, 'Permission check failed');
  }
}
