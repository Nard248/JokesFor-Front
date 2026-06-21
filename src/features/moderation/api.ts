import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { moderationAdapter } from '@/lib/api-adapter'
import type { BlockedUser, ContentReportInput } from '@/lib/api'

export const moderationKeys = {
  all: ['moderation'] as const,
  blocks: () => [...moderationKeys.all, 'blocks'] as const,
}

export function useReportJoke() {
  return useMutation({
    mutationFn: (data: ContentReportInput) => moderationAdapter.report(data),
  })
}

export function useMyBlocks() {
  return useQuery({
    queryKey: moderationKeys.blocks(),
    queryFn: () => moderationAdapter.myBlocks(),
    staleTime: 1000 * 60,
  })
}

export function useBlockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (user: BlockedUser) => moderationAdapter.block(user),
    onSuccess: () => {
      // Blocking changes feeds, follow state, and profiles — refetch broadly.
      queryClient.invalidateQueries({ queryKey: moderationKeys.blocks() })
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] })
      queryClient.invalidateQueries({ queryKey: ['jokes'] })
    },
  })
}

export function useUnblockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => moderationAdapter.unblock(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.blocks() })
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] })
    },
  })
}
