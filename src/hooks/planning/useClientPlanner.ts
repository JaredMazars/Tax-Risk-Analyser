import { useQuery } from '@tanstack/react-query';
import { TaskRole } from '@/types';

interface UseClientPlannerOptions {
  serviceLine: string;
  subServiceLineGroup: string;
  clientSearch?: string;
  groupFilter?: string;
  partnerFilter?: string;
  enabled?: boolean;
}

export interface AllocationData {
  id: number;
  taskId: number;
  userId: string;
  employeeId: number | null;
  employeeName: string;
  employeeCode: string | null;
  jobGradeCode: string | null;
  officeLocation: string | null;
  role: TaskRole;
  startDate: Date;
  endDate: Date;
  allocatedHours: number | null;
  allocatedPercentage: number | null;
  actualHours: number | null;
}

export interface TaskPlannerRow {
  taskId: number;
  taskCode: string;
  taskName: string;
  clientId: number;
  clientCode: string;
  clientName: string;
  groupDesc: string | null;
  clientPartner: string | null;
  allocations: AllocationData[];
}

/**
 * Hook to fetch client planner data
 * Returns flat array of tasks with employee allocations
 */
export function useClientPlanner({
  serviceLine,
  subServiceLineGroup,
  clientSearch = '',
  groupFilter = '',
  partnerFilter = '',
  enabled = true
}: UseClientPlannerOptions) {
  return useQuery({
    queryKey: ['planner', 'tasks', serviceLine, subServiceLineGroup, clientSearch, groupFilter, partnerFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (clientSearch) params.set('clientSearch', clientSearch);
      if (groupFilter) params.set('groupFilter', groupFilter);
      if (partnerFilter) params.set('partnerFilter', partnerFilter);

      const response = await fetch(
        `/api/service-lines/${serviceLine}/${subServiceLineGroup}/planner/clients?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch client planner data');
      }
      
      const result = await response.json();
      const tasks = result.data?.tasks || result.tasks || [];
      
      // Convert date strings to Date objects
      return tasks.map((task: any) => ({
        ...task,
        allocations: task.allocations.map((alloc: any) => ({
          ...alloc,
          startDate: new Date(alloc.startDate),
          endDate: new Date(alloc.endDate)
        }))
      }));
    },
    enabled: enabled && !!serviceLine && !!subServiceLineGroup,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}


