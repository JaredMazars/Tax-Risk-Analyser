/**
 * Review Note Assignment API Route
 * POST - Assign or reassign review note
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { AssignReviewNoteSchema } from '@/lib/validation/schemas';
import {
  assignReviewNote,
  getReviewNoteById,
} from '@/lib/services/review-notes/reviewNoteService';
import { notifyReviewNoteAssigned } from '@/lib/services/review-notes/reviewNoteNotificationService';
import { successResponse, parseTaskId } from '@/lib/utils/apiUtils';

/**
 * POST /api/tasks/[taskId]/review-notes/[noteId]/assign
 * Assign or reassign a review note to a user
 */
export const POST = secureRoute.mutationWithParams({
  taskIdParam: 'id',
  feature: Feature.MANAGE_TASKS,
  schema: AssignReviewNoteSchema,
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

    // Assign the review note
    const updatedNote = await assignReviewNote(noteId, data.assignedTo, user.id);

    // Send notification to new assignee
    await notifyReviewNoteAssigned(updatedNote);

    return NextResponse.json(successResponse(updatedNote));
  },
});

