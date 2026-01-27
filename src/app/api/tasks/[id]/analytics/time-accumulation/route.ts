import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { successResponse, parseTaskId } from '@/lib/utils/apiUtils';
import { cache, CACHE_PREFIXES } from '@/lib/services/cache/CacheService';
import { logger } from '@/lib/utils/logger';

interface CumulativeDataPoint {
  date: string; // YYYY-MM-DD format
  cumulativeTime: number;
  budget: number;
}

interface EmployeeTimeAccumulation {
  userId: string;
  userName: string;
  empCode: string;
  empCatDesc: string;
  allocatedBudget: number;
  actualTime: number;
  isTeamMember: boolean;
  cumulativeData: CumulativeDataPoint[];
}

interface TimeAccumulationData {
  taskId: number;
  GSTaskID: string;
  taskCode: string;
  taskDesc: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  actualTime: number;
  cumulativeData: CumulativeDataPoint[];
  employeeData: EmployeeTimeAccumulation[];
}

/**
 * GET /api/tasks/[id]/analytics/time-accumulation
 * Get time accumulation data from task start date to present
 * Shows cumulative time vs budget for overall task and by employee
 */
export const GET = secureRoute.queryWithParams({
  feature: Feature.ACCESS_TASKS,
  taskIdParam: 'id',
  handler: async (request, { user, params }) => {
    // Parse and validate taskId
    const taskId = parseTaskId(params.id);

    // Check cache first
    const cacheKey = `${CACHE_PREFIXES.ANALYTICS}task-time-accumulation:${taskId}`;
    const cached = await cache.get<TimeAccumulationData>(cacheKey);
    if (cached) {
      logger.info('Task time accumulation accessed (cached)', {
        userId: user.id,
        taskId,
        taskCode: cached.taskCode,
      });
      
      const response = NextResponse.json(successResponse(cached));
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    // Fetch task info
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        GSTaskID: true,
        TaskCode: true,
        TaskDesc: true,
        TaskDateOpen: true,
      },
    });

    if (!task) {
      throw new AppError(404, 'Task not found', ErrorCodes.NOT_FOUND);
    }

    const startDate = task.TaskDateOpen;
    const endDate = new Date();

    // Fetch time transactions aggregated by date and employee FIRST
    // TType = 'T' represents time/production entries
    // This will tell us all employees who booked time on this task
    const timeTransactions = await prisma.wIPTransactions.groupBy({
      by: ['TranDate', 'EmpCode'],
      where: {
        GSTaskID: task.GSTaskID,
        TType: 'T',
        TranDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        Amount: true,
      },
      orderBy: {
        TranDate: 'asc',
      },
    });

    // Collect all unique employee codes who booked time
    const allEmpCodes = new Set<string>();
    for (const txn of timeTransactions) {
      if (txn.EmpCode) {
        allEmpCodes.add(txn.EmpCode);
      }
    }

    // Fetch task team with employee data for budget calculation
    const taskTeam = await prisma.taskTeam.findMany({
      where: { taskId },
      select: {
        id: true,
        userId: true,
        allocatedHours: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { User: { name: 'asc' } },
      take: 200,
    });

    // Get employee data for team members (for rates and categories)
    const userEmails = taskTeam
      .map((member) => member.User.email?.toLowerCase())
      .filter((email): email is string => !!email);

    // Fetch ALL employees who either: (1) are team members OR (2) booked time on this task
    const allEmployees = await prisma.employee.findMany({
      where: {
        OR: [
          { WinLogon: { in: userEmails } },
          { EmpCode: { in: Array.from(allEmpCodes) } },
        ],
      },
      select: {
        EmpCode: true,
        WinLogon: true,
        EmpCatDesc: true,
        RateValue: true,
        EmpName: true,
      },
      take: 500,
    });

    // Create lookup maps
    const emailToEmployee = new Map(
      allEmployees.map((emp) => [emp.WinLogon?.toLowerCase() || '', emp])
    );
    const empCodeToEmployee = new Map(
      allEmployees.map((emp) => [emp.EmpCode, emp])
    );

    // Calculate total budget and per-employee budgets (only for team members)
    const employeeBudgets = new Map<string, { 
      userId: string; 
      userName: string; 
      empCode: string;
      empCatDesc: string;
      budget: number;
      email: string;
      isTeamMember: boolean;
    }>();
    let totalBudget = 0;

    for (const member of taskTeam) {
      const userEmail = member.User.email?.toLowerCase();
      if (!userEmail) continue;

      const employee = emailToEmployee.get(userEmail);
      if (!employee) continue;

      const allocatedHours = member.allocatedHours
        ? parseFloat(member.allocatedHours.toString())
        : 0;

      const budget = allocatedHours * employee.RateValue;
      if (budget > 0) {
        totalBudget += budget;
      }

      employeeBudgets.set(employee.EmpCode, {
        userId: member.User.id,
        userName: member.User.name || employee.EmpName || 'Unknown',
        empCode: employee.EmpCode,
        empCatDesc: employee.EmpCatDesc,
        budget,
        email: userEmail,
        isTeamMember: true,
      });
    }

    // Build daily aggregation map for overall task
    const dailyTotals = new Map<string, number>();
    // Build daily aggregation map per employee
    const employeeDailyTotals = new Map<string, Map<string, number>>();

    for (const txn of timeTransactions) {
      const dateKey = txn.TranDate.toISOString().split('T')[0] as string;
      const amount = txn._sum.Amount || 0;
      const empCode = txn.EmpCode || 'UNKNOWN';

      // Overall daily totals
      dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + amount);

      // Per-employee daily totals
      if (!employeeDailyTotals.has(empCode)) {
        employeeDailyTotals.set(empCode, new Map());
      }
      const empMap = employeeDailyTotals.get(empCode)!;
      empMap.set(dateKey, (empMap.get(dateKey) || 0) + amount);
    }

    // Build cumulative data for overall task
    const sortedDates = Array.from(dailyTotals.keys()).sort();
    let cumulativeTotal = 0;
    const cumulativeData: CumulativeDataPoint[] = sortedDates.map((date) => {
      cumulativeTotal += dailyTotals.get(date) || 0;
      return {
        date,
        cumulativeTime: cumulativeTotal,
        budget: totalBudget, // Flat budget line
      };
    });

    // Calculate actual time for overall task
    const actualTime = cumulativeTotal;

    // Build per-employee cumulative data
    // Include ALL employees who booked time, even if not team members
    const employeeData: EmployeeTimeAccumulation[] = [];
    const processedEmpCodes = new Set<string>();

    // First, process employees who have time entries
    for (const empCode of allEmpCodes) {
      processedEmpCodes.add(empCode);
      
      const empDailyMap = employeeDailyTotals.get(empCode);
      const empDates = empDailyMap 
        ? Array.from(empDailyMap.keys()).sort() 
        : [];

      // Get employee info
      const empInfo = empCodeToEmployee.get(empCode);
      const budgetInfo = employeeBudgets.get(empCode);

      let empCumulative = 0;
      const empBudget = budgetInfo?.budget || 0;
      
      const empCumulativeData: CumulativeDataPoint[] = empDates.map((date) => {
        empCumulative += empDailyMap?.get(date) || 0;
        return {
          date,
          cumulativeTime: empCumulative,
          budget: empBudget, // Flat budget line (0 for non-team members)
        };
      });

      employeeData.push({
        userId: budgetInfo?.userId || '',
        userName: budgetInfo?.userName || empInfo?.EmpName || empCode,
        empCode,
        empCatDesc: empInfo?.EmpCatDesc || 'Unknown',
        allocatedBudget: empBudget,
        actualTime: empCumulative,
        isTeamMember: !!budgetInfo?.isTeamMember,
        cumulativeData: empCumulativeData,
      });
    }

    // Then, add team members with budget but no time entries
    for (const [empCode, budgetInfo] of employeeBudgets) {
      if (processedEmpCodes.has(empCode)) continue; // Already processed
      if (budgetInfo.budget <= 0) continue; // No budget to show
      
      // Team member with budget but no time booked
      const empCumulativeData: CumulativeDataPoint[] = [
        {
          date: startDate.toISOString().split('T')[0] as string,
          cumulativeTime: 0,
          budget: budgetInfo.budget,
        },
        {
          date: endDate.toISOString().split('T')[0] as string,
          cumulativeTime: 0,
          budget: budgetInfo.budget,
        },
      ];

      employeeData.push({
        userId: budgetInfo.userId,
        userName: budgetInfo.userName,
        empCode: budgetInfo.empCode,
        empCatDesc: budgetInfo.empCatDesc,
        allocatedBudget: budgetInfo.budget,
        actualTime: 0,
        isTeamMember: true,
        cumulativeData: empCumulativeData,
      });
    }

    // Sort employee data: first by actual time (descending), then by budget (descending)
    employeeData.sort((a, b) => {
      // Primary: by actual time (who worked most first)
      if (b.actualTime !== a.actualTime) {
        return b.actualTime - a.actualTime;
      }
      // Secondary: by budget
      return b.allocatedBudget - a.allocatedBudget;
    });

    // If no cumulative data but we have budget, add start/end points for chart
    if (cumulativeData.length === 0 && totalBudget > 0) {
      cumulativeData.push({
        date: startDate.toISOString().split('T')[0] as string,
        cumulativeTime: 0,
        budget: totalBudget,
      });
      cumulativeData.push({
        date: endDate.toISOString().split('T')[0] as string,
        cumulativeTime: 0,
        budget: totalBudget,
      });
    }

    const responseData: TimeAccumulationData = {
      taskId: task.id,
      GSTaskID: task.GSTaskID,
      taskCode: task.TaskCode,
      taskDesc: task.TaskDesc,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalBudget,
      actualTime,
      cumulativeData,
      employeeData,
    };

    // Cache for 30 minutes
    await cache.set(cacheKey, responseData, 1800);

    logger.info('Task time accumulation generated', {
      userId: user.id,
      taskId: task.id,
      taskCode: task.TaskCode,
      totalBudget,
      actualTime,
      employeeCount: employeeData.length,
      dataPoints: cumulativeData.length,
    });

    const response = NextResponse.json(successResponse(responseData));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  },
});
