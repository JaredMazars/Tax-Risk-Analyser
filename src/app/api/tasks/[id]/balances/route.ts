import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { getCurrentUser } from '@/lib/services/auth/auth';

interface TaskBalances {
  taskId: number;
  GSTaskID: string;
  taskCode: string;
  taskDesc: string;
  grossWip: number;
  provision: number;
  netWip: number;
  lastUpdated: string | null;
}

/**
 * GET /api/tasks/[id]/balances
 * Get WIP balances for a task
 * 
 * Returns:
 * - Gross WIP: Sum of all amounts minus fees (excluding provision)
 * - Provision: Sum of provision amounts (TTYPE 'P')
 * - Net WIP: Gross WIP plus provision
 * - Latest update timestamp
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Parse IDs
    const params = await context.params;
    const taskId = parseInt(params.id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    // 3. Check Permission - verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        GSTaskID: true,
        TaskCode: true,
        TaskDesc: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 4-5. Execute - Get all WIP transactions for this task
    const wipTransactions = await prisma.wIPTransactions.findMany({
      where: {
        GSTaskID: task.GSTaskID,
      },
      select: {
        Amount: true,
        TType: true,
        updatedAt: true,
      },
    });

    // Calculate balances
    let grossWip = 0;
    let provision = 0;
    let fees = 0;

    wipTransactions.forEach((transaction) => {
      const amount = transaction.Amount || 0;
      const tType = transaction.TType;

      if (tType === 'F') {
        // Fees are reversed (subtracted)
        fees += amount;
      } else if (tType === 'P') {
        // Provision tracked separately, NOT included in gross WIP
        provision += amount;
      } else {
        // All other transaction types (Time, Disbursements, etc.)
        grossWip += amount;
      }
    });

    // Gross WIP = Time + Disbursements - Fees (excluding Provision)
    grossWip = grossWip - fees;
    
    // Net WIP = Gross WIP + Provision
    const netWip = grossWip + provision;

    // Get the latest update timestamp
    const latestTransaction = wipTransactions.length > 0
      ? wipTransactions.reduce((latest, current) =>
          current.updatedAt > latest.updatedAt ? current : latest
        )
      : null;

    // 6. Respond
    const responseData: TaskBalances = {
      taskId: task.id,
      GSTaskID: task.GSTaskID,
      taskCode: task.TaskCode,
      taskDesc: task.TaskDesc,
      grossWip,
      provision,
      netWip,
      lastUpdated: latestTransaction?.updatedAt.toISOString() || null,
    };

    return NextResponse.json(successResponse(responseData));
  } catch (error) {
    return handleApiError(error, 'Get Task Balances');
  }
}
