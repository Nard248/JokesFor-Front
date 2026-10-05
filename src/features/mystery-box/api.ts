import { useContentSelection } from '@/features/discovery/context'
import { selectionParams } from '@/features/discovery/selection'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mysteryBoxApi, type MysteryBoxStatus } from '@/lib/api'

export const mysteryBoxKeys = {
  all: ['mystery-box'] as const,
  status: () => [...mysteryBoxKeys.all, 'status'] as const,
}

/** GET /mystery-box/status/ — rolls remaining, max per day. */
export function useMysteryBoxStatus() {
  return useQuery({
    queryKey: mysteryBoxKeys.status(),
    queryFn: () => mysteryBoxApi.status().then((r) => r.data),
    staleTime: 1000 * 60,
  })
}

/** POST /mystery-box/roll/ — get a random eligible joke. Ordinary abuse throttles still apply. */
export function useRollMysteryBox() {
  const params = selectionParams(useContentSelection())
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => mysteryBoxApi.roll(params).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData<MysteryBoxStatus>(mysteryBoxKeys.status(), (previous) => ({
        rolls_used_today: (previous?.rolls_used_today ?? 0) + 1,
        rolls_remaining_today: data.rolls_remaining_today,
        max_per_day: data.rolls_remaining_today === null ? null : previous?.max_per_day ?? null,
      }))
      void queryClient.invalidateQueries({ queryKey: mysteryBoxKeys.status() })
    },
  })
}
