import { prisma } from '@/lib/db/prisma';
import { withRetry, RetryPresets } from '@/lib/utils/retryUtils';
import { TaskId } from '@/types/branded';

export interface TaskFilters {
  userId: string;
  accessibleServiceLines: string[];
  search?: string;
  page?: number;
  limit?: number;
  serviceLine?: string;
  includeArchived?: boolean;
  clientCode?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskListResult {
  tasks: Array<{
    id: number;
    name: string | null;
    description: string | null;
    TaskDesc: string;
    projectType: string;
    ServLineDesc: string;
    status: string;
    archived: boolean;
    ClientCode: string;
    taxYear: number | null;
    createdAt: Date;
    updatedAt: Date;
    Client: {
      id: number;
      ClientID: string;
      clientNameFull: string | null;
      clientCode: string | null;
    } | null;
    _count: {
      MappedAccount: number;
      TaxAdjustment: number;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get tasks with pagination and filtering
 * Optimized with database-level filtering instead of in-memory
 */
export async function getTasksWithPagination(
  filters: TaskFilters
): Promise<TaskListResult> {
  return withRetry(
    async () => {
      const {
        userId,
        accessibleServiceLines,
        search = '',
        page = 1,
        limit = 50,
        serviceLine,
        includeArchived = false,
        clientCode,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * Math.min(limit, 100);
      const take = Math.min(limit, 100);

      // Build where clause for database-level filtering
      const where: any = {
        TaskTeam: {
          some: {
            userId,
          },
        },
        ServLineCode: {
          in: accessibleServiceLines,
        },
      };

      // Filter by archived status (Active field)
      if (!includeArchived) {
        where.Active = 'Yes';
      }

      // Filter by specific service line
      if (serviceLine) {
        where.ServLineCode = serviceLine;
      }

      // Filter by client code - need to convert to ClientID
      if (clientCode) {
        // Look up client by clientCode to get ClientID
        const client = await prisma.client.findUnique({
          where: { clientCode },
          select: { ClientID: true },
        });
        if (client) {
          where.ClientCode = client.ClientID;
        } else {
          // Client not found, return empty result
          return {
            tasks: [],
            pagination: {
              page,
              limit: take,
              total: 0,
              totalPages: 0,
            },
          };
        }
      }

      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { TaskDesc: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build orderBy
      const orderBy: any = {};
      const validSortFields = ['name', 'updatedAt', 'createdAt', 'taxYear'];
      if (validSortFields.includes(sortBy)) {
        orderBy[sortBy] = sortOrder;
      } else {
        orderBy.updatedAt = 'desc';
      }

      // Get total count
      const total = await prisma.task.count({ where });

      // Get tasks with optimized query
      const tasks = await prisma.task.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          TaskDesc: true,
          projectType: true,
          ServLineDesc: true,
          status: true,
          Active: true,
          ClientCode: true,
          taxYear: true,
          createdAt: true,
          updatedAt: true,
          Client: {
            select: {
              id: true,
              ClientID: true,
              clientNameFull: true,
              clientCode: true,
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

      return {
        tasks,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Get tasks with pagination'
  );
}

/**
 * Get tasks with counts for a user, optionally filtered by service line
 * Single optimized query with proper includes and field selection
 */
export async function getTasksWithCounts(
  userId: string,
  serviceLine?: string,
  includeArchived = false
): Promise<Array<{
  id: number;
  name: string | null;
  description: string | null;
  TaskDesc: string;
  projectType: string;
  ServLineDesc: string;
  status: string;
  archived: boolean;
  ClientCode: string;
  taxYear: number | null;
  createdAt: Date;
  updatedAt: Date;
  Client: {
    id: number;
    ClientID: string;
    clientNameFull: string | null;
    clientCode: string | null;
  } | null;
  _count: {
    MappedAccount: number;
    TaxAdjustment: number;
  };
}>> {
  return withRetry(
    async () => {
      // Build where clause
      const where: any = {
        TaskTeam: {
          some: {
            userId,
          },
        },
      };

      // Filter by service line if provided
      if (serviceLine) {
        where.ServLineCode = serviceLine;
      }

      // Filter archived if not included
      if (!includeArchived) {
        where.Active = 'Yes';
      }

      // Single optimized query with counts
      const tasks = await prisma.task.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          TaskDesc: true,
          projectType: true,
          ServLineDesc: true,
          status: true,
          Active: true,
          ClientCode: true,
          taxYear: true,
          createdAt: true,
          updatedAt: true,
          Client: {
            select: {
              id: true,
              ClientID: true,
              clientNameFull: true,
              clientCode: true,
            },
          },
          _count: {
            select: {
              MappedAccount: true,
              TaxAdjustment: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return tasks;
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Get tasks with counts'
  );
}

/**
 * Get a single task with detailed counts
 */
export async function getTaskWithCounts(taskId: TaskId): Promise<{
  id: number;
  name: string | null;
  description: string | null;
  TaskDesc: string;
  projectType: string;
  ServLineCode: string;
  ServLineDesc: string;
  status: string;
  archived: boolean;
  ClientCode: string;
  taxYear: number | null;
  taxPeriodStart: Date | null;
  taxPeriodEnd: Date | null;
  assessmentYear: string | null;
  submissionDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    MappedAccount: number;
    TaxAdjustment: number;
  };
} | null> {
  return withRetry(
    async () => {
      return await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          name: true,
          description: true,
          TaskDesc: true,
          projectType: true,
          ServLineCode: true,
          ServLineDesc: true,
          status: true,
          Active: true,
          ClientCode: true,
          taxYear: true,
          taxPeriodStart: true,
          taxPeriodEnd: true,
          assessmentYear: true,
          submissionDeadline: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              MappedAccount: true,
              TaxAdjustment: true,
            },
          },
        },
      });
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Get task with counts'
  );
}

/**
 * Get task by ID with basic fields
 */
export async function getTaskById(taskId: TaskId) {
  return withRetry(
    async () => {
      return await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          name: true,
          description: true,
          TaskDesc: true,
          TaskCode: true,
          ClientCode: true,
          ServLineCode: true,
          ServLineDesc: true,
          projectType: true,
          status: true,
          Active: true,
          taxYear: true,
          taxPeriodStart: true,
          taxPeriodEnd: true,
          assessmentYear: true,
          submissionDeadline: true,
          TaskPartner: true,
          TaskPartnerName: true,
          TaskManager: true,
          TaskManagerName: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          Client: {
            select: {
              id: true,
              ClientID: true,
              clientCode: true,
              clientNameFull: true,
            },
          },
        },
      });
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Get task by ID'
  );
}

/**
 * Create a new task
 */
export async function createTask(data: {
  ClientCode: string;
  TaskCode: string;
  name: string;
  description?: string | null;
  projectType: string;
  taxYear?: number | null;
  taxPeriodStart?: Date | null;
  taxPeriodEnd?: Date | null;
  assessmentYear?: string | null;
  submissionDeadline?: Date | null;
  createdBy?: string | null;
}) {
  return withRetry(
    async () => {
      return await prisma.task.create({
        data: {
          ...data,
          ExternalTaskID: crypto.randomUUID(),
          TaskDesc: data.name,
          TaskPartner: '',
          TaskPartnerName: '',
          TaskManager: '',
          TaskManagerName: '',
          OfficeCode: '',
          SLGroup: '',
          ServLineCode: '',
          ServLineDesc: '',
          Active: 'Yes',
          TaskDateOpen: new Date(),
        },
      });
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Create task'
  );
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: TaskId,
  data: {
    name?: string;
    description?: string | null;
    status?: string;
    archived?: boolean;
    assessmentYear?: string | null;
    projectType?: string;
    submissionDeadline?: Date | null;
    taxPeriodStart?: Date | null;
    taxPeriodEnd?: Date | null;
    taxYear?: number | null;
  }
) {
  return withRetry(
    async () => {
      return await prisma.task.update({
        where: { id: taskId },
        data,
      });
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Update task'
  );
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: TaskId) {
  return withRetry(
    async () => {
      return await prisma.task.delete({
        where: { id: taskId },
      });
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Delete task'
  );
}

/**
 * Archive a task
 */
export async function archiveTask(taskId: TaskId) {
  return withRetry(
    async () => {
      return await prisma.task.update({
        where: { id: taskId },
        data: { Active: 'No' },
      });
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Archive task'
  );
}

/**
 * Get task team members
 */
export async function getTaskTeam(taskId: TaskId) {
  return withRetry(
    async () => {
      return await prisma.taskTeam.findMany({
        where: { taskId },
        select: {
          id: true,
          userId: true,
          role: true,
          createdAt: true,
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Get task team'
  );
}

/**
 * Add team member to task
 */
export async function addTeamMember(
  taskId: TaskId,
  userId: string,
  role: string = 'VIEWER'
) {
  return withRetry(
    async () => {
      return await prisma.taskTeam.create({
        data: {
          taskId,
          userId,
          role,
        },
      });
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Add team member'
  );
}

/**
 * Remove team member from task
 */
export async function removeTeamMember(taskId: TaskId, userId: string) {
  return withRetry(
    async () => {
      return await prisma.taskTeam.deleteMany({
        where: {
          taskId,
          userId,
        },
      });
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Remove team member'
  );
}

/**
 * Update team member role
 */
export async function updateTeamRole(
  taskId: TaskId,
  userId: string,
  role: string
) {
  return withRetry(
    async () => {
      return await prisma.taskTeam.updateMany({
        where: {
          taskId,
          userId,
        },
        data: {
          role,
        },
      });
    },
    RetryPresets.AZURE_SQL_COLD_START,
    'Update team role'
  );
}
