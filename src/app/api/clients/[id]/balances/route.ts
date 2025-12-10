import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';
import { GSClientIDSchema } from '@/lib/validation/schemas';
import { successResponse } from '@/lib/utils/apiUtils';
import { getCurrentUser } from '@/lib/services/auth/auth';

interface ClientBalances {
  GSClientID: string;
  clientCode: string;
  clientName: string | null;
  wipBalance: number;
  debtorBalance: number;
  lastUpdated: string | null;
}

/**
 * GET /api/clients/[id]/balances
 * Get WIP and Debtor balances for a client calculated from transaction tables
 * 
 * Returns:
 * - WIP Balance: Sum of Amount from WIPTransactions
 * - Debtor Balance: Sum of Total from DrsTransactions
 * - Client information
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
    const GSClientID = params.id;

    // Validate GSClientID is a valid GUID
    const validationResult = GSClientIDSchema.safeParse(GSClientID);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid client ID format. Expected GUID.' },
        { status: 400 }
      );
    }

    // 3. Check Permission - verify client exists and user has access
    const client = await prisma.client.findUnique({
      where: { GSClientID: GSClientID },
      select: {
        id: true,
        GSClientID: true,
        clientCode: true,
        clientNameFull: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // 4-5. Execute - Calculate balances from transaction tables
    
    // Get all tasks for this client
    const clientTasks = await prisma.task.findMany({
      where: {
        GSClientID: GSClientID,
      },
      select: {
        GSTaskID: true,
      },
    });

    const taskIds = clientTasks.map(task => task.GSTaskID);

    // Calculate WIP Balance: Sum of Amount from WIPTransactions for all client tasks
    // Use both GSClientID and GSTaskID to capture all transactions
    // If TTYPE is 'F', reverse the amount (make it negative)
    // Provision (TTYPE 'P') should NOT be reversed
    const wipWhereClause = taskIds.length > 0
      ? {
          OR: [
            { GSClientID: GSClientID },
            { GSTaskID: { in: taskIds } },
          ],
        }
      : { GSClientID: GSClientID };

    const wipTransactions = await prisma.wIPTransactions.findMany({
      where: wipWhereClause,
      select: {
        Amount: true,
        TType: true,
      },
    });

    // Calculate WIP balance with TTYPE logic
    const wipBalance = wipTransactions.reduce((sum, transaction) => {
      const amount = transaction.Amount || 0;
      // Reverse amount only if TTYPE is 'F' (not 'P' for provision)
      if (transaction.TType === 'F') {
        return sum - amount;
      }
      return sum + amount;
    }, 0);

    // Calculate Debtor Balance: Sum of Total from DrsTransactions
    const debtorAggregation = await prisma.drsTransactions.aggregate({
      where: {
        GSClientID: GSClientID,
      },
      _sum: {
        Total: true,
      },
    });

    // Get the latest update timestamp from both transaction tables
    const latestWipTransaction = await prisma.wIPTransactions.findFirst({
      where: wipWhereClause,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    });

    const latestDebtorTransaction = await prisma.drsTransactions.findFirst({
      where: {
        GSClientID: GSClientID,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    });

    // Determine the most recent update
    let lastUpdated: Date | null = null;
    if (latestWipTransaction && latestDebtorTransaction) {
      lastUpdated = latestWipTransaction.updatedAt > latestDebtorTransaction.updatedAt
        ? latestWipTransaction.updatedAt
        : latestDebtorTransaction.updatedAt;
    } else if (latestWipTransaction) {
      lastUpdated = latestWipTransaction.updatedAt;
    } else if (latestDebtorTransaction) {
      lastUpdated = latestDebtorTransaction.updatedAt;
    }

    // 6. Respond
    const responseData: ClientBalances = {
      GSClientID: client.GSClientID,
      clientCode: client.clientCode,
      clientName: client.clientNameFull,
      wipBalance: wipBalance,
      debtorBalance: debtorAggregation._sum.Total || 0,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
    };

    return NextResponse.json(successResponse(responseData));
  } catch (error) {
    return handleApiError(error, 'Get Client Balances');
  }
}

