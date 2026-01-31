'use client';

import { useQuery } from '@tanstack/react-query';
import { AgingBuckets, DebtorMetrics } from '@/lib/services/analytics/debtorAggregation';

// Query Keys
export const clientDebtorsKeys = {
  all: ['client-debtors'] as const,
  detail: (GSClientID: string) => [...clientDebtorsKeys.all, GSClientID] as const,
};

// Types
export interface MasterServiceLineInfo {
  code: string;
  name: string;
}

export interface ClientDebtorData {
  GSClientID: string;
  clientCode: string;
  clientName: string | null;
  overall: DebtorMetrics;
  byMasterServiceLine: Record<string, DebtorMetrics>;
  masterServiceLines: MasterServiceLineInfo[];
  transactionCount: number;
  lastUpdated: string | null;
}

export interface UseClientDebtorsParams {
  enabled?: boolean;
  fiscalYear?: number;
  fiscalMonth?: string;
  startDate?: string;
  endDate?: string;
  mode?: 'fiscal' | 'custom';
}

// Re-export types for convenience
export type { AgingBuckets, DebtorMetrics };

/**
 * Fetch debtor data for a client
 * Returns aggregated debtor balances, aging analysis, and payment metrics
 * 
 * @param GSClientID - Client GUID
 * @param params - Query parameters including fiscal year filters
 * @param params.fiscalYear - Fiscal year (e.g., 2024). Defaults to current FY if not provided.
 * @param params.fiscalMonth - Optional fiscal month name for cumulative through month (e.g., 'November')
 * @param params.startDate - Start date for custom range (ISO string)
 * @param params.endDate - End date for custom range (ISO string)
 * @param params.mode - Filter mode: 'fiscal' (default) or 'custom'
 */
export function useClientDebtors(
  GSClientID: string,
  params: UseClientDebtorsParams = {}
) {
  const { 
    enabled = true, 
    fiscalYear, 
    fiscalMonth,
    startDate, 
    endDate, 
    mode = 'fiscal' 
  } = params;

  return useQuery<ClientDebtorData>({
    queryKey: [...clientDebtorsKeys.detail(GSClientID), mode, fiscalYear, fiscalMonth, startDate, endDate],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set('mode', mode);
      
      if (mode === 'fiscal' && fiscalYear) {
        queryParams.set('fiscalYear', fiscalYear.toString());
        if (fiscalMonth) queryParams.set('fiscalMonth', fiscalMonth);
      } else if (mode === 'custom' && startDate && endDate) {
        queryParams.set('startDate', startDate);
        queryParams.set('endDate', endDate);
      }
      
      const url = `/api/clients/${GSClientID}/debtors${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch client debtor data');
      
      const result = await response.json();
      return result.success ? result.data : result;
    },
    enabled: enabled && !!GSClientID,
    staleTime: 30 * 60 * 1000, // 30 minutes - extended for analytics performance
    gcTime: 60 * 60 * 1000, // 60 minutes cache retention
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

