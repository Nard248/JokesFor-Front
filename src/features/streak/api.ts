import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { streakApi } from '@/lib/api'

export const streakKeys = {
  all: ['streak'] as const,
  state: () => [...streakKeys.all, 'state'] as const,
}

/** GET /users/me/streak/ — current streak + 14-day rail. */
export function useStreak() {
  return useQuery({
    queryKey: streakKeys.state(),
    queryFn: () => streakApi.get().then((r) => r.data),
    staleTime: 1000 * 60, // 1 min — refetched on Today open
  })
}

/** POST /users/me/streak/freeze/ — manually use a freeze day. */
export function useFreezeStreak() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => streakApi.freeze().then((r) => r.data),
    onSuccess: (data) => queryClient.setQueryData(streakKeys.state(), data),
  })
}

/** POST /users/me/streak/freeze/remove/ — undo today's accidental freeze. */
export function useUnfreezeStreak() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => streakApi.unfreeze().then((r) => r.data),
    onSuccess: (data) => queryClient.setQueryData(streakKeys.state(), data),
  })
}
