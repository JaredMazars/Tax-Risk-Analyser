/**
 * React Query hooks for acceptance questionnaire
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const acceptanceKeys = {
  all: ['acceptance'] as const,
  questionnaire: (taskId: string) => [...acceptanceKeys.all, 'questionnaire', taskId] as const,
  status: (taskId: string) => [...acceptanceKeys.all, 'status', taskId] as const,
  documents: (taskId: string) => [...acceptanceKeys.all, 'documents', taskId] as const,
};

/**
 * Initialize and fetch questionnaire
 * Optimized with reduced stale time and refetch strategies
 */
export function useQuestionnaire(taskId: string) {
  return useQuery({
    queryKey: acceptanceKeys.questionnaire(taskId),
    queryFn: async () => {
      // Guard: Never run if taskId is empty
      if (!taskId || taskId === '' || taskId === 'undefined') {
        throw new Error('Task ID is required');
      }

      const res = await fetch(`/api/tasks/${taskId}/acceptance/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to initialize questionnaire');
      }

      return res.json();
    },
    enabled: !!taskId && taskId !== '' && taskId !== 'undefined', // Only run when taskId is valid
    staleTime: 1000 * 60 * 2, // 2 minutes (reduced from 5)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch on network reconnect
  });
}

/**
 * Get questionnaire status
 * Optimized with shorter stale time
 */
export function useQuestionnaireStatus(taskId: string) {
  return useQuery({
    queryKey: acceptanceKeys.status(taskId),
    queryFn: async () => {
      // Guard: Never run if taskId is empty
      if (!taskId || taskId === '') {
        throw new Error('Task ID is required');
      }

      const res = await fetch(`/api/tasks/${taskId}/acceptance/status`);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch status');
      }

      return res.json();
    },
    enabled: !!taskId && taskId !== '' && taskId !== 'undefined', // Only run when taskId is valid
    retry: 2, // Limit retries to prevent infinite loading
    staleTime: 1000 * 15, // 15 seconds (reduced from 30)
    refetchInterval: false, // Disable polling to prevent background requests
    refetchOnWindowFocus: false, // Disable auto-refetch on focus
  });
}

/**
 * Save answers (autosave)
 * Optimized with better cache management and error rollback
 */
export function useSaveAnswers(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (answers: Array<{ questionKey: string; answer: string; comment?: string }>) => {
      const res = await fetch(`/api/tasks/${taskId}/acceptance/answers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || 'Failed to save answers');
      }

      return res.json();
    },
    onMutate: async (answers) => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: acceptanceKeys.questionnaire(taskId) });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(acceptanceKeys.questionnaire(taskId));

      // Return context with snapshot
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(acceptanceKeys.questionnaire(taskId), context.previousData);
      }
    },
    onSuccess: (data) => {
      // Update risk assessment without refetching (prevents state jumping)
      queryClient.setQueryData(acceptanceKeys.questionnaire(taskId), (oldData: unknown) => {
        if (
          !oldData ||
          typeof oldData !== 'object' ||
          !('data' in oldData) ||
          !oldData.data
        ) {
          return oldData;
        }
        return {
          ...oldData,
          data: {
            ...(oldData.data as Record<string, unknown>),
            riskAssessment: data.data?.riskAssessment,
          },
        };
      });
      
      // Only invalidate status (lightweight query)
      queryClient.invalidateQueries({ queryKey: acceptanceKeys.status(taskId) });
    },
  });
}

/**
 * Submit questionnaire for review
 */
export function useSubmitQuestionnaire(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/acceptance/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit questionnaire');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: acceptanceKeys.questionnaire(taskId) });
      queryClient.invalidateQueries({ queryKey: acceptanceKeys.status(taskId) });
    },
  });
}

/**
 * Get supporting documents
 */
export function useAcceptanceDocuments(taskId: string) {
  return useQuery({
    queryKey: acceptanceKeys.documents(taskId),
    queryFn: async () => {
      // Guard: Never run if taskId is empty
      if (!taskId || taskId === '' || taskId === 'undefined') {
        throw new Error('Task ID is required');
      }

      const res = await fetch(`/api/tasks/${taskId}/acceptance/documents`);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch documents');
      }

      return res.json();
    },
    enabled: !!taskId && taskId !== '' && taskId !== 'undefined', // Only run when taskId is valid
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Upload supporting document
 */
export function useUploadDocument(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const res = await fetch(`/api/tasks/${taskId}/acceptance/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: acceptanceKeys.documents(taskId) });
    },
  });
}

/**
 * Delete supporting document
 */
export function useDeleteDocument(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number) => {
      const res = await fetch(`/api/tasks/${taskId}/acceptance/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete document');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: acceptanceKeys.documents(taskId) });
    },
  });
}

