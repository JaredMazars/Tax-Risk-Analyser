/**
 * Review Note Attachments API Routes
 * GET - List attachments
 * POST - Upload attachment
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { getReviewNoteById } from '@/lib/services/review-notes/reviewNoteService';
import { successResponse, parseTaskId, parseNumericId } from '@/lib/utils/apiUtils';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { prisma } from '@/lib/db/prisma';
import { uploadReviewNoteAttachment } from '@/lib/services/documents/blobStorage';

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
  feature: Feature.ACCESS_TASKS,
  handler: async (request, { user, params }) => {
    const taskId = parseTaskId(params.id);
    const noteId = parseNumericId(params.noteId, 'Review note ID');

    // Verify note belongs to this task (IDOR protection)
    const reviewNote = await getReviewNoteById(noteId);
    if (reviewNote.taskId !== taskId) {
      throw new AppError(404, 'Review note not found', ErrorCodes.NOT_FOUND);
    }

    // Get attachments
    const attachments = await prisma.reviewNoteAttachment.findMany({
      where: { reviewNoteId: noteId },
      select: {
        id: true,
        reviewNoteId: true,
        commentId: true,
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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });

    const response = NextResponse.json(successResponse(attachments));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  },
});

/**
 * POST /api/tasks/[taskId]/review-notes/[noteId]/attachments
 * Upload an attachment to a review note
 */
export const POST = secureRoute.fileUploadWithParams({
  taskIdParam: 'id',
  feature: Feature.MANAGE_TASKS,
  handler: async (request, { user, params }) => {
    const taskId = parseTaskId(params.id);
    const noteId = parseNumericId(params.noteId, 'Review note ID');

    // Verify note belongs to this task (IDOR protection)
    const reviewNote = await getReviewNoteById(noteId);
    if (reviewNote.taskId !== taskId) {
      throw new AppError(404, 'Review note not found', ErrorCodes.NOT_FOUND);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const commentIdStr = formData.get('commentId') as string | null;

    // #region agent log
    await fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attachments/route.ts:POST:parseFormData',message:'Received form data',data:{hasFile:!!file,fileName:file?.name,commentIdStr:commentIdStr,commentIdType:typeof commentIdStr},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3'})}).catch(()=>{});
    // #endregion

    if (!file) {
      throw new AppError(400, 'No file provided', ErrorCodes.VALIDATION_ERROR);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(400, 'File size exceeds 10MB limit', ErrorCodes.VALIDATION_ERROR);
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new AppError(400, 'File type not allowed', ErrorCodes.VALIDATION_ERROR);
    }

    // Parse optional commentId
    let commentId: number | null = null;
    if (commentIdStr) {
      commentId = parseNumericId(commentIdStr, 'Comment ID');
      
      // #region agent log
      await fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attachments/route.ts:POST:parseCommentId',message:'Parsed commentId',data:{commentIdStr:commentIdStr,commentId:commentId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      
      // Verify comment belongs to this note
      const comment = await prisma.reviewNoteComment.findUnique({
        where: { id: commentId },
        select: { reviewNoteId: true },
      });
      
      // #region agent log
      await fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attachments/route.ts:POST:verifyComment',message:'Comment verification',data:{commentFound:!!comment,commentReviewNoteId:comment?.reviewNoteId,expectedNoteId:noteId,matches:comment?.reviewNoteId===noteId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      
      if (!comment || comment.reviewNoteId !== noteId) {
        throw new AppError(404, 'Comment not found', ErrorCodes.NOT_FOUND);
      }
    }

    // Upload to blob storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const blobPath = await uploadReviewNoteAttachment(buffer, file.name, noteId);

    // #region agent log
    await fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attachments/route.ts:POST:beforeCreate',message:'Creating attachment record',data:{reviewNoteId:noteId,commentId:commentId,fileName:file.name,blobPath:blobPath},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    
    // Save to database
    const attachment = await prisma.reviewNoteAttachment.create({
      data: {
        reviewNoteId: noteId,
        commentId: commentId,
        fileName: file.name,
        filePath: blobPath,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: user.id,
      },
      select: {
        id: true,
        reviewNoteId: true,
        commentId: true,
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

    // #region agent log
    await fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attachments/route.ts:POST:afterCreate',message:'Attachment created',data:{attachmentId:attachment.id,commentId:attachment.commentId,fileName:attachment.fileName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    return NextResponse.json(successResponse(attachment), { status: 201 });
  },
});

