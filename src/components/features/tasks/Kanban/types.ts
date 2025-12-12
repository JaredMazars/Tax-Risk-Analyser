import { TaskStage } from '@/types/task-stages';

export interface KanbanTask {
  id: number;
  name: string;
  code: string;
  serviceLine: string;
  serviceLineDesc: string;
  stage: TaskStage;
  partner: string;
  manager: string;
  dateOpen: Date | string;
  dateTerminate: Date | string | null;
  client: {
    id: number;
    GSClientID: string;
    code: string;
    name: string | null;
  } | null;
  team: {
    userId: string;
    role: string;
    name: string | null;
    email: string;
  }[];
  allocatedHours: number;
  actualHours: number;
  userRole: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface KanbanColumn {
  stage: TaskStage;
  tasks: KanbanTask[];
  metrics: {
    count: number;
    totalBudgetHours: number;
    totalActualHours: number;
  };
}

export interface KanbanBoardData {
  columns: KanbanColumn[];
  totalTasks: number;
}

export interface KanbanFilters {
  search: string;
  teamMember: string | null;
  priority: string | null;
  dueDateRange: {
    start: Date | null;
    end: Date | null;
  } | null;
  includeArchived: boolean;
}

export type CardDisplayMode = 'compact' | 'detailed';

export interface KanbanBoardProps {
  serviceLine: string;
  subServiceLineGroup: string;
  myTasksOnly?: boolean;
  onTaskClick?: (taskId: number) => void;
}

export interface KanbanColumnProps {
  column: KanbanColumn;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  canDrag: boolean;
  displayMode: CardDisplayMode;
  onTaskClick?: (taskId: number) => void;
}

export interface KanbanCardProps {
  task: KanbanTask;
  displayMode: CardDisplayMode;
  canDrag: boolean;
  onClick?: () => void;
}

export interface KanbanFiltersProps {
  filters: KanbanFilters;
  onFiltersChange: (filters: KanbanFilters) => void;
  teamMembers: { id: string; name: string }[];
}

export interface KanbanMetricsProps {
  metrics: {
    count: number;
    totalBudgetHours: number;
    totalActualHours: number;
  };
}



