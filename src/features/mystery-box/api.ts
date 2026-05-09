import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mysteryBoxApi } from '@/lib/api'

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

/** POST /mystery-box/roll/ — get a random joke. 429 on cap reached. */
export function useRollMysteryBox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => mysteryBoxApi.roll().then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(mysteryBoxKeys.status(), {
        rolls_used_today: 3 - data.rolls_remaining_today,
        rolls_remaining_today: data.rolls_remaining_today,
        max_per_day: 3,
      })
    },
  })
}
