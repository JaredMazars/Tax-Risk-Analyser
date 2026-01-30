/**
 * BD Kanban Service
 * 
 * Processes kanban data with drafts and stage grouping.
 * Pattern based on tasks kanban data processing.
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export interface BDKanbanFilters {
  serviceLine: string;
  search?: string;
  assignedTo?: string[];
  stages?: number[];
  minValue?: number;
  maxValue?: number;
  dateFrom?: Date;
  dateTo?: Date;
  includeDrafts: boolean;
}

export async function getKanbanData(filters: BDKanbanFilters, userId: string) {
  // Build where clause for opportunities
  const where: Prisma.BDOpportunityWhereInput = {};

  // Service line filter
  if (filters.serviceLine && filters.serviceLine !== 'BUSINESS_DEV') {
    where.serviceLine = filters.serviceLine;
  }

  // Search filter (company name, title, or description)
  if (filters.search) {
    where.OR = [
      { companyName: { contains: filters.search } },
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  // Assigned to filter (string field)
  if (filters.assignedTo && filters.assignedTo.length > 0) {
    where.assignedTo = { in: filters.assignedTo };
  }

  // Stage filter
  if (filters.stages && filters.stages.length > 0) {
    where.stageId = { in: filters.stages };
  }

  // Value range filter
  if (filters.minValue !== undefined || filters.maxValue !== undefined) {
    where.value = {};
    if (filters.minValue !== undefined) {
      where.value.gte = filters.minValue;
    }
    if (filters.maxValue !== undefined) {
      where.value.lte = filters.maxValue;
    }
  }

  // Date range filter (expectedCloseDate)
  if (filters.dateFrom || filters.dateTo) {
    where.expectedCloseDate = {};
    if (filters.dateFrom) {
      where.expectedCloseDate.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.expectedCloseDate.lte = filters.dateTo;
    }
  }

  // Fetch all active stages ordered by order field
  const stages = await prisma.bDStage.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      color: true,
      probability: true,
    },
  });

  // Fetch opportunities with relations
  const opportunities = await prisma.bDOpportunity.findMany({
    where,
    include: {
      BDStage: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Get unique assigned employee codes
  const assignedToCodes = [...new Set(opportunities.map(opp => opp.assignedTo).filter(Boolean))];
  
  // Fetch employee details for assignedTo
  const employees = assignedToCodes.length > 0 ? await prisma.employee.findMany({
    where: { EmpCode: { in: assignedToCodes } },
    select: {
      EmpCode: true,
      EmpName: true,
    },
  }) : [];
  
  const employeeMap = new Map(employees.map(emp => [emp.EmpCode, emp]));

  // Get unique service line codes
  const serviceLineCodes = [...new Set(opportunities.map(opp => opp.serviceLine).filter(Boolean))];
  
  // Fetch service line descriptions
  const serviceLines = serviceLineCodes.length > 0 ? await prisma.serviceLineExternal.findMany({
    where: { ServLineCode: { in: serviceLineCodes } },
    select: {
      ServLineCode: true,
      ServLineDesc: true,
    },
  }) : [];
  
  const serviceLineMap = new Map(serviceLines.map(sl => [sl.ServLineCode, sl.ServLineDesc]));

  // Transform opportunities to match frontend types
  const transformedOpportunities = opportunities.map(opp => ({
    id: opp.id,
    title: opp.title,
    companyName: opp.companyName,
    description: opp.description,
    value: opp.value,
    probability: opp.probability,
    status: opp.status,
    stageId: opp.stageId,
    stage: opp.BDStage,
    assignedTo: opp.assignedTo,
    assignedToEmployee: employeeMap.get(opp.assignedTo) || null,
    createdAt: opp.createdAt,
    updatedAt: opp.updatedAt,
    expectedCloseDate: opp.expectedCloseDate,
    serviceLine: opp.serviceLine,
    serviceLineDesc: serviceLineMap.get(opp.serviceLine || '') || null,
    // Assignment scheduling
    assignmentType: opp.assignmentType,
    startDate: opp.startDate,
    endDate: opp.endDate,
    recurringFrequency: opp.recurringFrequency,
  }));

  // Group opportunities by stage (with full metrics like tasks)
  const columns = stages.map(stage => {
    const stageOpps = transformedOpportunities.filter(opp => opp.stageId === stage.id && opp.status !== 'DRAFT');
    const totalValue = stageOpps.reduce((sum, opp) => sum + (opp.value || 0), 0);
    
    return {
      id: `stage-${stage.id}`,
      stageId: stage.id,
      name: stage.name,
      color: stage.color,
      probability: stage.probability,
      opportunities: stageOpps,
      count: stageOpps.length,
      totalValue,
      isCollapsed: false, // Managed by page component
      isDraft: false,
    };
  });

  // Add drafts column if needed (at the beginning)
  const draftOpportunities = transformedOpportunities.filter(opp => opp.status === 'DRAFT');
  if (filters.includeDrafts && draftOpportunities.length > 0) {
    const draftValue = draftOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
    
    columns.unshift({
      id: 'drafts',
      stageId: -1, // Special ID for drafts
      name: 'Drafts',
      color: '#F8B400',
      probability: 0,
      opportunities: draftOpportunities,
      count: draftOpportunities.length,
      totalValue: draftValue,
      isCollapsed: false,
      isDraft: true,
    });
  }

  return { columns, stages };
}
