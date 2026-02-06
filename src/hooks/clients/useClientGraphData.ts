'use client';

import { useQuery } from '@tanstack/react-query';

// Query Keys
export const clientGraphDataKeys = {
  all: ['client-graph-data'] as const,
  detail: (GSClientID: string) => [...clientGraphDataKeys.all, GSClientID, 'v2'] as const, // v2 = fixed downsampling
};

// Types
export interface DailyMetrics {
  date: string; // YYYY-MM-DD format
  production: number;
  adjustments: number;
  disbursements: number;
  billing: number;
  provisions: number;
  wipBalance: number;
}

export interface ServiceLineGraphData {
  dailyMetrics: DailyMetrics[];
  summary: {
    totalProduction: number;
    totalAdjustments: number;
    totalDisbursements: number;
    totalBilling: number;
    totalProvisions: number;
    currentWipBalance: number;
  };
}

export interface MasterServiceLineInfo {
  code: string;
  name: string;
}

export interface ClientGraphData {
  GSClientID: string;
  clientCode: string;
  clientName: string | null;
  startDate: string;
  endDate: string;
  overall: ServiceLineGraphData;
  byMasterServiceLine: Record<string, ServiceLineGraphData>;
  masterServiceLines: MasterServiceLineInfo[];
}

export interface UseClientGraphDataParams {
  enabled?: boolean;
  fiscalYear?: number;
  startDate?: string;
  endDate?: string;
  mode?: 'fiscal' | 'custom';
}

/**
 * Fetch daily transaction graph data for a client
 * Returns daily metrics (Production, Adjustments, Disbursements, Billing, Provisions, WIP Balance)
 * 
 * @param GSClientID - Client GUID
 * @param params - Query parameters including fiscal year filters
 * @param params.fiscalYear - Fiscal year (e.g., 2024). If not provided, shows current fiscal year.
 * @param params.startDate - Start date for custom range (ISO string)
 * @param params.endDate - End date for custom range (ISO string)
 * @param params.mode - Filter mode: 'fiscal' (default) or 'custom'
 */
export function useClientGraphData(
  GSClientID: string,
  params: UseClientGraphDataParams = {}
) {
  const { 
    enabled = true,
    fiscalYear,
    startDate,
    endDate,
    mode = 'fiscal'
  } = params;

  return useQuery<ClientGraphData>({
    queryKey: [...clientGraphDataKeys.detail(GSClientID), mode, fiscalYear, startDate, endDate],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set('mode', mode);
      
      if (mode === 'fiscal' && fiscalYear) {
        queryParams.set('fiscalYear', fiscalYear.toString());
      } else if (mode === 'custom' && startDate && endDate) {
        queryParams.set('startDate', startDate);
        queryParams.set('endDate', endDate);
      }
      
      const url = `/api/clients/${GSClientID}/analytics/graphs${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch client graph data');
      
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
