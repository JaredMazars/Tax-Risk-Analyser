/**
 * React Query hook for Country Management WIP Aging Summary report
 * 
 * Pre-aggregated WIP aging data by partner or manager for fast dashboard loading
 */

import { useQuery } from '@tanstack/react-query';
import type { WIPAgingSummaryResult } from '@/types/reports';

export interface WIPAgingSummaryResponse {
  data: WIPAgingSummaryResult[];
  aggregateBy: 'partner' | 'manager';
  asOfDate: string;
  totalRows: number;
  totals: {
    taskCount: number;
    clientCount: number;
    curr: number;
    bal30: number;
    bal60: number;
    bal90: number;
    bal120: number;
    bal150: number;
    bal180: number;
    grossWIP: number;
    balWIP: number;
    nettWIP: number;
  };
}

export interface UseCountryManagementWIPAgingSummaryParams {
  aggregateBy: 'partner' | 'manager';
  asOfDate?: string;
  servLineCode?: string;
  partnerCodes?: string[];
  managerCodes?: string[];
  enabled?: boolean;
}

/**
 * Fetch pre-aggregated WIP aging summary by partner or manager
 * 
 * Returns ~50-300 rows instead of 16K+ tasks for fast dashboard loading
 */
export function useCountryManagementWIPAgingSummary(params: UseCountryManagementWIPAgingSummaryParams) {
  const { 
    aggregateBy,
    asOfDate,
    servLineCode,
    partnerCodes,
    managerCodes,
    enabled = true 
  } = params;

  return useQuery<WIPAgingSummaryResponse>({
    queryKey: [
      'country-management', 
      'wip-aging-summary', 
      aggregateBy,
      asOfDate,
      servLineCode,
      partnerCodes, 
      managerCodes
    ],
    queryFn: async () => {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('aggregateBy', aggregateBy);
      
      if (asOfDate) {
        queryParams.set('asOfDate', asOfDate);
      }
      
      if (servLineCode) {
        queryParams.set('servLineCode', servLineCode);
      }
      
      // Add partner filter if specified
      if (partnerCodes && partnerCodes.length > 0) {
        queryParams.set('partnerCodes', partnerCodes.join(','));
      }
      
      // Add manager filter if specified
      if (managerCodes && managerCodes.length > 0) {
        queryParams.set('managerCodes', managerCodes.join(','));
      }
      
      const response = await fetch(`/api/country-management/reports/wip-aging/summary?${queryParams}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch summary' }));
        throw new Error(error.error || 'Failed to fetch WIP aging summary');
      }
      
      const data = await response.json();
      return data.data as WIPAgingSummaryResponse;
    },
    enabled: enabled && !!aggregateBy,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
