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
    staleTime: 30 * 1000, // 30 seconds - reduced from 15 minutes for fresher data
    gcTime: 5 * 60 * 1000, // 5 minutes cache retention
    refetchOnMount: true, // Refetch when component mounts (ensures fresh data on tab switches)
    refetchOnWindowFocus: false, // Keep disabled to prevent unnecessary refetches
    refetchOnReconnect: false,
    refetchInterval: false, // Disable automatic polling
    // Note: Query will automatically refetch when queryKey params change
  });
}

/**
 * Helper function to update task stage in cached data
 */
function updateTaskStageInCache(
  data: KanbanBoardData,
  taskId: number,
  newStage: TaskStage
): KanbanBoardData {
  // Create a deep copy of the data
  const updatedColumns = data.columns.map(column => {
    // Find and remove task from its current column
    const filteredTasks = column.tasks.filter(task => task.id !== taskId);
    
    // If this is the target column, add the task with updated stage
    if (column.stage === newStage) {
      const taskToMove = data.columns
        .flatMap(col => col.tasks)
        .find(task => task.id === taskId);
      
      if (taskToMove) {
        const newTasks = [...filteredTasks, { ...taskToMove, stage: newStage }];
        return {
          ...column,
          tasks: newTasks,
          taskCount: newTasks.length,
          metrics: {
            count: newTasks.length,
          },
        };
      }
    }
    
    // Update metrics for columns that lost a task
    if (filteredTasks.length !== column.tasks.length) {
      return {
        ...column,
        tasks: filteredTasks,
        taskCount: filteredTasks.length,
        metrics: {
          count: filteredTasks.length,
        },
      };
    }
    
    return column;
  });
  
  return {
    ...data,
    columns: updatedColumns,
  };
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
      const requestBody = { stage, notes };
      
      const response = await fetch(`/api/tasks/${taskId}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Stage update failed:', {
          taskId,
          stage,
          requestBody,
          error,
          statusCode: response.status
        });
        throw new Error(error.error || 'Failed to update task stage');
      }

      const result = await response.json();
      return result.success ? result.data : result;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to prevent optimistic update from being overwritten
      await queryClient.cancelQueries({ queryKey: kanbanKeys.boards() });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: kanbanKeys.boards() });
      
      // Optimistically update all kanban board caches
      queryClient.setQueriesData<KanbanBoardData>(
        { queryKey: kanbanKeys.boards() },
        (old) => {
          if (!old) return old;
          return updateTaskStageInCache(old, variables.taskId, variables.stage);
        }
      );
      
      // Return context with snapshot for rollback
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
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



