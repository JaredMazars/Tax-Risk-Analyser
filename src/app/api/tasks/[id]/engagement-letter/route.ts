import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { canApproveEngagementLetter } from '@/lib/services/tasks/taskAuthorization';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';
import { toTaskId } from '@/types/branded';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * POST /api/tasks/[id]/engagement-letter
 * Upload signed engagement letter
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const taskId = toTaskId(id);

    // Check if user can approve/upload engagement letter
    // Rules: SYSTEM_ADMIN OR Partner/Administrator (ServiceLineUser.role = ADMINISTRATOR or PARTNER for project's service line)
    const hasApprovalPermission = await canApproveEngagementLetter(user.id, taskId);

    if (!hasApprovalPermission) {
      return NextResponse.json(
        { error: 'Only Partners and System Administrators can upload engagement letters' },
        { status: 403 }
      );
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: taskId },
      select: {
        clientId: true,
        acceptanceApproved: true,
        name: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.clientId) {
      return NextResponse.json(
        { error: 'Engagement letter is only available for client projects' },
        { status: 400 }
      );
    }

    if (!project.acceptanceApproved) {
      return NextResponse.json(
        { error: 'Client acceptance must be approved before uploading engagement letter' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (PDF or DOCX)
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are allowed' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'engagement-letters', taskId.toString());
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `engagement-letter-${timestamp}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Store relative path
    const relativePath = path.join('uploads', 'engagement-letters', taskId.toString(), filename);

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: taskId },
      data: {
        engagementLetterUploaded: true,
        engagementLetterPath: relativePath,
        engagementLetterUploadedBy: user.id,
        engagementLetterUploadedAt: new Date(),
      },
      include: {
        Client: true,
        TaskTeam: {
          include: {
            User: true,
          },
        },
        _count: {
          select: {
            MappedAccount: true,
            TaxAdjustment: true,
          },
        },
      },
    });

    return NextResponse.json(
      successResponse({
        ...updatedProject,
        _count: {
          mappings: updatedProject._count.MappedAccount,
          taxAdjustments: updatedProject._count.TaxAdjustment,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/tasks/[id]/engagement-letter');
  }
}

/**
 * GET /api/tasks/[id]/engagement-letter
 * Get engagement letter status
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
    const taskId = toTaskId(id);

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: taskId },
      select: {
        engagementLetterGenerated: true,
        engagementLetterUploaded: true,
        engagementLetterPath: true,
        engagementLetterUploadedBy: true,
        engagementLetterUploadedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(successResponse(project), { status: 200 });
  } catch (error) {
    return handleApiError(error, 'GET /api/tasks/[id]/engagement-letter');
  }
}


