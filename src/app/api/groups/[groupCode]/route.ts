import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { getCachedList, setCachedList } from '@/lib/services/cache/listCache';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupCode: string } }
) {
  try {
    // 1. Authenticate
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check Permission
    const { checkUserPermission } = await import('@/lib/services/permissions/permissionService');
    const hasPermission = await checkUserPermission(user.id, 'clients', 'READ');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const { groupCode } = params;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50'), 100);
    const dataType = searchParams.get('type') || 'clients'; // 'clients' or 'tasks'
    const serviceLine = searchParams.get('serviceLine') || undefined; // Filter by master service line
    const skip = (page - 1) * limit;

    // Try to get cached data
    const cacheParams = {
      endpoint: 'groups' as const,
      page,
      limit,
      search,
      groupCode,
      type: dataType as 'clients' | 'tasks',
      serviceLine,
    };
    
    const cached = await getCachedList(cacheParams);
    if (cached) {
      return NextResponse.json(successResponse(cached));
    }

    // First, verify the group exists and get its description
    const groupInfo = await prisma.client.findFirst({
      where: { groupCode },
      select: {
        groupCode: true,
        groupDesc: true,
      },
    });

    if (!groupInfo) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    if (dataType === 'tasks') {
      // Fetch tasks for all clients in this group (organization-wide)
      interface TaskWhereClause {
        Client: {
          groupCode: string;
        };
        ServLineCode?: {
          in: string[];
        };
        OR?: Array<Record<string, { contains: string }>>;
      }

      const taskWhere: TaskWhereClause = {
        Client: {
          groupCode,
        },
      };
      
      // Note: serviceLine parameter kept for backwards compatibility but not used for filtering
      // All tasks are returned and filtering is done on the frontend based on SLGroup

      if (search) {
        taskWhere.OR = [
          { TaskDesc: { contains: search } },
          { TaskCode: { contains: search } },
        ];
      }

      // Execute count and data queries in parallel for better performance
      const [total, tasksRaw] = await Promise.all([
        prisma.task.count({ where: taskWhere }),
        prisma.task.findMany({
          where: taskWhere,
          skip,
          take: limit,
          orderBy: {
            updatedAt: 'desc',
          },
          select: {
            id: true,
            TaskDesc: true,
            TaskCode: true,
            Active: true,
            ServLineCode: true,
            ServLineDesc: true,
            SLGroup: true,
            createdAt: true,
            updatedAt: true,
            Client: {
              select: {
                ClientID: true,
                clientCode: true,
                clientNameFull: true,
              },
            },
          },
        }),
      ]);

      // Get unique service line codes from tasks
      const serviceLineCodes = [...new Set(tasksRaw.map(t => t.ServLineCode))];
      
      // Query ServiceLineExternal data for ServLineCode mappings
      const serviceLineExternalData = await prisma.serviceLineExternal.findMany({
        where: {
          ServLineCode: {
            in: serviceLineCodes,
          },
        },
        select: {
          ServLineCode: true,
          masterCode: true,
          SubServlineGroupCode: true,
        },
      });

      // Create maps for quick lookup
      const serviceLineMap = new Map(
        serviceLineExternalData.map(sl => [sl.ServLineCode, sl.masterCode])
      );
      
      const servLineToSubGroupMap = new Map(
        serviceLineExternalData.map(sl => [sl.ServLineCode, sl.SubServlineGroupCode])
      );

      // Fetch WIP data for all tasks by taskId
      const taskIds = tasksRaw.map(t => t.id);
      const tasksWipData = taskIds.length > 0 ? await prisma.wipLTD.findMany({
        where: {
          taskId: {
            in: taskIds,
          },
        },
        select: {
          taskId: true,
          BalWIP: true,
          BalTime: true,
          BalDisb: true,
        },
      }) : [];

      // Create a map of WIP data by taskId
      const wipByTaskId = new Map<number, { balWIP: number; balTime: number; balDisb: number }>();
      tasksWipData.forEach(wip => {
        if (!wipByTaskId.has(wip.taskId)) {
          wipByTaskId.set(wip.taskId, { balWIP: 0, balTime: 0, balDisb: 0 });
        }
        
        const taskWip = wipByTaskId.get(wip.taskId)!;
        taskWip.balWIP += wip.BalWIP || 0;
        taskWip.balTime += wip.BalTime || 0;
        taskWip.balDisb += wip.BalDisb || 0;
      });

      // Map tasks with master service line info, sub-service line group code, and WIP data
      const tasks = tasksRaw.map(task => {
        // Get WIP for this specific task
        const wip = wipByTaskId.get(task.id) || { balWIP: 0, balTime: 0, balDisb: 0 };
        
        return {
          id: task.id,
          TaskDesc: task.TaskDesc,
          TaskCode: task.TaskCode,
          Active: task.Active,
          ServLineCode: task.ServLineCode,
          ServLineDesc: task.ServLineDesc,
          SLGroup: task.SLGroup,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          Client: task.Client,
          masterServiceLine: serviceLineMap.get(task.ServLineCode) || null,
          subServiceLineGroupCode: servLineToSubGroupMap.get(task.ServLineCode) || null,
          wip,
        };
      });

      // Get unique master service line codes and fetch their details
      const uniqueMasterCodes = [...new Set(tasks.map(t => t.masterServiceLine).filter(Boolean))];
      const serviceLineMasterData = await prisma.serviceLineMaster.findMany({
        where: {
          code: {
            in: uniqueMasterCodes as string[],
          },
        },
        select: {
          code: true,
          name: true,
          description: true,
        },
      });

      const responseData = {
        groupCode: groupInfo.groupCode,
        groupDesc: groupInfo.groupDesc,
        tasks,
        serviceLineMaster: serviceLineMasterData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Cache the response
      await setCachedList(cacheParams, responseData);

      return NextResponse.json(successResponse(responseData));
    }

    // Build where clause for clients - show ALL clients in group organization-wide
    interface WhereClause {
      groupCode: string;
      OR?: Array<Record<string, { contains: string }>>;
    }

    const where: WhereClause = {
      groupCode,
    };

    if (search) {
      where.OR = [
        { clientNameFull: { contains: search } },
        { clientCode: { contains: search } },
        { industry: { contains: search } },
        { sector: { contains: search } },
      ];
    }

    // Execute count and data queries in parallel for better performance
    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          clientNameFull: 'asc',
        },
        select: {
          id: true,
          ClientID: true,
          clientCode: true,
          clientNameFull: true,
          clientPartner: true,
          industry: true,
          active: true,
          _count: {
            select: {
              Task: true,
            },
          },
        },
      }),
    ]);

    // Fetch WIP data for all clients in this page
    const clientIDs = clients.map(c => c.ClientID);
    const wipData = clientIDs.length > 0 ? await prisma.wipLTD.findMany({
      where: {
        ClientCode: {
          in: clientIDs,
        },
      },
      select: {
        ClientCode: true,
        BalWIP: true,
        BalTime: true,
        BalDisb: true,
      },
    }) : [];

    // Aggregate WIP data by client
    const wipByClient = new Map<string, { balWIP: number; balTime: number; balDisb: number }>();
    wipData.forEach(wip => {
      if (!wip.ClientCode) return;
      
      if (!wipByClient.has(wip.ClientCode)) {
        wipByClient.set(wip.ClientCode, { balWIP: 0, balTime: 0, balDisb: 0 });
      }
      
      const clientWip = wipByClient.get(wip.ClientCode)!;
      clientWip.balWIP += wip.BalWIP || 0;
      clientWip.balTime += wip.BalTime || 0;
      clientWip.balDisb += wip.BalDisb || 0;
    });

    // Add WIP data to clients
    const clientsWithWip = clients.map(client => ({
      ...client,
      wip: wipByClient.get(client.ClientID) || { balWIP: 0, balTime: 0, balDisb: 0 },
    }));

    const responseData = {
      groupCode: groupInfo.groupCode,
      groupDesc: groupInfo.groupDesc,
      clients: clientsWithWip,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the response
    await setCachedList(cacheParams, responseData);

    return NextResponse.json(successResponse(responseData));
  } catch (error) {
    return handleApiError(error, 'Get Group Details');
  }
}

