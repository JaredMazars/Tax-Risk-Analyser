import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';
import { logger } from '@/lib/utils/logger';

/**
 * DELETE /api/tasks/[id]/permanent
 * Permanently delete a project and all its related data from the database
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const taskId = Number.parseInt(params.id, 10);
    
    if (Number.isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Delete project and all related data in a transaction to ensure atomicity
    // Order: AdjustmentDocuments -> TaxAdjustments -> MappedAccounts -> AITaxReport -> Project
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Delete adjustment documents first (they reference both Project and TaxAdjustment)
        await tx.adjustmentDocument.deleteMany({
          where: { taskId: taskId },
        });

        // 2. Delete tax adjustments (they reference Project)
        await tx.taxAdjustment.deleteMany({
          where: { taskId: taskId },
        });

        // 3. Delete mapped accounts (they reference Project)
        await tx.mappedAccount.deleteMany({
          where: { taskId: taskId },
        });

        // 4. Delete AI tax reports (they reference Project)
        await tx.aITaxReport.deleteMany({
          where: { taskId: taskId },
        });

        // 5. Finally delete the project itself
        await tx.project.delete({
          where: { id: taskId },
        });
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Project permanently deleted successfully'
      });
    } catch (transactionError) {
      logger.error('Error in delete transaction', transactionError);
      throw transactionError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    return handleApiError(error, 'DELETE /api/tasks/[id]/permanent');
  }
}
