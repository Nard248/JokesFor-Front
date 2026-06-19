import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { followsAdapter, creatorProfileAdapter } from '@/lib/api-adapter'
import type { CreatorProfile, FollowStatus } from '@/lib/api'

export const followKeys = {
  all: ['follows'] as const,
  profile: (id: number) => ['creator-profile', id] as const,
  status: (id: number) => [...followKeys.all, 'status', id] as const,
}

export function useCreatorProfile(id: number) {
  return useQuery({
    queryKey: followKeys.profile(id),
    queryFn: () => creatorProfileAdapter.get(id),
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404) return false
      return failureCount < 2
    },
  })
}

export function useFollowStatus(id: number, enabled = true) {
  return useQuery({
    queryKey: followKeys.status(id),
    queryFn: () => followsAdapter.status(id),
    staleTime: 1000 * 60,
    enabled,
  })
}

export function useFollow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => followsAdapter.follow(id),
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: followKeys.profile(id) })
      await qc.cancelQueries({ queryKey: followKeys.status(id) })
      const prevProfile = qc.getQueryData<CreatorProfile>(followKeys.profile(id))
      const prevStatus = qc.getQueryData<FollowStatus>(followKeys.status(id))
      // Optimistic update
      if (prevProfile) {
        qc.setQueryData<CreatorProfile>(followKeys.profile(id), {
          ...prevProfile,
          is_following: true,
          follower_count: prevProfile.follower_count + 1,
        })
      }
      if (prevStatus) {
        qc.setQueryData<FollowStatus>(followKeys.status(id), {
          is_following: true,
          follower_count: prevStatus.follower_count + 1,
        })
      }
      return { prevProfile, prevStatus }
    },
    onError: (_err, id, context) => {
      if (context?.prevProfile) qc.setQueryData(followKeys.profile(id), context.prevProfile)
      if (context?.prevStatus) qc.setQueryData(followKeys.status(id), context.prevStatus)
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: followKeys.profile(id) })
      qc.invalidateQueries({ queryKey: followKeys.status(id) })
    },
  })
}

export function useUnfollow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => followsAdapter.unfollow(id),
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: followKeys.profile(id) })
      await qc.cancelQueries({ queryKey: followKeys.status(id) })
      const prevProfile = qc.getQueryData<CreatorProfile>(followKeys.profile(id))
      const prevStatus = qc.getQueryData<FollowStatus>(followKeys.status(id))
      if (prevProfile) {
        qc.setQueryData<CreatorProfile>(followKeys.profile(id), {
          ...prevProfile,
          is_following: false,
          follower_count: Math.max(0, prevProfile.follower_count - 1),
        })
      }
      if (prevStatus) {
        qc.setQueryData<FollowStatus>(followKeys.status(id), {
          is_following: false,
          follower_count: Math.max(0, prevStatus.follower_count - 1),
        })
      }
      return { prevProfile, prevStatus }
    },
    onError: (_err, id, context) => {
      if (context?.prevProfile) qc.setQueryData(followKeys.profile(id), context.prevProfile)
      if (context?.prevStatus) qc.setQueryData(followKeys.status(id), context.prevStatus)
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: followKeys.profile(id) })
      qc.invalidateQueries({ queryKey: followKeys.status(id) })
    },
  })
}
