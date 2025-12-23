/**
 * Review Note Attachments API Routes
 * GET - List attachments
 * POST - Upload attachment
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { getReviewNoteById } from '@/lib/services/review-notes/reviewNoteService';
import { successResponse, parseTaskId } from '@/lib/utils/apiUtils';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'review-notes');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

/**
 * GET /api/tasks/[taskId]/review-notes/[noteId]/attachments
 * Get all attachments for a review note
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

    // Get attachments
    const attachments = await prisma.reviewNoteAttachment.findMany({
      where: { reviewNoteId: noteId },
      select: {
        id: true,
        reviewNoteId: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        fileType: true,
        uploadedBy: true,
        createdAt: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(successResponse(attachments));
  },
});

/**
 * POST /api/tasks/[taskId]/review-notes/[noteId]/attachments
 * Upload an attachment to a review note
 */
export const POST = secureRoute.fileUpload({
  handler: async (request, { user }) => {
    try {
      // Parse task ID and note ID from URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const idStr = pathParts[pathParts.indexOf('tasks') + 1];
      const noteIdStr = pathParts[pathParts.indexOf('review-notes') + 1];

      const taskId = parseTaskId(idStr);
      const noteId = Number(noteIdStr);

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

      // Parse form data
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'File size exceeds 10MB limit' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'File type not allowed' },
          { status: 400 }
        );
      }

      // Create upload directory if it doesn't exist
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}-${safeFileName}`;
      const filePath = join(UPLOAD_DIR, fileName);

      // Write file
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      // Save to database
      const attachment = await prisma.reviewNoteAttachment.create({
        data: {
          reviewNoteId: noteId,
          fileName: file.name,
          filePath: `/uploads/review-notes/${fileName}`,
          fileSize: file.size,
          fileType: file.type,
          uploadedBy: user.id,
        },
        select: {
          id: true,
          reviewNoteId: true,
          fileName: true,
          filePath: true,
          fileSize: true,
          fileType: true,
          uploadedBy: true,
          createdAt: true,
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(successResponse(attachment), { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to upload attachment' },
        { status: 500 }
      );
    }
  },
});

