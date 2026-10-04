import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { useAuth } from '@/features/auth'
import type {
  Community,
  CommunityDetail,
  CommunityDirectory,
  CreatorCommunityReach,
} from './types'

/** Every community read is keyed by the signed-in account, so personal
 *  affinity never leaks across a logout/login in the same tab. */
export const communityKeys = {
  all: ['communities'] as const,
  directory: (account: number | string | null) => ['communities', 'directory', account] as const,
  detail: (slug: string, account: number | string | null) => ['communities', 'detail', slug, account] as const,
  creatorReach: (account: number | string | null) => ['communities', 'creator-reach', account] as const,
}

export const communitiesApi = {
  directory: () => api.get<CommunityDirectory>('/communities/').then((r) => r.data),
  detail: (slug: string) => api.get<CommunityDetail>(`/communities/${encodeURIComponent(slug)}/`).then((r) => r.data),
  membership: (slug: string, action: 'join' | 'leave') =>
    api.post<Community>(`/communities/${encodeURIComponent(slug)}/membership/`, { action }).then((r) => r.data),
  creatorReach: () => api.get<CreatorCommunityReach>('/creators/me/communities/').then((r) => r.data),
}

function useAccountKey() {
  const { user, isAuthenticated } = useAuth()
  return isAuthenticated ? (user?.pk ?? 'me') : null
}

export function useCommunityDirectory() {
  const account = useAccountKey()
  return useQuery({
    queryKey: communityKeys.directory(account),
    queryFn: communitiesApi.directory,
    staleTime: 30_000,
  })
}

export function useCommunityDetail(slug: string | undefined) {
  const account = useAccountKey()
  return useQuery({
    queryKey: communityKeys.detail(slug ?? '', account),
    queryFn: () => communitiesApi.detail(slug as string),
    enabled: !!slug,
    staleTime: 30_000,
  })
}

export function useCommunityMembership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, action }: { slug: string; action: 'join' | 'leave' }) =>
      communitiesApi.membership(slug, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: communityKeys.all }),
  })
}

export function useCreatorCommunityReach(enabled = true) {
  const account = useAccountKey()
  return useQuery({
    queryKey: communityKeys.creatorReach(account),
    queryFn: communitiesApi.creatorReach,
    enabled: enabled && account !== null,
    retry: false,
  })
}

/** Community aggregates refresh server-side at most every few seconds, so a
 *  signal (laugh, save) refreshes community queries now and once more shortly
 *  after — enough for a community that just formed to show it. */
export function refreshCommunitiesAfterSignal(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: communityKeys.all })
  setTimeout(() => queryClient.invalidateQueries({ queryKey: communityKeys.all }), 6000)
}
