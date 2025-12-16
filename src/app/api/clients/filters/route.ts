import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError, AppError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';

/**
 * GET /api/clients/filters
 * Fetch distinct filter option values for client filters
 * Returns industries and groups for filter dropdowns
 * 
 * Performance optimizations:
 * - Redis caching (30min TTL for relatively static data)
 * - No pagination (returns all distinct values)
 * - Optional search parameter for server-side filtering
 */
export async function GET(request: NextRequest) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:20',message:'API route handler started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // 1. Authenticate
    const user = await getCurrentUser();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:28',message:'After getCurrentUser',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check Permission
    const { checkFeature } = await import('@/lib/permissions/checkFeature');
    const { Feature } = await import('@/lib/permissions/features');
    const { getUserSubServiceLineGroups } = await import('@/lib/services/service-lines/serviceLineService');
    
    const hasPagePermission = await checkFeature(user.id, Feature.ACCESS_CLIENTS);
    const userSubGroups = await getUserSubServiceLineGroups(user.id);
    const hasServiceLineAccess = userSubGroups.length > 0;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:45',message:'After permission checks',data:{hasPagePermission,hasServiceLineAccess,userSubGroupsCount:userSubGroups.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // Grant access if user has either page permission OR service line assignment
    if (!hasPagePermission && !hasServiceLineAccess) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    // Parse query parameters - support separate searches for each filter
    const { searchParams } = new URL(request.url);
    const industrySearch = searchParams.get('industrySearch') || '';
    const groupSearch = searchParams.get('groupSearch') || '';

    // Build cache key
    const cacheKey = `${CACHE_PREFIXES.ANALYTICS}client-filters:industry:${industrySearch}:group:${groupSearch}:user:${user.id}`;
    
    // Try cache first (30min TTL since filter options are relatively static)
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(successResponse(cached));
    }

    // Build separate where clauses for industries and groups
    interface IndustryWhereClause {
      industry?: { contains: string; mode: 'insensitive' };
    }
    
    interface GroupWhereClause {
      AND?: Array<Record<string, unknown>>;
      NOT?: { OR: Array<{ groupCode: null } | { groupDesc: null }> };
      OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>>;
    }
    
    const industryWhere: IndustryWhereClause = {};
    const groupWhere: GroupWhereClause = {};

    if (industrySearch) {
      industryWhere.industry = { contains: industrySearch, mode: 'insensitive' };
    }

    // Build group where clause - filter out null values
    // NOT (groupCode = null OR groupDesc = null) => groupCode != null AND groupDesc != null
    groupWhere.NOT = {
      OR: [
        { groupCode: null },
        { groupDesc: null },
      ],
    };

    if (groupSearch) {
      groupWhere.OR = [
        { groupDesc: { contains: groupSearch, mode: 'insensitive' } },
        { groupCode: { contains: groupSearch, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel for better performance
    const [industriesData, groupsData] = await Promise.all([
      // Get distinct industries with independent search
      prisma.client.findMany({
        where: industryWhere,
        select: {
          industry: true,
        },
        distinct: ['industry'],
        orderBy: {
          industry: 'asc',
        },
      }),
      
      // Get distinct groups with independent search - using findMany instead of groupBy
      prisma.client.findMany({
        where: groupWhere,
        select: {
          groupCode: true,
          groupDesc: true,
        },
        distinct: ['groupCode'],
        orderBy: {
          groupDesc: 'asc',
        },
      }),
    ]);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:115',message:'Raw groups from DB',data:{groupsCount:groupsData.length,firstThree:groupsData.slice(0,3),groupWhere},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion

    // Format the response
    const industries = industriesData
      .map(client => client.industry)
      .filter((industry): industry is string => !!industry);

    // Groups are already filtered by non-null in the query
    const groups = groupsData.map(group => ({
      code: group.groupCode!,
      name: group.groupDesc!,
    }));

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:127',message:'Formatted groups',data:{groupsCount:groups.length,firstThree:groups.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const responseData = {
      industries,
      groups,
    };

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:135',message:'Final API response',data:{industriesCount:industries.length,groupsCount:groups.length,cacheKey},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Cache the response (30min TTL)
    await cache.set(cacheKey, responseData, 1800);

    return NextResponse.json(successResponse(responseData));
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:163',message:'ERROR caught',data:{errorMessage:error instanceof Error ? error.message : String(error),errorType:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return handleApiError(error, 'Get Client Filters');
  }
}


