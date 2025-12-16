'use client';

import { useQuery } from '@tanstack/react-query';

// Query Keys
export const groupFilterKeys = {
  all: ['group-filters'] as const,
  list: (params?: Record<string, string | number | null | undefined>) => 
    [...groupFilterKeys.all, 'list', params] as const,
};

// Types
export interface GroupFilterOptions {
  groups: { code: string; name: string }[];
}

export interface UseGroupFiltersParams {
  search?: string;
  enabled?: boolean;
}

/**
 * Fetch group filter options
 * Used to populate group filter dropdowns independently from the main group list
 */
export function useGroupFilters(params: UseGroupFiltersParams = {}) {
  const {
    search = '',
    enabled = true,
  } = params;

  return useQuery<GroupFilterOptions>({
    queryKey: groupFilterKeys.list({ search }),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (search) searchParams.set('search', search);
      
      const url = `/api/groups/filters?${searchParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch group filter options');
      
      const result = await response.json();
      return result.success ? result.data : result;
    },
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes - filter options are relatively static
    gcTime: 45 * 60 * 1000, // 45 minutes cache retention
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });
}


