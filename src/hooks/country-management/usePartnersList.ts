/**
 * React Query hook for fetching list of partners
 * 
 * Partners are employees with EmpCatCode in ['CARL', 'LOCAL', 'DIR']
 * Used for the partner filter dropdown in Country Management reports
 */

import { useQuery } from '@tanstack/react-query';

export interface Partner {
  empCode: string;
  empName: string;
}

export function usePartnersList() {
  return useQuery<Partner[]>({
    queryKey: ['country-management', 'partners'],
    queryFn: async () => {
      const response = await fetch('/api/country-management/reports/partners');
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch partners' }));
        throw new Error(error.error || 'Failed to fetch partners list');
      }
      
      const data = await response.json();
      return data.partners as Partner[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - partners list rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
