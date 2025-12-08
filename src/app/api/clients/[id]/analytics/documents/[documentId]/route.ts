import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkClientAccess } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';
import { logger } from '@/lib/utils/logger';
import fs from 'fs/promises';
import { GSClientIDSchema } from '@/lib/validation/schemas';

/**
 * DELETE /api/clients/[id]/analytics/documents/[documentId]
 * Delete a specific analytics document
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, documentId } = await context.params;
    const GSClientID = id;
    const docId = Number.parseInt(documentId);

    // Validate GSClientID is a valid GUID
    const validationResult = GSClientIDSchema.safeParse(GSClientID);
    if (!validationResult.success || Number.isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // SECURITY: Check authorization
    const hasAccess = await checkClientAccess(user.id, GSClientID);
    if (!hasAccess) {
      logger.warn('Unauthorized document deletion attempt', {
        userId: user.id,
        userEmail: user.email,
        GSClientID,
        documentId: docId,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get client by GSClientID to get numeric id
    const client = await prisma.client.findUnique({
      where: { GSClientID: GSClientID },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Find the document
    const document = await prisma.clientAnalyticsDocument.findFirst({
      where: {
        id: docId,
        clientId: client.id,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if document is being used in any credit ratings
    const ratingsUsingDoc = await prisma.creditRatingDocument.findMany({
      where: { analyticsDocumentId: docId },
      include: {
        ClientCreditRating: {
          select: {
            id: true,
            ratingDate: true,
            ratingGrade: true,
            ratingScore: true,
            confidence: true,
          },
        },
      },
    });

    if (ratingsUsingDoc.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete document',
          message: `This document is being used in ${ratingsUsingDoc.length} credit rating(s). Please delete those ratings first.`,
          ratingsAffected: ratingsUsingDoc.map((r) => r.ClientCreditRating),
        },
        { status: 409 }
      );
    }

    // Delete the file from disk
    try {
      await fs.unlink(document.filePath);
    } catch (fileError) {
      logger.warn('Failed to delete file from disk', {
        error: fileError,
        filePath: document.filePath,
      });
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.clientAnalyticsDocument.delete({
      where: { id: docId },
    });

    logger.info('Analytics document deleted', {
      documentId: docId,
      GSClientID,
      clientDbId: client.id,
      fileName: document.fileName,
      deletedBy: user.email,
    });

    return NextResponse.json(
      successResponse({
        message: 'Document deleted successfully',
        documentId: docId,
      })
    );
  } catch (error) {
    return handleApiError(error, 'DELETE /api/clients/[id]/analytics/documents/[documentId]');
  }
}

/**
 * GET /api/clients/[id]/analytics/documents/[documentId]
 * Get a specific analytics document
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, documentId } = await context.params;
    const GSClientID = id;
    const docId = Number.parseInt(documentId);

    // Validate GSClientID is a valid GUID
    const validationResult = GSClientIDSchema.safeParse(GSClientID);
    if (!validationResult.success || Number.isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // SECURITY: Check authorization
    const hasAccess = await checkClientAccess(user.id, GSClientID);
    if (!hasAccess) {
      logger.warn('Unauthorized document access attempt', {
        userId: user.id,
        userEmail: user.email,
        GSClientID,
        documentId: docId,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get client by GSClientID to get numeric id
    const client = await prisma.client.findUnique({
      where: { GSClientID: GSClientID },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Find the document
    const document = await prisma.clientAnalyticsDocument.findFirst({
      where: {
        id: docId,
        clientId: client.id,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(successResponse(document));
  } catch (error) {
    return handleApiError(error, 'GET /api/clients/[id]/analytics/documents/[documentId]');
  }
}

