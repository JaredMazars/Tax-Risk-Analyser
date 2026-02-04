/**
 * React Query hook for fetching list of managers
 * 
 * Managers are active employees who have been assigned as task managers
 * Used for the manager filter dropdown in Country Management reports
 */

import { useQuery } from '@tanstack/react-query';

export interface Manager {
  empCode: string;
  empName: string;
}

export function useManagersList() {
  return useQuery<Manager[]>({
    queryKey: ['country-management', 'managers'],
    queryFn: async () => {
      const response = await fetch('/api/country-management/reports/managers');
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch managers' }));
        throw new Error(error.error || 'Failed to fetch managers list');
      }
      
      const data = await response.json();
      return data.managers as Manager[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - managers list rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
