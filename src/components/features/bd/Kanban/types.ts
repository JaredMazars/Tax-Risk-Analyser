/**
 * BD Kanban Board Types
 * 
 * Pattern based on tasks kanban types for consistency.
 */

export type BDDisplayMode = 'compact' | 'detailed';

export interface BDOpportunityWithRelations {
  id: number;
  title: string;
  companyName: string | null;
  description: string | null;
  value: number | null;
  probability: number | null;
  status: string;
  stageId: number;
  stage: {
    id: number;
    name: string;
    color: string | null;
  };
  assignedTo: string; // Employee code
  assignedToEmployee?: {
    EmpCode: string;
    EmpName: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  expectedCloseDate: Date | null;
  serviceLine: string;
  serviceLineDesc?: string | null;
  // Assignment scheduling
  assignmentType?: string;
  startDate?: Date;
  endDate?: Date;
  recurringFrequency?: string;
}

export interface BDKanbanColumn {
  id: string;
  name: string;
  stageId: number; // For stage updates
  opportunities: BDOpportunityWithRelations[];
  color: string | null;
  probability: number;
  count: number; // Total count
  totalValue: number; // Sum of all opportunity values
  isCollapsed: boolean;
  isDraft?: boolean; // Special column for drafts
}

export interface BDKanbanData {
  columns: BDKanbanColumn[];
  stages: Array<{ id: number; name: string; color: string | null; probability: number }>;
}

export interface BDKanbanFilters {
  search: string;
  assignedTo: string[];
  stages: string[];
  minValue?: number;
  maxValue?: number;
  dateFrom?: Date;
  dateTo?: Date;
  includeDrafts: boolean;
}

export interface BDKanbanBoardProps {
  serviceLine: string;
  subServiceLineGroup?: string;
}
