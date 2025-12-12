import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { getUserServiceLines } from '@/lib/services/service-lines/serviceLineService';
import { TaskStage } from '@/types/task-stages';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceLine = searchParams.get('serviceLine');
    const subServiceLineGroup = searchParams.get('subServiceLineGroup');
    const myTasksOnly = searchParams.get('myTasksOnly') === 'true';
    const teamMember = searchParams.get('teamMember');
    const search = searchParams.get('search') || '';
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Check service line access
    const userServiceLines = await getUserServiceLines(user.id);
    
    // Build cache key
    const cacheKey = `${CACHE_PREFIXES.TASK}kanban:${serviceLine}:${subServiceLineGroup}:${myTasksOnly}:${teamMember}:${search}:${includeArchived}:user:${user.id}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(successResponse(cached));
    }

    // OPTIMIZATION: Pre-fetch all ServiceLineExternal mappings ONCE
    let servLineCodes: string[] = [];
    
    if (serviceLine) {
      // Check if user has access to this service line
      const hasAccess = userServiceLines.some((sl: any) => 
        sl.serviceLine === serviceLine || 
        sl.subGroups?.some((sg: any) => sg.code === subServiceLineGroup)
      );
      
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Single query to get all relevant ServLineCodes
      const whereClause = subServiceLineGroup
        ? { SubServlineGroupCode: subServiceLineGroup, masterCode: serviceLine }
        : { masterCode: serviceLine };
      
      servLineCodes = await prisma.serviceLineExternal
        .findMany({
          where: whereClause,
          select: { ServLineCode: true },
        })
        .then(results => results.map(r => r.ServLineCode).filter((code): code is string => code !== null));
    } else {
      // OPTIMIZATION: Get all ServLineCodes in a single query using IN clause
      const subGroupCodes = userServiceLines.flatMap((sl: any) => 
        sl.subGroups?.map((sg: any) => sg.code) || []
      );
      
      if (subGroupCodes.length > 0) {
        servLineCodes = await prisma.serviceLineExternal
          .findMany({
            where: { SubServlineGroupCode: { in: subGroupCodes } },
            select: { ServLineCode: true },
          })
          .then(results => results.map(r => r.ServLineCode).filter((code): code is string => code !== null));
      }
    }

    // Build where clause for filtering
    const where: any = {};
    
    // Only filter by Active status if not including archived
    if (!includeArchived) {
      where.Active = 'Yes';
    }

    if (servLineCodes.length > 0) {
      where.ServLineCode = { in: servLineCodes };
    }

    // Search filter
    if (search) {
      where.OR = [
        { TaskDesc: { contains: search } },
        { TaskCode: { contains: search } },
      ];
    }

    // OPTIMIZATION: Move team member filtering to WHERE clause
    if (teamMember || myTasksOnly) {
      where.TaskTeam = {
        some: {
          userId: myTasksOnly ? user.id : teamMember,
        },
      };
    }

    // OPTIMIZATION: Get tasks with limit and optimized query
    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        TaskDesc: true,
        TaskCode: true,
        ServLineCode: true,
        ServLineDesc: true,
        TaskPartnerName: true,
        TaskManagerName: true,
        TaskDateOpen: true,
        TaskDateTerminate: true,
        Active: true,
        createdAt: true,
        updatedAt: true,
        Client: {
          select: {
            id: true,
            GSClientID: true,
            clientCode: true,
            clientNameFull: true,
          },
        },
        TaskTeam: {
          select: {
            userId: true,
            role: true,
            allocatedHours: true,
            actualHours: true,
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        TaskStage: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            stage: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 500, // OPTIMIZATION: Limit results to prevent memory issues
    });

    // Transform tasks and group by stage
    const stages = [
      TaskStage.DRAFT,
      TaskStage.IN_PROGRESS,
      TaskStage.UNDER_REVIEW,
      TaskStage.COMPLETED,
    ];
    
    // Only add ARCHIVED stage if includeArchived is true
    if (includeArchived) {
      stages.push(TaskStage.ARCHIVED);
      console.log('API: Including ARCHIVED stage - total stages:', stages.length);
    } else {
      console.log('API: Not including ARCHIVED stage - total stages:', stages.length);
    }

    const columns = stages.map(stage => {
      const stageTasks = tasks
        .filter(task => {
          // Check if task is archived
          const isArchived = task.Active !== 'Yes';
          
          // If this is the ARCHIVED stage, only include archived tasks
          if (stage === TaskStage.ARCHIVED) {
            return isArchived;
          }
          
          // For other stages, exclude archived tasks
          if (isArchived) {
            return false;
          }
          
          const currentStage = task.TaskStage.length > 0 
            ? task.TaskStage[0]?.stage ?? TaskStage.DRAFT
            : TaskStage.DRAFT;
          return currentStage === stage;
        })
        .map(task => {
          const currentStage = task.TaskStage.length > 0 
            ? task.TaskStage[0]?.stage ?? TaskStage.DRAFT
            : TaskStage.DRAFT;
          
          const userRole = task.TaskTeam.find(member => member.userId === user.id)?.role || null;

          // Calculate total allocated and actual hours
          const totalAllocatedHours = task.TaskTeam.reduce((sum, member) => {
            return sum + (member.allocatedHours ? Number(member.allocatedHours) : 0);
          }, 0);

          const totalActualHours = task.TaskTeam.reduce((sum, member) => {
            return sum + (member.actualHours ? Number(member.actualHours) : 0);
          }, 0);

          return {
            id: task.id,
            name: task.TaskDesc,
            code: task.TaskCode,
            serviceLine: task.ServLineCode,
            serviceLineDesc: task.ServLineDesc,
            stage: currentStage,
            partner: task.TaskPartnerName,
            manager: task.TaskManagerName,
            dateOpen: task.TaskDateOpen,
            dateTerminate: task.TaskDateTerminate,
            client: task.Client ? {
              id: task.Client.id,
              GSClientID: task.Client.GSClientID,
              code: task.Client.clientCode,
              name: task.Client.clientNameFull,
            } : null,
            team: task.TaskTeam.map(member => ({
              userId: member.userId,
              role: member.role,
              name: member.User.name,
              email: member.User.email,
            })),
            allocatedHours: totalAllocatedHours,
            actualHours: totalActualHours,
            userRole,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          };
        });

      // Calculate metrics for this column
      const count = stageTasks.length;
      const totalBudgetHours = stageTasks.reduce((sum, task) => sum + task.allocatedHours, 0);
      const totalActualHours = stageTasks.reduce((sum, task) => sum + task.actualHours, 0);

      return {
        stage,
        name: stage === TaskStage.ARCHIVED ? 'ARCHIVED' : stage.replace(/_/g, ' '),
        taskCount: count,
        tasks: stageTasks,
        metrics: {
          count,
          totalBudgetHours,
          totalActualHours,
        },
      };
    });

    const response = {
      columns,
      totalTasks: tasks.length,
    };

    // Cache for 10 minutes
    await cache.set(cacheKey, response, 600);

    return NextResponse.json(successResponse(response));
  } catch (error) {
    return handleApiError(error, 'Get Kanban Board Data');
  }
}
