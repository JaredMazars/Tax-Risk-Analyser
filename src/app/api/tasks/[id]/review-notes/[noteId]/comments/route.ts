/**
 * Review Note Comments API Routes
 * GET - List comments on a review note
 * POST - Add a comment to a review note
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { CreateReviewNoteCommentSchema } from '@/lib/validation/schemas';
import { getReviewNoteById } from '@/lib/services/review-notes/reviewNoteService';
import { notifyReviewNoteCommentAdded } from '@/lib/services/review-notes/reviewNoteNotificationService';
import { successResponse, parseTaskId } from '@/lib/utils/apiUtils';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/tasks/[taskId]/review-notes/[noteId]/comments
 * Get all comments on a review note
 */
export const GET = secureRoute.queryWithParams({
  taskIdParam: 'id',
  handler: async (request, { user, params }) => {
    const taskId = parseTaskId(params.id);
    const noteId = Number(params.noteId);

    if (isNaN(noteId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    // Verify note belongs to this task
    const reviewNote = await getReviewNoteById(noteId);
    if (reviewNote.taskId !== taskId) {
      return NextResponse.json(
        { success: false, error: 'Review note does not belong to this task' },
        { status: 404 }
      );
    }

    // Get comments
    const comments = await prisma.reviewNoteComment.findMany({
      where: { reviewNoteId: noteId },
      select: {
        id: true,
        reviewNoteId: true,
        userId: true,
        comment: true,
        isInternal: true,
        createdAt: true,
        updatedAt: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Filter internal comments if user is not the raiser
    const filteredComments = comments.filter((comment) => {
      if (!comment.isInternal) return true;
      return user.id === reviewNote.raisedBy || user.role === 'SYSTEM_ADMIN';
    });

    return NextResponse.json(successResponse(filteredComments));
  },
});

/**
 * POST /api/tasks/[taskId]/review-notes/[noteId]/comments
 * Add a comment to a review note
 */
export const POST = secureRoute.mutationWithParams({
  taskIdParam: 'id',
  feature: Feature.MANAGE_TASKS,
  schema: CreateReviewNoteCommentSchema,
  handler: async (request, { user, data, params }) => {
    const taskId = parseTaskId(params.id);
    const noteId = Number(params.noteId);

    if (isNaN(noteId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    // Verify note belongs to this task
    const reviewNote = await getReviewNoteById(noteId);
    if (reviewNote.taskId !== taskId) {
      return NextResponse.json(
        { success: false, error: 'Review note does not belong to this task' },
        { status: 404 }
      );
    }

    // Create the comment
    const comment = await prisma.reviewNoteComment.create({
      data: {
        reviewNoteId: noteId,
        userId: user.id,
        comment: data.comment,
        isInternal: data.isInternal || false,
      },
      select: {
        id: true,
        reviewNoteId: true,
        userId: true,
        comment: true,
        isInternal: true,
        createdAt: true,
        updatedAt: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send notification (not for internal comments)
    if (!comment.isInternal) {
      await notifyReviewNoteCommentAdded(noteId, user.id, data.comment);
    }

    return NextResponse.json(successResponse(comment), { status: 201 });
  },
});

