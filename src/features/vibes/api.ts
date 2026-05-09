import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vibesApi } from '@/lib/api'

export const vibesKeys = {
  all: ['vibes'] as const,
  catalog: () => [...vibesKeys.all, 'catalog'] as const,
  mine: () => [...vibesKeys.all, 'mine'] as const,
  one: (slug: string) => [...vibesKeys.all, 'one', slug] as const,
}

/** GET /vibes/ — 12-vibe catalog. Long stale time; effectively static. */
export function useVibesCatalog() {
  return useQuery({
    queryKey: vibesKeys.catalog(),
    queryFn: () => vibesApi.list().then((r) => r.data),
    staleTime: 1000 * 60 * 60 * 24, // 24 h
  })
}

/** GET /users/me/vibes/ — user's selected vibes. */
export function useMyVibes() {
  return useQuery({
    queryKey: vibesKeys.mine(),
    queryFn: () => vibesApi.myVibes().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

/** PUT /users/me/vibes/ — replace vibe selection (min 3, max 12). */
export function useUpdateMyVibes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slugs: string[]) => vibesApi.setMyVibes(slugs).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(vibesKeys.mine(), data)
    },
  })
}
