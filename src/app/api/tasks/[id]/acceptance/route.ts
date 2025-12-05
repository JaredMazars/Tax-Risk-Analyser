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
 * Approve client acceptance and continuance for a task
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
    // Rules: SYSTEM_ADMIN OR Partner/Administrator (ServiceLineUser.role = ADMINISTRATOR or PARTNER for task's service line)
    const hasApprovalPermission = await canApproveAcceptance(user.id, taskId);

    if (!hasApprovalPermission) {
      return NextResponse.json(
        { error: 'Only Partners and System Administrators can approve client acceptance' },
        { status: 403 }
      );
    }

    // Check if this is a client task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        Client: true,
        TaskAcceptance: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task.Client) {
      return NextResponse.json(
        { error: 'Client acceptance is only required for client tasks' },
        { status: 400 }
      );
    }

    if (task.TaskAcceptance?.acceptanceApproved) {
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
    const [updatedResponse, updatedTaskAcceptance] = await prisma.$transaction(async (tx) => {
      // Update the acceptance response review status
      const response = await tx.clientAcceptanceResponse.update({
        where: { id: questionnaireResponse.id },
        data: {
          reviewedBy: user.email || user.id,
          reviewedAt: new Date(),
        },
      });

      // Upsert the TaskAcceptance record
      const taskAcceptance = await tx.taskAcceptance.upsert({
        where: { taskId },
        create: {
          taskId,
          acceptanceApproved: true,
          approvedBy: user.id,
          approvedAt: new Date(),
          questionnaireType: questionnaireResponse.questionnaireType,
          overallRiskScore: questionnaireResponse.overallRiskScore,
          riskRating: questionnaireResponse.riskRating,
        },
        update: {
          acceptanceApproved: true,
          approvedBy: user.id,
          approvedAt: new Date(),
          questionnaireType: questionnaireResponse.questionnaireType,
          overallRiskScore: questionnaireResponse.overallRiskScore,
          riskRating: questionnaireResponse.riskRating,
        },
      });

      return [response, taskAcceptance];
    });

    // Fetch the task with updated acceptance data for response
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        TaskDesc: true,
        Active: true,
        TaskAcceptance: {
          select: {
            acceptanceApproved: true,
            approvedBy: true,
            approvedAt: true,
          },
        },
        Client: {
          select: {
            id: true,
            clientCode: true,
            clientNameFull: true,
          },
        },
      },
    });

    // Audit log the approval
    await logAcceptanceApproved(
      taskId,
      user.id,
      questionnaireResponse.questionnaireType,
      questionnaireResponse.riskRating || undefined,
      questionnaireResponse.overallRiskScore || undefined
    );

    return NextResponse.json(
      successResponse(updatedTask),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/tasks/[id]/acceptance');
  }
}


