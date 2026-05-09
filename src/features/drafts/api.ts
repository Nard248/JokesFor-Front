import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { draftsAdapter } from '@/lib/api-adapter'
import type { DraftJoke } from '@/lib/mock-data'

export const draftKeys = {
  all: ['drafts'] as const,
  list: () => [...draftKeys.all, 'list'] as const,
}

export function useDrafts() {
  return useQuery({
    queryKey: draftKeys.list(),
    queryFn: () => draftsAdapter.list(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<DraftJoke>) => draftsAdapter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.all })
    },
  })
}

export function useUpdateDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DraftJoke> }) => draftsAdapter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.all })
    },
  })
}

export function useSubmitDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => draftsAdapter.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.all })
      // Publishing a draft affects profile activity
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useDeleteDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => draftsAdapter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.all })
    },
  })
}
