import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { bingSearchService } from '@/lib/services/search/bingSearchService';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/search/web
 * Perform general web search using Bing
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const count = parseInt(searchParams.get('count') || '10', 10);
    const market = searchParams.get('market') || 'en-ZA';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    if (!bingSearchService.isEnabled()) {
      return NextResponse.json(
        { error: 'Web search is not configured' },
        { status: 503 }
      );
    }

    logger.info('Performing web search', { query, count, userId: user.id });

    const results = await bingSearchService.searchWeb(query, count, market);

    return NextResponse.json(
      successResponse({
        query,
        count: results.length,
        results,
      })
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/search/web');
  }
}

