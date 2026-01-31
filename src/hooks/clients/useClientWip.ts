'use client';

import { useQuery } from '@tanstack/react-query';

// Query Keys
export const clientWipKeys = {
  all: ['client-wip'] as const,
  detail: (GSClientID: string) => [...clientWipKeys.all, GSClientID] as const,
};

// Types
export interface ProfitabilityMetrics {
  grossProduction: number;
  ltdAdjustment: number;
  netRevenue: number;
  adjustmentPercentage: number;
  ltdCost: number;
  grossProfit: number;
  grossProfitPercentage: number;
  averageChargeoutRate: number;
  averageRecoveryRate: number;
  balWIP: number;
  balTime: number;
  balDisb: number;
  wipProvision: number;
  ltdTime: number;
  ltdDisb: number;
  ltdAdj: number; // Merged adjustments
  ltdFee: number; // Merged fees
  ltdHours: number;
  taskCount: number;
  // Legacy fields for backwards compatibility
  ltdAdjTime: number;
  ltdAdjDisb: number;
  ltdFeeTime: number;
  ltdFeeDisb: number;
}

export interface MasterServiceLineInfo {
  code: string;
  name: string;
}

export interface ClientWipData {
  GSClientID: string;
  clientCode: string;
  clientName: string | null;
  overall: ProfitabilityMetrics;
  byMasterServiceLine: Record<string, ProfitabilityMetrics>;
  masterServiceLines: MasterServiceLineInfo[];
  taskCount: number;
  lastUpdated: string | null;
}

export interface UseClientWipParams {
  enabled?: boolean;
  fiscalYear?: number;
  fiscalMonth?: string;
  startDate?: string;
  endDate?: string;
  mode?: 'fiscal' | 'custom';
}

/**
 * Fetch Work in Progress data for a client
 * Returns aggregated WIP balances across all client tasks
 * 
 * @param GSClientID - Client GUID
 * @param params - Query parameters including fiscal year filters
 * @param params.fiscalYear - Fiscal year (e.g., 2024). Defaults to current FY if not provided.
 * @param params.fiscalMonth - Optional fiscal month name for cumulative through month (e.g., 'November')
 * @param params.startDate - Start date for custom range (ISO string)
 * @param params.endDate - End date for custom range (ISO string)
 * @param params.mode - Filter mode: 'fiscal' (default) or 'custom'
 */
export function useClientWip(
  GSClientID: string,
  params: UseClientWipParams = {}
) {
  const { 
    enabled = true, 
    fiscalYear, 
    fiscalMonth,
    startDate, 
    endDate, 
    mode = 'fiscal' 
  } = params;

  return useQuery<ClientWipData>({
    queryKey: [...clientWipKeys.detail(GSClientID), mode, fiscalYear, fiscalMonth, startDate, endDate],
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
      
      const url = `/api/clients/${GSClientID}/wip${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch client WIP data');
      
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


