/**
 * React Query hook for Country Management Profitability Summary report
 * 
 * Pre-aggregated profitability data by partner or manager for fast dashboard loading
 */

import { useQuery } from '@tanstack/react-query';
import type { ProfitabilitySummaryResult } from '@/types/reports';

export interface ProfitabilitySummaryResponse {
  data: ProfitabilitySummaryResult[];
  aggregateBy: 'partner' | 'manager';
  fiscalYear?: number;
  fiscalMonth?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  totalRows: number;
}

export interface UseCountryManagementProfitabilitySummaryParams {
  aggregateBy: 'partner' | 'manager';
  fiscalYear?: number;
  fiscalMonth?: string;
  startDate?: string;
  endDate?: string;
  mode?: 'fiscal' | 'custom';
  partnerCodes?: string[];
  managerCodes?: string[];
  enabled?: boolean;
}

/**
 * Fetch pre-aggregated profitability summary by partner or manager
 * 
 * Returns ~50-300 rows instead of 16K+ tasks for fast dashboard loading
 */
export function useCountryManagementProfitabilitySummary(params: UseCountryManagementProfitabilitySummaryParams) {
  const { 
    aggregateBy,
    fiscalYear, 
    fiscalMonth, 
    startDate, 
    endDate, 
    mode = 'fiscal', 
    partnerCodes,
    managerCodes,
    enabled = true 
  } = params;

  return useQuery<ProfitabilitySummaryResponse>({
    queryKey: [
      'country-management', 
      'profitability-summary', 
      aggregateBy,
      mode, 
      fiscalYear, 
      fiscalMonth, 
      startDate, 
      endDate, 
      partnerCodes, 
      managerCodes
    ],
    queryFn: async () => {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('aggregateBy', aggregateBy);
      queryParams.set('mode', mode);
      
      if (mode === 'fiscal' && fiscalYear) {
        queryParams.set('fiscalYear', fiscalYear.toString());
        if (fiscalMonth) {
          queryParams.set('fiscalMonth', fiscalMonth);
        }
      } else if (mode === 'custom' && startDate && endDate) {
        queryParams.set('startDate', startDate);
        queryParams.set('endDate', endDate);
      }
      
      // Add partner filter if specified
      if (partnerCodes && partnerCodes.length > 0) {
        queryParams.set('partnerCodes', partnerCodes.join(','));
      }
      
      // Add manager filter if specified
      if (managerCodes && managerCodes.length > 0) {
        queryParams.set('managerCodes', managerCodes.join(','));
      }
      
      const response = await fetch(`/api/country-management/reports/profitability/summary?${queryParams}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch summary' }));
        throw new Error(error.error || 'Failed to fetch profitability summary');
      }
      
      const data = await response.json();
      return data.data as ProfitabilitySummaryResponse;
    },
    enabled: enabled && !!aggregateBy,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
