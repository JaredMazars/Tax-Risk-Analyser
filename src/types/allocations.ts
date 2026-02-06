import { ServiceLineRole, NonClientEventType, EmployeeStatus } from './index';

// Cross-task allocation record (from team allocation API)
export interface TaskTeamAllocation {
  id: number;
  taskId: number;
  taskName: string;
  taskCode?: string;
  clientName?: string | null;
  clientCode?: string | null;
  role: ServiceLineRole;
  startDate: string | Date;
  endDate: string | Date;
  allocatedHours: number | null;
  allocatedPercentage: number | null;
  actualHours: number | null;
  isCurrentTask?: boolean;
}

// Allocation Period (for grouping multiple allocations by user)
export interface AllocationPeriod {
  allocationId: number;
  startDate: Date | null;
  endDate: Date | null;
  allocatedHours: number | null;
  allocatedPercentage: number | null;
  actualHours: number | null;
}

// Grouped Task Team (user with multiple allocation periods)
export interface GroupedTaskTeam {
  userId: string;
  userName: string | null;
  userEmail: string;
  userImage?: string | null;
  role: ServiceLineRole;
  allocations: AllocationPeriod[];
  totalAllocatedHours: number;
  totalActualHours: number;
}

// Non-Client Allocation
export interface NonClientAllocation {
  id: number;
  employeeId: number;
  eventType: NonClientEventType;
  startDate: Date;
  endDate: Date;
  allocatedHours: number;
  allocatedPercentage: number;
  notes?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  employee?: {
    id: number;
    EmpCode: string;
    EmpName: string;
    EmpNameFull: string;
  };
}

export interface TeamAllocation {
  id: number;
  taskId: number;
  taskName: string;
  role: ServiceLineRole;
  startDate: Date | null;
  endDate: Date | null;
  allocatedHours: number | null;
  allocatedPercentage: number | null;
  actualHours: number | null;
}

export interface TeamMemberWithAllocations {
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
    jobGradeCode?: string | null;
  };
  role: string;
  id: number;
  employeeId?: number;
  allocations: TeamAllocation[];
  hasAccount?: boolean;
  employeeStatus?: EmployeeStatus;
}
