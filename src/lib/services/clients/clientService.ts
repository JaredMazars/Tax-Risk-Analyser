import { prisma } from '@/lib/db/prisma';
import { withRetry, RetryPresets } from '@/lib/utils/retryUtils';

export interface ClientFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ClientListResult {
  clients: Array<{
    id: number;
    GSClientID: string;
    clientCode: string;
    clientNameFull: string | null;
    groupCode: string;
    groupDesc: string;
    clientPartner: string;
    clientManager: string;
    clientIncharge: string;
    industry: string | null;
    sector: string | null;
    active: string;
    typeCode: string;
    typeDesc: string;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      Task: number;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientDetailFilters {
  taskPage?: number;
  taskLimit?: number;
  serviceLine?: string;
  includeArchived?: boolean;
}

/**
 * Get paginated and filtered list of clients
 */
export async function getClientsWithPagination(
  filters: ClientFilters = {}
): Promise<ClientListResult> {
  return withRetry(
    async () => {
      const {
        search = '',
        page = 1,
        limit = 50,
        sortBy = 'clientNameFull',
        sortOrder = 'asc',
      } = filters;

      const skip = (page - 1) * Math.min(limit, 100);
      const take = Math.min(limit, 100);

      // Build where clause with improved search
      interface WhereClause {
        OR?: Array<{ [key: string]: { contains: string; mode: 'insensitive' } }>;
      }
      const where: WhereClause = {};
      if (search) {
        where.OR = [
          { clientNameFull: { contains: search, mode: 'insensitive' } },
          { clientCode: { contains: search, mode: 'insensitive' } },
          { groupDesc: { contains: search, mode: 'insensitive' } },
          { groupCode: { contains: search, mode: 'insensitive' } },
          { industry: { contains: search, mode: 'insensitive' } },
          { sector: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build orderBy clause
      type OrderByClause = Record<string, 'asc' | 'desc'>;
      const orderBy: OrderByClause = {};
      const validSortFields = ['clientNameFull', 'clientCode', 'groupDesc', 'createdAt', 'updatedAt'] as const;
      if (validSortFields.includes(sortBy as typeof validSortFields[number])) {
        orderBy[sortBy] = sortOrder;
      } else {
        orderBy.clientNameFull = 'asc';
      }

      // Get total count
      const total = await prisma.client.count({ where });

      // Get clients with project count
      const clients = await prisma.client.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          GSClientID: true,
          clientCode: true,
          clientNameFull: true,
          groupCode: true,
          groupDesc: true,
          clientPartner: true,
          clientManager: true,
          clientIncharge: true,
          industry: true,
          sector: true,
          active: true,
          typeCode: true,
          typeDesc: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              Task: true,
            },
          },
        },
      });

      return {
        clients,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Get clients with pagination'
  );
}

/**
 * Get a single client with paginated projects
 */
export async function getClientWithProjects(
  clientId: number,
  filters: ClientDetailFilters = {}
) {
  return withRetry(
    async () => {
      const {
        taskPage = 1,
        taskLimit = 20,
        serviceLine,
        includeArchived = false,
      } = filters;

      const taskSkip = (taskPage - 1) * Math.min(taskLimit, 50);
      const taskTake = Math.min(taskLimit, 50);

      // Build task where clause using internal clientId
      interface TaskWhereClause {
        clientId?: number;
        Active?: string;
        ServLineCode?: string;
      }
      const taskWhere: TaskWhereClause = {
        clientId: clientId,  // Use internal ID for query
      };
      if (!includeArchived) {
        taskWhere.Active = 'Yes';
      }
      if (serviceLine) {
        taskWhere.ServLineCode = serviceLine;
      }

      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          GSClientID: true,
          clientCode: true,
          clientNameFull: true,
          groupCode: true,
          groupDesc: true,
          clientPartner: true,
          clientManager: true,
          clientIncharge: true,
          active: true,
          industry: true,
          sector: true,
          typeCode: true,
          typeDesc: true,
          createdAt: true,
          updatedAt: true,
          Task: {
            where: taskWhere,
            orderBy: { updatedAt: 'desc' },
            skip: taskSkip,
            take: taskTake,
            select: {
              id: true,
              TaskDesc: true,
              TaskCode: true,
              ServLineCode: true,
              Active: true,
              createdAt: true,
              updatedAt: true,
              TaskDateOpen: true,
              TaskDateTerminate: true,
              _count: {
                select: {
                  MappedAccount: true,
                  TaxAdjustment: true,
                },
              },
            },
          },
          _count: {
            select: {
              Task: true,
            },
          },
        },
      });

      if (!client) {
        return null;
      }

      // Get total task count with filters (using internal clientId)
      const totalTasks = await prisma.task.count({
        where: taskWhere,
      });

      return {
        client,
        totalTasks,
        taskPagination: {
          page: taskPage,
          limit: taskTake,
          total: totalTasks,
          totalPages: Math.ceil(totalTasks / taskTake),
        },
      };
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Get client with tasks'
  );
}




