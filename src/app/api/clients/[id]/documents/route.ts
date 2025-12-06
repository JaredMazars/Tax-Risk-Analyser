import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';
import { DocumentType, ClientDocument, DocumentsByType } from '@/types';
import { ClientIDSchema } from '@/lib/validation/schemas';

/**
 * GET /api/clients/[id]/documents
 * Fetch all documents across all projects for a client
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const clientID = id;

    // Validate ClientID is a valid GUID
    const validationResult = ClientIDSchema.safeParse(clientID);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid client ID format. Expected GUID.' }, { status: 400 });
    }

    // Get client by ClientID
    const client = await prisma.client.findUnique({
      where: { ClientID: clientID },
      select: { ClientID: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get all projects for this client using ClientID
    const projects = await prisma.task.findMany({
      where: { ClientCode: client.ClientID },
      select: {
        id: true,
        TaskDesc: true,
        TaskEngagementLetter: {
          select: {
            filePath: true,
            uploadedBy: true,
            uploadedAt: true,
          },
        },
      },
    });

    // Early return if no projects
    if (projects.length === 0) {
      return NextResponse.json(
        successResponse({
          documents: {
            engagementLetters: [],
            administration: [],
            adjustments: [],
            opinions: [],
            sars: [],
          },
          totalCount: 0,
        })
      );
    }

    const projectIds = projects.map((p) => p.id);
    const projectMap = new Map(projects.map((p) => [p.id, p.TaskDesc]));

    // Fetch all documents in parallel for performance
    const [adminDocs, adjustmentDocs, opinionDocs, sarsDocs] = await Promise.all([
      prisma.taskDocument.findMany({
        where: { taskId: { in: projectIds } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adjustmentDocument.findMany({
        where: { taskId: { in: projectIds } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.opinionDocument.findMany({
        where: {
          OpinionDraft: {
            taskId: { in: projectIds },
          },
        },
        include: {
          OpinionDraft: {
            select: {
              taskId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sarsResponse.findMany({
        where: {
          taskId: { in: projectIds },
          documentPath: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Collect all user IDs
    const userIds = new Set<string>();
    projects.forEach(p => {
      if (p.TaskEngagementLetter?.uploadedBy) userIds.add(p.TaskEngagementLetter.uploadedBy);
    });
    adminDocs.forEach(doc => {
      if (doc.uploadedBy) userIds.add(doc.uploadedBy);
    });
    adjustmentDocs.forEach(doc => {
      if (doc.uploadedBy) userIds.add(doc.uploadedBy);
    });
    opinionDocs.forEach(doc => {
      if (doc.uploadedBy) userIds.add(doc.uploadedBy);
    });
    sarsDocs.forEach(doc => {
      if (doc.createdBy) userIds.add(doc.createdBy);
    });

    // Look up user names
    const users = userIds.size > 0 
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u.name || u.email]));

    // Initialize result structure
    const documentsByType: DocumentsByType = {
      engagementLetters: [],
      administration: [],
      adjustments: [],
      opinions: [],
      sars: [],
    };

    // Map engagement letters with user names
    for (const project of projects) {
      if (project.TaskEngagementLetter?.filePath) {
        const pathParts = project.TaskEngagementLetter.filePath.split(/[/\\]/);
        const fileName = pathParts[pathParts.length - 1] || `${project.TaskDesc}-engagement-letter.pdf`;
        documentsByType.engagementLetters.push({
          id: project.id,
          documentType: DocumentType.ENGAGEMENT_LETTER,
          fileName,
          fileType: fileName.split('.').pop() || 'pdf',
          fileSize: 0,
          filePath: project.TaskEngagementLetter.filePath,
          taskId: project.id,
          taskName: project.TaskDesc,
          uploadedBy: project.TaskEngagementLetter.uploadedBy ? userMap.get(project.TaskEngagementLetter.uploadedBy) || project.TaskEngagementLetter.uploadedBy : null,
          createdAt: project.TaskEngagementLetter.uploadedAt || new Date(),
        });
      }
    }

    // Map administration documents with user names
    documentsByType.administration = adminDocs.map((doc) => ({
      id: doc.id,
      documentType: DocumentType.ADMINISTRATION,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      filePath: doc.filePath,
      taskId: doc.taskId,
      taskName: projectMap.get(doc.taskId) || 'Unknown Project',
      uploadedBy: doc.uploadedBy ? userMap.get(doc.uploadedBy) || doc.uploadedBy : null,
      createdAt: doc.createdAt,
      category: doc.category,
      description: doc.description ?? undefined,
      version: doc.version,
    }));

    // Map adjustment documents with user names
    documentsByType.adjustments = adjustmentDocs.map((doc) => ({
      id: doc.id,
      documentType: DocumentType.ADJUSTMENT,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      filePath: doc.filePath,
      taskId: doc.taskId,
      taskName: projectMap.get(doc.taskId) || 'Unknown Project',
      uploadedBy: doc.uploadedBy ? userMap.get(doc.uploadedBy) || doc.uploadedBy : null,
      createdAt: doc.createdAt,
      extractionStatus: doc.extractionStatus,
    }));

    // Map opinion documents with user names
    documentsByType.opinions = opinionDocs.map((doc) => ({
      id: doc.id,
      documentType: DocumentType.OPINION,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      filePath: doc.filePath,
      taskId: doc.OpinionDraft.taskId,
      taskName: projectMap.get(doc.OpinionDraft.taskId) || 'Unknown Project',
      uploadedBy: doc.uploadedBy ? userMap.get(doc.uploadedBy) || doc.uploadedBy : null,
      createdAt: doc.createdAt,
      category: doc.category,
    }));

    // Map SARS documents with user names
    documentsByType.sars = sarsDocs
      .filter((doc) => doc.documentPath)
      .map((doc) => {
        const pathParts = doc.documentPath!.split(/[/\\]/);
        const fileName = pathParts[pathParts.length - 1] || 'sars-document.pdf';
        return {
          id: doc.id,
          documentType: DocumentType.SARS,
          fileName,
          fileType: fileName.split('.').pop() || 'pdf',
          fileSize: 0,
          filePath: doc.documentPath!,
          taskId: doc.taskId,
          taskName: projectMap.get(doc.taskId) || 'Unknown Project',
          uploadedBy: doc.createdBy ? userMap.get(doc.createdBy) || doc.createdBy : null,
          createdAt: doc.createdAt,
          referenceNumber: doc.referenceNumber,
          subject: doc.subject,
        };
      });

    // Calculate total count
    const totalCount =
      documentsByType.engagementLetters.length +
      documentsByType.administration.length +
      documentsByType.adjustments.length +
      documentsByType.opinions.length +
      documentsByType.sars.length;

    const response = NextResponse.json(
      successResponse({
        documents: documentsByType,
        totalCount,
      })
    );

    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=120');
    
    return response;
  } catch (error) {
    return handleApiError(error, 'GET /api/clients/[id]/documents');
  }
}
