/**
 * React Query hook for Country Management Profitability report
 * 
 * Business-wide profitability data with optional partner/manager filtering
 */

import { useQuery } from '@tanstack/react-query';
import type { ProfitabilityReportData } from '@/types/api';

export interface UseCountryManagementProfitabilityParams {
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
 * Fetch business-wide profitability data for Country Management reports
 * 
 * Unlike My Reports, this endpoint returns all tasks business-wide
 * with optional filtering by partner and/or manager codes.
 */
export function useCountryManagementProfitability(params: UseCountryManagementProfitabilityParams = {}) {
  const { 
    fiscalYear, 
    fiscalMonth, 
    startDate, 
    endDate, 
    mode = 'fiscal', 
    partnerCodes,
    managerCodes,
    enabled = true 
  } = params;

  return useQuery<ProfitabilityReportData>({
    queryKey: ['country-management', 'profitability', mode, fiscalYear, fiscalMonth, startDate, endDate, partnerCodes, managerCodes],
    queryFn: async () => {
      // Build query parameters
      const queryParams = new URLSearchParams();
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
      
      const response = await fetch(`/api/country-management/reports/profitability?${queryParams}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch report' }));
        throw new Error(error.error || 'Failed to fetch profitability report');
      }
      
      const data = await response.json();
      return data.data as ProfitabilityReportData;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
