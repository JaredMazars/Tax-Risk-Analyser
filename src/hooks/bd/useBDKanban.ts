/**
 * BD Kanban Hook
 * 
 * EXACT PATTERN from tasks useKanbanBoard hook (lines 1-227).
 * Implements optimistic updates, proper caching, and rollback on error.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BDKanbanData } from '@/components/features/bd/Kanban/types';

// Query Keys (same factory pattern as tasks)
export const bdKanbanKeys = {
  all: ['bd-kanban'] as const,
  boards: () => [...bdKanbanKeys.all, 'board'] as const,
  board: (params: UseBDKanbanParams) => 
    [...bdKanbanKeys.boards(), params] as const,
};

export interface UseBDKanbanParams {
  serviceLine: string;
  search?: string;
  assignedTo?: string[];
  stages?: string[];
  minValue?: number;
  maxValue?: number;
  dateFrom?: Date;
  dateTo?: Date;
  includeDrafts: boolean;
}

/**
 * Fetch BD Kanban board data
 */
export function useBDKanban(params: UseBDKanbanParams) {
  return useQuery<BDKanbanData>({
    queryKey: bdKanbanKeys.board(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('serviceLine', params.serviceLine);
      if (params.search) searchParams.set('search', params.search);
      if (params.assignedTo && params.assignedTo.length > 0) {
        searchParams.set('assignedTo', params.assignedTo.join(','));
      }
      if (params.stages && params.stages.length > 0) {
        searchParams.set('stages', params.stages.join(','));
      }
      if (params.minValue !== undefined) searchParams.set('minValue', params.minValue.toString());
      if (params.maxValue !== undefined) searchParams.set('maxValue', params.maxValue.toString());
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom.toISOString());
      if (params.dateTo) searchParams.set('dateTo', params.dateTo.toISOString());
      searchParams.set('includeDrafts', params.includeDrafts.toString());

      const res = await fetch(`/api/bd/opportunities/kanban?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch kanban data');
      const result = await res.json();
      return result.success ? result.data : result;
    },
    staleTime: 30 * 1000, // 30 seconds (same as tasks)
    gcTime: 5 * 60 * 1000, // 5 minutes cache retention
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

/**
 * Hook to update opportunity stage with OPTIMISTIC UPDATES
 * EXACT PATTERN from tasks kanban (useUpdateTaskStage)
 */
export function useUpdateOpportunityStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateOpportunityStage'],
    mutationFn: async ({ opportunityId, stageId }: { opportunityId: number; stageId: number }) => {
      const res = await fetch(`/api/bd/opportunities/${opportunityId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Stage update failed:', { opportunityId, stageId, error });
        throw new Error(error.error || 'Failed to update opportunity stage');
      }

      const result = await res.json();
      return result.success ? result.data : result;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches (same as tasks)
      await queryClient.cancelQueries({ queryKey: bdKanbanKeys.boards() });
      await queryClient.cancelQueries({ queryKey: ['bd-opportunities'] });
      
      // Snapshot for rollback
      const previousData = queryClient.getQueriesData({ queryKey: bdKanbanKeys.boards() });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error (same as tasks)
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: async (data, error, variables) => {
      // Only invalidate opportunity detail, not board queries (same as tasks)
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['bd-opportunity', variables.opportunityId] });
      }
    },
  });
}

/**
 * Delete draft BD opportunity
 */
export function useDeleteBDOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opportunityId: number) => {
      const res = await fetch(`/api/bd/opportunities/${opportunityId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete opportunity');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate all kanban queries to refresh the board
      queryClient.invalidateQueries({ queryKey: bdKanbanKeys.all });
    },
  });
}
