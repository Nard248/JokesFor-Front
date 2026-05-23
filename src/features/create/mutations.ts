import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contentAdapter } from './adapter'
import { createKeys } from './queries'
import type { ContentDraft, FormatSlug } from './types'

export function useCreateDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (format: FormatSlug) => contentAdapter.createDraft(format),
    onSuccess: (draft) => {
      // Pre-populate the detail cache so navigating to the editor is instant
      queryClient.setQueryData<ContentDraft>(createKeys.drafts.detail(draft.id), draft)
      // Refresh the list so the new draft appears
      queryClient.invalidateQueries({ queryKey: createKeys.drafts.list })
    },
  })
}

export function usePatchDraft(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<ContentDraft>) => contentAdapter.patchDraft(id, patch),
    onMutate: async (patch) => {
      // Cancel any in-flight refetch so it doesn't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: createKeys.drafts.detail(id) })
      // Snapshot the previous value for rollback
      const previous = queryClient.getQueryData<ContentDraft>(createKeys.drafts.detail(id))
      // Optimistically merge the patch into the cache
      if (previous) {
        queryClient.setQueryData<ContentDraft>(createKeys.drafts.detail(id), {
          ...previous,
          ...patch,
        })
      }
      return { previous }
    },
    onError: (_err, _patch, context) => {
      // Roll back to the snapshot on error
      if (context?.previous) {
        queryClient.setQueryData<ContentDraft>(createKeys.drafts.detail(id), context.previous)
      }
    },
    onSettled: () => {
      // Always re-sync from the server after settle
      queryClient.invalidateQueries({ queryKey: createKeys.drafts.detail(id) })
    },
  })
}

export function useSubmitDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => contentAdapter.submitDraft(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: createKeys.drafts.list })
      queryClient.invalidateQueries({ queryKey: createKeys.drafts.detail(id) })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useDeleteDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => contentAdapter.deleteDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createKeys.drafts.list })
    },
  })
}
