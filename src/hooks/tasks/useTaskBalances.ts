'use client';

import { useQuery } from '@tanstack/react-query';

// Query Keys
export const taskBalancesKeys = {
  all: ['task-balances'] as const,
  detail: (taskId: number) => [...taskBalancesKeys.all, taskId] as const,
};

// Types
export interface TaskBalances {
  taskId: number;
  GSTaskID: string;
  taskCode: string;
  taskDesc: string;
  grossWip: number;
  provision: number;
  netWip: number;
  lastUpdated: string | null;
}

export interface UseTaskBalancesParams {
  enabled?: boolean;
}

/**
 * Fetch WIP balances for a task
 * Returns balances calculated from WIPTransactions:
 * - grossWip: Sum of all amounts minus fees (excluding provision)
 * - provision: Sum of provision amounts
 * - netWip: Gross WIP plus provision
 */
export function useTaskBalances(
  taskId: number | undefined,
  params: UseTaskBalancesParams = {}
) {
  const { enabled = true } = params;

  return useQuery<TaskBalances>({
    queryKey: taskBalancesKeys.detail(taskId!),
    queryFn: async () => {
      const url = `/api/tasks/${taskId}/balances`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch task balances');
      
      const result = await response.json();
      return result.success ? result.data : result;
    },
    enabled: enabled && !!taskId,
    staleTime: 10 * 60 * 1000, // 10 minutes - aligned with business rules cache TTL
    gcTime: 15 * 60 * 1000, // 15 minutes cache retention
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}
