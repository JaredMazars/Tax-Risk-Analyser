import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';
import { logger } from '@/lib/utils/logger';

/**
 * DELETE /api/tasks/[id]/permanent
 * Permanently delete a task and all its related data from the database
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
        { error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Delete task and all related data in a transaction to ensure atomicity
    // Order: AdjustmentDocuments -> TaxAdjustments -> MappedAccounts -> AITaxReport -> Task
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Delete adjustment documents first (they reference both Task and TaxAdjustment)
        await tx.adjustmentDocument.deleteMany({
          where: { taskId: taskId },
        });

        // 2. Delete tax adjustments (they reference Task)
        await tx.taxAdjustment.deleteMany({
          where: { taskId: taskId },
        });

        // 3. Delete mapped accounts (they reference Task)
        await tx.mappedAccount.deleteMany({
          where: { taskId: taskId },
        });

        // 4. Delete AI tax reports (they reference Task)
        await tx.aITaxReport.deleteMany({
          where: { taskId: taskId },
        });

        // 5. Finally delete the task itself
        await tx.task.delete({
          where: { id: taskId },
        });
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Task permanently deleted successfully'
      });
    } catch (transactionError) {
      logger.error('Error in delete transaction', transactionError);
      throw transactionError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    return handleApiError(error, 'DELETE /api/tasks/[id]/permanent');
  }
}
