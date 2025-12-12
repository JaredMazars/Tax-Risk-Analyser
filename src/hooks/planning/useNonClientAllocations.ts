import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { NonClientAllocation, NonClientEventType } from '@/types';

// Query Keys
export const nonClientAllocationKeys = {
  all: ['non-client-allocations'] as const,
  byUser: (userId: string) => [...nonClientAllocationKeys.all, 'user', userId] as const,
  byDateRange: (userId: string, startDate: string, endDate: string) => 
    [...nonClientAllocationKeys.byUser(userId), 'range', startDate, endDate] as const,
};

interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Fetch non-client allocations for an employee
 * Optionally filter by date range and event type
 */
export function useNonClientAllocations(
  employeeId: number | null,
  dateRange?: DateRange,
  eventType?: NonClientEventType
): UseQueryResult<NonClientAllocation[], Error> {
  return useQuery({
    queryKey: dateRange 
      ? [...nonClientAllocationKeys.all, 'employee', employeeId, 'range', dateRange.startDate, dateRange.endDate]
      : [...nonClientAllocationKeys.all, 'employee', employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID is required');
      
      const params = new URLSearchParams({ employeeId: employeeId.toString() });
      
      if (dateRange) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      
      if (eventType) {
        params.append('eventType', eventType);
      }

      const response = await fetch(`/api/non-client-allocations?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch non-client allocations');
      }

      const result = await response.json();
      return result.data || result;
    },
    enabled: !!employeeId && employeeId > 0,
  });
}

interface CreateNonClientAllocationData {
  employeeId: number;
  eventType: NonClientEventType;
  startDate: string | Date;
  endDate: string | Date;
  notes?: string;
}

interface CreateNonClientAllocationResponse {
  allocation: NonClientAllocation;
  warnings?: string[];
}

/**
 * Create a new non-client allocation
 * Automatically calculates hours and sets 100% utilization
 */
export function useCreateNonClientAllocation(): UseMutationResult<
  CreateNonClientAllocationResponse,
  Error,
  CreateNonClientAllocationData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNonClientAllocationData) => {
      const response = await fetch('/api/non-client-allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create non-client allocation');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate employee's allocations
      queryClient.invalidateQueries({
        queryKey: [...nonClientAllocationKeys.all, 'employee', variables.employeeId]
      });
      
      // Invalidate all allocations list
      queryClient.invalidateQueries({
        queryKey: nonClientAllocationKeys.all
      });

      // Also invalidate task team allocations if they might be affected
      queryClient.invalidateQueries({
        queryKey: ['tasks', 'allocations']
      });

      // Invalidate service-line users query (this is what the planner uses)
      // Use more specific key to avoid refetching all service line data
      queryClient.invalidateQueries({
        queryKey: ['service-lines', 'users', 'allocations']
      });
    },
  });
}

interface UpdateNonClientAllocationData {
  id: number;
  eventType?: NonClientEventType;
  startDate?: string | Date;
  endDate?: string | Date;
  notes?: string;
}

/**
 * Update an existing non-client allocation
 * Recalculates hours if dates change (maintains 100% utilization)
 */
export function useUpdateNonClientAllocation(): UseMutationResult<
  NonClientAllocation,
  Error,
  UpdateNonClientAllocationData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateNonClientAllocationData) => {
      const { id, ...updateData } = data;
      
      const response = await fetch(`/api/non-client-allocations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update non-client allocation');
      }

      const result = await response.json();
      return result.data || result;
    },
    onSuccess: (allocation) => {
      // Invalidate employee's allocations
      queryClient.invalidateQueries({
        queryKey: [...nonClientAllocationKeys.all, 'employee', allocation.employeeId]
      });
      
      // Invalidate all allocations list
      queryClient.invalidateQueries({
        queryKey: nonClientAllocationKeys.all
      });

      // Also invalidate task team allocations
      queryClient.invalidateQueries({
        queryKey: ['tasks', 'allocations']
      });
    },
  });
}

/**
 * Delete a non-client allocation
 */
export function useDeleteNonClientAllocation(): UseMutationResult<
  void,
  Error,
  { id: number; employeeId: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number; employeeId: number }) => {
      const response = await fetch(`/api/non-client-allocations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete non-client allocation');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate employee's allocations
      queryClient.invalidateQueries({
        queryKey: [...nonClientAllocationKeys.all, 'employee', variables.employeeId]
      });
      
      // Invalidate all allocations list
      queryClient.invalidateQueries({
        queryKey: nonClientAllocationKeys.all
      });

      // Also invalidate task team allocations
      queryClient.invalidateQueries({
        queryKey: ['tasks', 'allocations']
      });

      // Invalidate service-line users query (this is what the planner uses)
      // Use more specific key to avoid refetching all service line data
      queryClient.invalidateQueries({
        queryKey: ['service-lines', 'users', 'allocations']
      });
    },
  });
}
