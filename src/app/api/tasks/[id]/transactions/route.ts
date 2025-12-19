import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { checkFeature } from '@/lib/permissions/checkFeature';
import { Feature } from '@/lib/permissions/features';
import { getCarlPartnerCodes } from '@/lib/cache/staticDataCache';

// Maximum transactions per page to prevent memory issues
const MAX_PAGE_SIZE = 500;
const DEFAULT_PAGE_SIZE = 100;

/**
 * GET /api/tasks/[id]/transactions
 * Get WIP transactions for a task with standard fields for transaction details modal
 * 
 * Query params:
 * - page: Page number (default 1)
 * - limit: Items per page (default 100, max 500)
 * 
 * Returns:
 * - Task information
 * - Array of WIP transactions with standard fields
 * - Pagination metadata
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

    // 3. Check Feature - verify user has access to tasks
    const hasAccess = await checkFeature(user.id, Feature.ACCESS_TASKS);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Execute - verify task exists and get task details
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

    // 5. Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)));
    const skip = (page - 1) * limit;

    // 6. Execute - Get CARL partner employee codes from cache
    const carlPartnerCodes = await getCarlPartnerCodes();

    // 7. Fetch WIP transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.wIPTransactions.findMany({
        where: {
          GSTaskID: task.GSTaskID,
        },
        select: {
          id: true,
          GSWIPTransID: true,
          TranDate: true,
          TranType: true,
          TType: true,
          EmpCode: true,
          EmpName: true,
          Amount: true,
          Cost: true,
          Hour: true,
          Ref: true,
          Narr: true,
          OfficeCode: true,
          TaskServLine: true,
        },
        orderBy: {
          TranDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.wIPTransactions.count({
        where: {
          GSTaskID: task.GSTaskID,
        },
      }),
    ]);

    // 8. Respond - Map transactions and zero out CARL partner costs
    const responseData = {
      taskId: task.id,
      taskCode: task.TaskCode,
      taskDesc: task.TaskDesc,
      transactions: transactions.map(txn => ({
        id: txn.id,
        GSWIPTransID: txn.GSWIPTransID,
        tranDate: txn.TranDate,
        tranType: txn.TranType,
        tType: txn.TType,
        empCode: txn.EmpCode,
        empName: txn.EmpName,
        amount: txn.Amount,
        cost: txn.EmpCode && carlPartnerCodes.has(txn.EmpCode) ? 0 : txn.Cost,
        hour: txn.Hour,
        ref: txn.Ref,
        narr: txn.Narr,
        officeCode: txn.OfficeCode,
        taskServLine: txn.TaskServLine,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(successResponse(responseData));
  } catch (error) {
    return handleApiError(error, 'Get Task Transactions');
  }
}







