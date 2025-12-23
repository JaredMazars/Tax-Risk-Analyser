/**
 * Individual Review Category API Routes
 * PUT - Update category
 * DELETE - Deactivate category
 */

import { NextResponse } from 'next/server';
import { secureRoute } from '@/lib/api/secureRoute';
import { UpdateReviewCategorySchema } from '@/lib/validation/schemas';
import { successResponse } from '@/lib/utils/apiUtils';
import { prisma } from '@/lib/db/prisma';
import { hasPartnerAccess } from '@/lib/utils/roleHierarchy';

/**
 * PUT /api/tasks/[taskId]/review-notes/categories/[categoryId]
 * Update a review category (PARTNER+ only)
 */
export const PUT = secureRoute.mutation({
  schema: UpdateReviewCategorySchema,
  handler: async (request, { user, data }) => {
    // Check if user is partner or above
    if (!hasPartnerAccess(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only partners and above can update categories' },
        { status: 403 }
      );
    }

    // Get category ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const categoryId = Number(pathParts[pathParts.length - 1]);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.reviewCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update category
    const category = await prisma.reviewCategory.update({
      where: { id: categoryId },
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

    return NextResponse.json(successResponse(category));
  },
});

/**
 * DELETE /api/tasks/[taskId]/review-notes/categories/[categoryId]
 * Deactivate a review category (PARTNER+ only)
 * Note: We don't actually delete to preserve data integrity
 */
export const DELETE = secureRoute.mutation({
  handler: async (request, { user }) => {
    // Check if user is partner or above
    if (!hasPartnerAccess(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only partners and above can deactivate categories' },
        { status: 403 }
      );
    }

    // Get category ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const categoryId = Number(pathParts[pathParts.length - 1]);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.reviewCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Deactivate category
    await prisma.reviewCategory.update({
      where: { id: categoryId },
      data: { active: false },
    });

    return NextResponse.json(successResponse({ message: 'Category deactivated successfully' }));
  },
});

