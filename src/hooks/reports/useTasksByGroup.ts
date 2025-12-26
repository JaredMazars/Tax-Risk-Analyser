/**
 * React Query hook for Tasks by Group report
 */

import { useQuery } from '@tanstack/react-query';
import type { TasksByGroupReport } from '@/types/api';

/**
 * Fetch tasks organized by client group for the current user
 * 
 * Returns tasks filtered by employee category:
 * - CARL/Local/DIR: Tasks as Partner
 * - Others: Tasks as Manager
 */
export function useTasksByGroup() {
  return useQuery<TasksByGroupReport>({
    queryKey: ['my-reports', 'tasks-by-group'],
    queryFn: async () => {
      const response = await fetch('/api/my-reports/tasks-by-group');
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch report' }));
        throw new Error(error.error || 'Failed to fetch tasks by group report');
      }
      
      const data = await response.json();
      return data.data as TasksByGroupReport;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
  });
}

