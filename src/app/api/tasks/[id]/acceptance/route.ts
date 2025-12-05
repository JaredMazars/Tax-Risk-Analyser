import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { canApproveAcceptance } from '@/lib/services/tasks/taskAuthorization';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError, AcceptanceErrorCodes } from '@/lib/utils/errorHandler';
import { toTaskId } from '@/types/branded';
import { logAcceptanceApproved } from '@/lib/services/acceptance/auditLog';

/**
 * POST /api/tasks/[id]/acceptance
 * Approve client acceptance and continuance for a project
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

    // Check if user can approve acceptance
    // Rules: SYSTEM_ADMIN OR Partner/Administrator (ServiceLineUser.role = ADMINISTRATOR or PARTNER for project's service line)
    const hasApprovalPermission = await canApproveAcceptance(user.id, taskId);

    if (!hasApprovalPermission) {
      return NextResponse.json(
        { error: 'Only Partners and System Administrators can approve client acceptance' },
        { status: 403 }
      );
    }

    // Check if this is a client project
    const project = await prisma.project.findUnique({
      where: { id: taskId },
      select: { clientId: true, acceptanceApproved: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.clientId) {
      return NextResponse.json(
        { error: 'Client acceptance is only required for client projects' },
        { status: 400 }
      );
    }

    if (project.acceptanceApproved) {
      return NextResponse.json(
        { error: 'Client acceptance already approved', code: AcceptanceErrorCodes.ALREADY_APPROVED },
        { status: 400 }
      );
    }

    // Check that questionnaire is completed
    const questionnaireResponse = await prisma.clientAcceptanceResponse.findFirst({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        completedAt: true,
        completedBy: true,
        questionnaireType: true,
        overallRiskScore: true,
        riskRating: true,
      },
    });

    if (!questionnaireResponse) {
      return NextResponse.json(
        { error: 'Questionnaire must be initialized and completed before approval', code: AcceptanceErrorCodes.QUESTIONNAIRE_NOT_INITIALIZED },
        { status: 400 }
      );
    }

    if (!questionnaireResponse.completedAt) {
      return NextResponse.json(
        { error: 'Questionnaire must be completed and submitted before approval', code: AcceptanceErrorCodes.INCOMPLETE_QUESTIONNAIRE },
        { status: 400 }
      );
    }

    // Use transaction to ensure both updates succeed or both fail
    const [updatedResponse, updatedProject] = await prisma.$transaction([
      prisma.clientAcceptanceResponse.update({
        where: { id: questionnaireResponse.id },
        data: {
          reviewedBy: user.email || user.id,
          reviewedAt: new Date(),
        },
      }),
      prisma.project.update({
        where: { id: taskId },
        data: {
          acceptanceApproved: true,
          acceptanceApprovedBy: user.id,
          acceptanceApprovedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          status: true,
          acceptanceApproved: true,
          acceptanceApprovedBy: true,
          acceptanceApprovedAt: true,
          Client: {
            select: {
              id: true,
              clientCode: true,
              clientNameFull: true,
            },
          },
        },
      }),
    ]);

    // Audit log the approval
    await logAcceptanceApproved(
      taskId,
      user.id,
      questionnaireResponse.questionnaireType,
      questionnaireResponse.riskRating || undefined,
      questionnaireResponse.overallRiskScore || undefined
    );

    return NextResponse.json(
      successResponse(updatedProject),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/tasks/[id]/acceptance');
  }
}


