/**
 * Review Note Status API Route
 * POST - Change review note status
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { ChangeReviewNoteStatusSchema } from '@/lib/validation/schemas';
import {
  changeReviewNoteStatus,
  getReviewNoteById,
} from '@/lib/services/review-notes/reviewNoteService';
import {
  notifyReviewNoteAddressed,
  notifyReviewNoteCleared,
  notifyReviewNoteRejected,
} from '@/lib/services/review-notes/reviewNoteNotificationService';
import { successResponse, parseTaskId } from '@/lib/utils/apiUtils';

/**
 * POST /api/tasks/[taskId]/review-notes/[noteId]/status
 * Change the status of a review note
 */
export const POST = secureRoute.mutationWithParams({
  taskIdParam: 'id',
  feature: Feature.MANAGE_TASKS,
  schema: ChangeReviewNoteStatusSchema,
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
    const existingNote = await getReviewNoteById(noteId);
    if (existingNote.taskId !== taskId) {
      return NextResponse.json(
        { success: false, error: 'Review note does not belong to this task' },
        { status: 404 }
      );
    }

    // Change the status
    const updatedNote = await changeReviewNoteStatus(
      noteId,
      data.status,
      user.id,
      user.role,
      data.comment,
      data.reason
    );

    // Send appropriate notification
    if (data.status === 'ADDRESSED') {
      await notifyReviewNoteAddressed(updatedNote);
    } else if (data.status === 'CLEARED') {
      await notifyReviewNoteCleared(updatedNote);
    } else if (data.status === 'REJECTED') {
      await notifyReviewNoteRejected(updatedNote);
    }

    return NextResponse.json(successResponse(updatedNote));
  },
});

