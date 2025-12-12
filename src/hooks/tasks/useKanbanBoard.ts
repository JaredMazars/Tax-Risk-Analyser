'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanBoardData } from '@/components/features/tasks/Kanban/types';
import { TaskStage } from '@/types/task-stages';

// Query Keys
export const kanbanKeys = {
  all: ['kanban'] as const,
  boards: () => [...kanbanKeys.all, 'board'] as const,
  board: (params: UseKanbanBoardParams) => 
    [...kanbanKeys.boards(), params] as const,
};

export interface UseKanbanBoardParams {
  serviceLine: string;
  subServiceLineGroup: string;
  myTasksOnly?: boolean;
  search?: string;
  teamMember?: string | null;
  includeArchived?: boolean;
}

/**
 * Fetch Kanban board data with tasks grouped by stage
 */
export function useKanbanBoard(params: UseKanbanBoardParams) {
  const {
    serviceLine,
    subServiceLineGroup,
    myTasksOnly = false,
    search = '',
    teamMember = null,
    includeArchived = false,
  } = params;

  return useQuery<KanbanBoardData>({
    queryKey: kanbanKeys.board({
      serviceLine,
      subServiceLineGroup,
      myTasksOnly,
      search,
      teamMember,
      includeArchived,
    }),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('serviceLine', serviceLine);
      searchParams.set('subServiceLineGroup', subServiceLineGroup);
      if (myTasksOnly) searchParams.set('myTasksOnly', 'true');
      if (search) searchParams.set('search', search);
      if (teamMember) searchParams.set('teamMember', teamMember);
      // Always include the includeArchived parameter to ensure proper cache invalidation
      searchParams.set('includeArchived', includeArchived ? 'true' : 'false');
      
      const url = `/api/tasks/kanban?${searchParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Kanban board data');
      }
      
      const result = await response.json();
      return result.success ? result.data : result;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - increased for better performance
    gcTime: 20 * 60 * 1000, // 20 minutes cache retention - increased from 15
    refetchOnMount: false,
    refetchOnWindowFocus: false, // Disabled to prevent unnecessary refetches
    refetchOnReconnect: false,
    refetchInterval: false, // Disable automatic polling
    // Note: Query will automatically refetch when queryKey params change
  });
}

/**
 * Hook to update a task's stage
 */
export function useUpdateTaskStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, stage, notes }: { 
      taskId: number; 
      stage: TaskStage;
      notes?: string;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage, notes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task stage');
      }

      const result = await response.json();
      return result.success ? result.data : result;
    },
    onSuccess: (data, variables) => {
      // Invalidate all Kanban board queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: kanbanKeys.boards() });
      
      // Invalidate task list queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Invalidate specific task detail
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
    },
  });
}



