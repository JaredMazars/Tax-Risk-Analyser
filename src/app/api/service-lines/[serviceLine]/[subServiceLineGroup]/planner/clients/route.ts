import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { getUserServiceLines } from '@/lib/services/service-lines/serviceLineService';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError, AppError } from '@/lib/utils/errorHandler';
import { startOfDay } from 'date-fns';

/**
 * GET /api/service-lines/[serviceLine]/[subServiceLineGroup]/planner/clients
 * Fetch all tasks with employee allocations as flat array
 * Returns Task → Employee Allocations (no client grouping)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { serviceLine: string; subServiceLineGroup: string } }
) {
  try {
    // 1. Authenticate
    const user = await getCurrentUser();
    if (!user?.id) {
      return handleApiError(new AppError(401, 'Unauthorized'), 'Get client planner data');
    }

    // 2. Extract and validate params
    const subServiceLineGroup = params.subServiceLineGroup;
    if (!subServiceLineGroup) {
      return handleApiError(new AppError(400, 'Sub-service line group is required'), 'Get client planner data');
    }

    // 3. Check user has access to this sub-service line group
    const userServiceLines = await getUserServiceLines(user.id);
    const hasAccess = userServiceLines.some(sl => 
      sl.subGroups?.some((sg: any) => sg.code === subServiceLineGroup)
    );
    if (!hasAccess) {
      return handleApiError(
        new AppError(403, 'You do not have access to this sub-service line group'),
        'Get client planner data'
      );
    }

    // 4. Get search params for filtering
    const searchParams = request.nextUrl.searchParams;
    const clientSearch = searchParams.get('clientSearch') || '';
    const groupFilter = searchParams.get('groupFilter') || '';
    const partnerFilter = searchParams.get('partnerFilter') || '';

    // 5. Map subServiceLineGroup to external service line codes
    const serviceLineExternalMappings = await prisma.serviceLineExternal.findMany({
      where: {
        SubServlineGroupCode: subServiceLineGroup
      },
      select: {
        ServLineCode: true,
        SubServlineGroupCode: true,
        SubServlineGroupDesc: true
      }
    });
    
    const externalServLineCodes = serviceLineExternalMappings
      .map(m => m.ServLineCode)
      .filter((code): code is string => !!code);

    if (externalServLineCodes.length === 0) {
      return NextResponse.json(successResponse({ tasks: [] }));
    }

    // 6. Build client filter conditions
    const clientWhereConditions: any = {};
    
    if (clientSearch) {
      clientWhereConditions.OR = [
        { clientNameFull: { contains: clientSearch } },
        { clientCode: { contains: clientSearch } }
      ];
    }
    
    if (groupFilter) {
      clientWhereConditions.groupDesc = { contains: groupFilter };
    }
    
    if (partnerFilter) {
      clientWhereConditions.clientPartner = { contains: partnerFilter };
    }

    // 7. Get all tasks with allocations in this service line group
    const tasks = await prisma.task.findMany({
      where: {
        ServLineCode: { in: externalServLineCodes },
        GSClientID: { not: null }, // Only client tasks
        TaskTeam: {
          some: {
            startDate: { not: null },
            endDate: { not: null }
          }
        }
      },
      select: {
        id: true,
        TaskDesc: true,
        TaskCode: true,
        GSClientID: true,
        Client: {
          select: {
            id: true,
            GSClientID: true,
            clientCode: true,
            clientNameFull: true,
            groupDesc: true,
            clientPartner: true
          }
        },
        TaskTeam: {
          where: {
            startDate: { not: null },
            endDate: { not: null }
          },
          select: {
            id: true,
            userId: true,
            role: true,
            startDate: true,
            endDate: true,
            allocatedHours: true,
            allocatedPercentage: true,
            actualHours: true,
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: [
        { Client: { clientNameFull: 'asc' } },
        { TaskDesc: 'asc' }
      ]
    });

    // 8. Filter tasks by client conditions if needed
    const filteredTasks = tasks.filter(task => {
      if (!task.Client) return false;
      
      if (clientSearch) {
        const searchLower = clientSearch.toLowerCase();
        const nameMatch = task.Client.clientNameFull?.toLowerCase().includes(searchLower);
        const codeMatch = task.Client.clientCode?.toLowerCase().includes(searchLower);
        if (!nameMatch && !codeMatch) return false;
      }
      
      if (groupFilter && !task.Client.groupDesc?.toLowerCase().includes(groupFilter.toLowerCase())) {
        return false;
      }
      
      if (partnerFilter && !task.Client.clientPartner?.toLowerCase().includes(partnerFilter.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    // 9. Get user IDs to fetch Employee data
    const userIds = [...new Set(
      filteredTasks.flatMap(task => 
        task.TaskTeam.map(member => member.userId)
      )
    )];

    // 10. Get Employee data for all users
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { WinLogon: { in: userIds } },
          // Also try email prefixes
          ...userIds.map(userId => ({
            WinLogon: { startsWith: `${userId}@` }
          }))
        ]
      },
      select: {
        id: true,
        GSEmployeeID: true,
        EmpCode: true,
        EmpNameFull: true,
        EmpCatCode: true,
        OfficeCode: true,
        WinLogon: true
      }
    });

    // Create employee lookup map
    const employeeMap = new Map<string, typeof employees[0]>();
    employees.forEach(emp => {
      if (emp.WinLogon) {
        const lowerLogon = emp.WinLogon.toLowerCase();
        const prefix = lowerLogon.split('@')[0];
        employeeMap.set(lowerLogon, emp);
        if (prefix) {
          employeeMap.set(prefix, emp);
        }
      }
    });

    // 11. Build flat task rows with employee allocations
    const taskRows = filteredTasks
      .map(task => {
        if (!task.Client || !task.Client.GSClientID) return null;

        // Build employee allocations for this task
        const allocations = task.TaskTeam
          .filter(member => member.startDate && member.endDate)
          .map(member => {
            const employee = employeeMap.get(member.userId) || 
                            employeeMap.get(member.userId.split('@')[0]);

            return {
              id: member.id,
              taskId: task.id,
              userId: member.userId,
              employeeId: employee?.id || null,
              employeeName: member.User?.name || employee?.EmpNameFull || member.userId,
              employeeCode: employee?.EmpCode || null,
              jobGradeCode: employee?.EmpCatCode || null,
              officeLocation: employee?.OfficeCode?.trim() || null,
              role: member.role,
              startDate: startOfDay(member.startDate!),
              endDate: startOfDay(member.endDate!),
              allocatedHours: member.allocatedHours ? parseFloat(member.allocatedHours.toString()) : null,
              allocatedPercentage: member.allocatedPercentage,
              actualHours: member.actualHours ? parseFloat(member.actualHours.toString()) : null
            };
          });

        // Only include tasks with allocations
        if (allocations.length === 0) return null;

        return {
          taskId: task.id,
          taskCode: task.TaskCode,
          taskName: task.TaskDesc,
          clientId: task.Client.id,
          clientCode: task.Client.clientCode,
          clientName: task.Client.clientNameFull || task.Client.clientCode,
          groupDesc: task.Client.groupDesc,
          clientPartner: task.Client.clientPartner,
          allocations
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => {
        // Sort by client name, then task name
        const clientCompare = a.clientName.localeCompare(b.clientName);
        if (clientCompare !== 0) return clientCompare;
        return a.taskName.localeCompare(b.taskName);
      });

    return NextResponse.json(successResponse({ tasks: taskRows }));
  } catch (error) {
    return handleApiError(error, 'Get client planner data');
  }
}


