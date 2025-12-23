/**
 * Review Categories API Routes
 * GET - List review categories
 * POST - Create new category
 */

import { NextResponse } from 'next/server';
import { secureRoute } from '@/lib/api/secureRoute';
import { CreateReviewCategorySchema } from '@/lib/validation/schemas';
import { successResponse } from '@/lib/utils/apiUtils';
import { prisma } from '@/lib/db/prisma';
import { hasPartnerAccess } from '@/lib/utils/roleHierarchy';

/**
 * GET /api/tasks/[taskId]/review-notes/categories
 * Get all active review categories
 */
export const GET = secureRoute.query({
  handler: async (request, { user }) => {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const serviceLine = searchParams.get('serviceLine');

    // Build where clause
    const where: any = {
      active: true,
    };

    // Filter by service line if provided
    if (serviceLine) {
      where.OR = [
        { serviceLine },
        { serviceLine: null }, // Include global categories
      ];
    }

    // Get categories
    const categories = await prisma.reviewCategory.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        serviceLine: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(successResponse(categories));
  },
});

/**
 * POST /api/tasks/[taskId]/review-notes/categories
 * Create a new review category (PARTNER+ only)
 */
export const POST = secureRoute.mutation({
  schema: CreateReviewCategorySchema,
  handler: async (request, { user, data }) => {
    // Check if user is partner or above
    if (!hasPartnerAccess(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only partners and above can create categories' },
        { status: 403 }
      );
    }

    // Create category
    const category = await prisma.reviewCategory.create({
      data,
      select: {
        id: true,
        name: true,
        description: true,
        serviceLine: true,
        active: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(successResponse(category), { status: 201 });
  },
});

