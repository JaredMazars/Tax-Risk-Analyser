/**
 * React Query hook for WIP Aging report
 * 
 * Fetches WIP aging data with 7 aging buckets using FIFO fee allocation.
 * Uses sp_WIPAgingByTask stored procedure.
 * 
 * Supports fiscal year and custom date range filtering (same as profitability).
 */

import { useQuery } from '@tanstack/react-query';
import type { WIPAgingReportData } from '@/types/reports';

export interface UseWIPAgingReportParams {
  fiscalYear?: number;        // If provided, show fiscal year view
  fiscalMonth?: string;       // If provided with fiscalYear, show as of that month end
  startDate?: string;         // For custom date range (ISO format)
  endDate?: string;           // For custom date range (ISO format)
  mode?: 'fiscal' | 'custom'; // View mode (defaults to 'fiscal')
  enabled?: boolean;
}

/**
 * Fetch WIP aging data (tasks with aging buckets) for the current user
 * 
 * Returns tasks filtered by employee category:
 * - CARL/Local/DIR: Tasks as Partner
 * - Others: Tasks as Manager
 */
export function useWIPAgingReport(params: UseWIPAgingReportParams = {}) {
  const { fiscalYear, fiscalMonth, startDate, endDate, mode = 'fiscal', enabled = true } = params;

  return useQuery<WIPAgingReportData>({
    queryKey: ['my-reports', 'wip-aging', mode, fiscalYear, fiscalMonth, startDate, endDate],
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
      
      const response = await fetch(`/api/my-reports/wip-aging?${queryParams}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch report' }));
        throw new Error(error.error || 'Failed to fetch WIP aging report');
      }
      
      const data = await response.json();
      return data.data as WIPAgingReportData;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
