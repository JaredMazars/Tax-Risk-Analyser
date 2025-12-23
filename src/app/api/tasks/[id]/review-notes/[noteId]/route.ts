/**
 * Individual Review Note API Routes
 * GET - Get single review note with details
 * PUT - Update review note
 * DELETE - Delete review note
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { UpdateReviewNoteSchema } from '@/lib/validation/schemas';
import {
  getReviewNoteById,
  updateReviewNote,
  deleteReviewNote,
} from '@/lib/services/review-notes/reviewNoteService';
import { successResponse, parseTaskId } from '@/lib/utils/apiUtils';

/**
 * GET /api/tasks/[taskId]/review-notes/[noteId]
 * Get a single review note with full details
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

    // Get query parameters for includes
    const { searchParams } = new URL(request.url);
    const includeComments = searchParams.get('includeComments') === 'true';
    const includeAttachments = searchParams.get('includeAttachments') === 'true';

    // Get review note
    const reviewNote = await getReviewNoteById(noteId, includeComments, includeAttachments);

    // Verify task matches
    if (reviewNote.taskId !== taskId) {
      return NextResponse.json(
        { success: false, error: 'Review note does not belong to this task' },
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(reviewNote));
  },
});

/**
 * PUT /api/tasks/[taskId]/review-notes/[noteId]
 * Update a review note
 */
export const PUT = secureRoute.mutationWithParams({
  taskIdParam: 'id',
  feature: Feature.MANAGE_TASKS,
  schema: UpdateReviewNoteSchema,
  handler: async (request, { user, data, params }) => {
    const taskId = parseTaskId(params.id);
    const noteId = Number(params.noteId);

    if (isNaN(noteId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    // Update the review note
    const updatedNote = await updateReviewNote(noteId, data, user.id);

    // Verify task matches
    if (updatedNote.taskId !== taskId) {
      return NextResponse.json(
        { success: false, error: 'Review note does not belong to this task' },
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(updatedNote));
  },
});

/**
 * DELETE /api/tasks/[taskId]/review-notes/[noteId]
 * Delete a review note
 */
export const DELETE = secureRoute.mutationWithParams({
  taskIdParam: 'id',
  feature: Feature.MANAGE_TASKS,
  handler: async (request, { user, params }) => {
    const taskId = parseTaskId(params.id);
    const noteId = Number(params.noteId);

    if (isNaN(noteId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    // Get note to verify task
    const reviewNote = await getReviewNoteById(noteId);

    if (reviewNote.taskId !== taskId) {
      return NextResponse.json(
        { success: false, error: 'Review note does not belong to this task' },
        { status: 404 }
      );
    }

    // Delete the review note
    await deleteReviewNote(noteId, user.id);

    return NextResponse.json(successResponse({ message: 'Review note deleted successfully' }));
  },
});

