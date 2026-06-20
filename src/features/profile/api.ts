import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileAdapter, accountIdentityAdapter } from '@/lib/api-adapter'
import type { UserProfile } from '@/lib/mock-data'

export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
  identity: () => [...profileKeys.all, 'identity'] as const,
  activity: () => [...profileKeys.all, 'activity'] as const,
  achievements: () => [...profileKeys.all, 'achievements'] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => profileAdapter.get(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => profileAdapter.update(data),
    onSuccess: (updatedProfile) => {
      // Optimistic: set the profile cache directly instead of refetching
      queryClient.setQueryData(profileKeys.me(), updatedProfile)
    },
  })
}

export function usePublicIdentity() {
  return useQuery({
    queryKey: profileKeys.identity(),
    queryFn: () => accountIdentityAdapter.get(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateIdentity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { display_name?: string; handle?: string | null }) =>
      accountIdentityAdapter.update(data),
    onSuccess: (identity) => {
      queryClient.setQueryData(profileKeys.identity(), identity)
    },
  })
}

export function useActivity(limit?: number) {
  return useQuery({
    queryKey: profileKeys.activity(),
    queryFn: () => profileAdapter.getActivity(limit),
    staleTime: 1000 * 60 * 2,
  })
}

export function useAchievements() {
  return useQuery({
    queryKey: profileKeys.achievements(),
    queryFn: () => profileAdapter.getAchievements(),
    staleTime: 1000 * 60 * 10,
  })
}
