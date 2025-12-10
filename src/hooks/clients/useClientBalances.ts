'use client';

import { useQuery } from '@tanstack/react-query';

// Query Keys
export const clientBalancesKeys = {
  all: ['client-balances'] as const,
  detail: (GSClientID: string) => [...clientBalancesKeys.all, GSClientID] as const,
};

// Types
export interface ClientBalances {
  GSClientID: string;
  clientCode: string;
  clientName: string | null;
  wipBalance: number;
  debtorBalance: number;
  lastUpdated: string | null;
}

export interface UseClientBalancesParams {
  enabled?: boolean;
}

/**
 * Fetch WIP and Debtor balances for a client
 * Returns balances calculated from transaction tables:
 * - wipBalance: Sum of Amount from WIPTransactions
 * - debtorBalance: Sum of Total from DrsTransactions
 */
export function useClientBalances(
  GSClientID: string,
  params: UseClientBalancesParams = {}
) {
  const { enabled = true } = params;

  return useQuery<ClientBalances>({
    queryKey: clientBalancesKeys.detail(GSClientID),
    queryFn: async () => {
      const url = `/api/clients/${GSClientID}/balances`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch client balances');
      
      const result = await response.json();
      return result.success ? result.data : result;
    },
    enabled: enabled && !!GSClientID,
    staleTime: 10 * 60 * 1000, // 10 minutes - aligned with business rules cache TTL
    gcTime: 15 * 60 * 1000, // 15 minutes cache retention
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

