import { useQuery } from '@tanstack/react-query'
import { dailyJokeAdapter } from '@/lib/api-adapter'

export const dailyJokeKeys = {
  all: ['daily-joke'] as const,
  today: () => [...dailyJokeKeys.all, 'today'] as const,
  history: () => [...dailyJokeKeys.all, 'history'] as const,
}

export function useTodaysJoke() {
  return useQuery({
    queryKey: dailyJokeKeys.today(),
    queryFn: () => dailyJokeAdapter.getToday(),
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  })
}

export function useDailyJokeHistory() {
  return useQuery({
    queryKey: dailyJokeKeys.history(),
    queryFn: () => dailyJokeAdapter.getHistory(),
    staleTime: 1000 * 60 * 5,
  })
}
