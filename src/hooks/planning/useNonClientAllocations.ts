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

interface MutationContext {
  serviceLine?: string;
  subServiceLineGroup?: string;
}

interface CreateNonClientAllocationData {
  employeeId: number;
  eventType: NonClientEventType;
  startDate: string | Date;
  endDate: string | Date;
  notes?: string;
  context?: MutationContext;
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
      const { context, ...requestData } = data;
      const response = await fetch('/api/non-client-allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create non-client allocation');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Rely on onAllocationUpdate() callback to handle refetching
      // No optimistic updates needed - the callback in AdminPlanningModal triggers proper refetch
      // This matches the pattern used for client allocations
    },
  });
}

interface UpdateNonClientAllocationData {
  id: number;
  eventType?: NonClientEventType;
  startDate?: string | Date;
  endDate?: string | Date;
  notes?: string;
  context?: MutationContext;
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
      const { id, context, ...updateData } = data;
      
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
    onSuccess: () => {
      // Rely on onAllocationUpdate() callback to handle refetching
      // This matches the pattern used for client allocations
    },
  });
}

/**
 * Delete a non-client allocation
 */
export function useDeleteNonClientAllocation(): UseMutationResult<
  void,
  Error,
  { id: number; employeeId: number; context?: MutationContext }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number; employeeId: number; context?: MutationContext }) => {
      const response = await fetch(`/api/non-client-allocations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete non-client allocation');
      }
    },
    onSuccess: () => {
      // Rely on onAllocationUpdate() callback to handle refetching
      // This matches the pattern used for client allocations
    },
  });
}
