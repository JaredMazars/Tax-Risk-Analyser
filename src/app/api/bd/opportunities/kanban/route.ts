/**
 * BD Kanban API Route
 * 
 * GET /api/bd/opportunities/kanban
 * Returns kanban board data with opportunities grouped by stage.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { successResponse } from '@/lib/utils/apiUtils';
import { getKanbanData, BDKanbanFilters } from '@/lib/services/bd/kanbanService';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// Zod schema for query params validation
const KanbanQuerySchema = z.object({
  serviceLine: z.string().max(50),
  search: z.string().max(200).optional(),
  assignedTo: z.string().max(1000).optional(),
  stages: z.string().max(1000).optional(),
  minValue: z.string().optional(),
  maxValue: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  includeDrafts: z.enum(['true', 'false']).default('false'),
});

/**
 * GET /api/bd/opportunities/kanban
 * Get opportunities organized by kanban stage
 */
export const GET = secureRoute.query({
  feature: Feature.ACCESS_BD,
  handler: async (request, { user }) => {
    const { searchParams } = new URL(request.url);
    
    // Validate query params with Zod
    const queryParams = KanbanQuerySchema.parse({
      serviceLine: searchParams.get('serviceLine') ?? 'BUSINESS_DEV',
      search: searchParams.get('search') ?? undefined,
      assignedTo: searchParams.get('assignedTo') ?? undefined,
      stages: searchParams.get('stages') ?? undefined,
      minValue: searchParams.get('minValue') ?? undefined,
      maxValue: searchParams.get('maxValue') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      includeDrafts: searchParams.get('includeDrafts') ?? 'false',
    });

    const perfStart = Date.now();

    // Parse filter parameters
    const filters: BDKanbanFilters = {
      serviceLine: queryParams.serviceLine,
      search: queryParams.search,
      assignedTo: queryParams.assignedTo ? queryParams.assignedTo.split(',').filter(Boolean) : undefined,
      stages: queryParams.stages ? queryParams.stages.split(',').map(Number).filter(Boolean) : undefined,
      minValue: queryParams.minValue ? Number(queryParams.minValue) : undefined,
      maxValue: queryParams.maxValue ? Number(queryParams.maxValue) : undefined,
      dateFrom: queryParams.dateFrom ? new Date(queryParams.dateFrom) : undefined,
      dateTo: queryParams.dateTo ? new Date(queryParams.dateTo) : undefined,
      includeDrafts: queryParams.includeDrafts === 'true',
    };

    // Fetch kanban data
    const data = await getKanbanData(filters, user.id);

    logger.info('BD Kanban board data prepared', {
      durationMs: Date.now() - perfStart,
      stages: data.columns.length,
      totalOpportunities: data.columns.reduce((sum, col) => sum + col.count, 0),
    });

    return NextResponse.json(successResponse(data));
  },
});
