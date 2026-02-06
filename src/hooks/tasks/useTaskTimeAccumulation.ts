'use client';

import { useQuery } from '@tanstack/react-query';
import type { TaskTimeAccumulationData } from '@/types/analytics';

// Query Keys
export const taskTimeAccumulationKeys = {
  all: ['task-time-accumulation'] as const,
  detail: (taskId: number) => [...taskTimeAccumulationKeys.all, taskId] as const,
};

export interface UseTaskTimeAccumulationParams {
  enabled?: boolean;
}

/**
 * Fetch time accumulation data for a task
 * Returns cumulative time vs budget for overall task and by employee
 * Data covers the full task lifetime from TaskDateOpen to now
 */
export function useTaskTimeAccumulation(
  taskId: number,
  params: UseTaskTimeAccumulationParams = {}
) {
  const { enabled = true } = params;

  return useQuery<TaskTimeAccumulationData>({
    queryKey: taskTimeAccumulationKeys.detail(taskId),
    queryFn: async () => {
      const url = `/api/tasks/${taskId}/analytics/time-accumulation`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch time accumulation data');
      
      const result = await response.json();
      return result.success ? result.data : result;
    },
    enabled: enabled && !!taskId && taskId > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes - extended for analytics performance
    gcTime: 60 * 60 * 1000, // 60 minutes cache retention
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}
