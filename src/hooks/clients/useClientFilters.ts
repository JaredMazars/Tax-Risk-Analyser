'use client';

import { useQuery } from '@tanstack/react-query';

// Query Keys
export const clientFilterKeys = {
  all: ['client-filters'] as const,
  list: (params?: Record<string, string | number | null | undefined>) => 
    [...clientFilterKeys.all, 'list', params] as const,
};

// Types
export interface ClientFilterOptions {
  industries: string[];
  groups: { code: string; name: string }[];
}

export interface UseClientFiltersParams {
  industrySearch?: string;
  groupSearch?: string;
  enabled?: boolean;
}

/**
 * Fetch client filter options (industries and groups)
 * Used to populate filter dropdowns independently from the main client list
 * Supports separate searches for industries and groups
 */
export function useClientFilters(params: UseClientFiltersParams = {}) {
  const {
    industrySearch = '',
    groupSearch = '',
    enabled = true,
  } = params;

  return useQuery<ClientFilterOptions>({
    queryKey: clientFilterKeys.list({ industrySearch, groupSearch }),
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useClientFilters.ts:38',message:'queryFn CALLED - starting fetch',data:{industrySearch,groupSearch},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D,E'})}).catch(()=>{});
      // #endregion
      
      const searchParams = new URLSearchParams();
      if (industrySearch) searchParams.set('industrySearch', industrySearch);
      if (groupSearch) searchParams.set('groupSearch', groupSearch);
      
      const url = `/api/clients/filters?${searchParams.toString()}`;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useClientFilters.ts:50',message:'About to call API',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch client filter options');
      
      const result = await response.json();
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useClientFilters.ts:59',message:'API response received',data:{success:result.success,hasData:!!result.data,groupsCount:result.data?.groups?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
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


