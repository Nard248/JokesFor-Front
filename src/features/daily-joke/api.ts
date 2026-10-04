import { useContentSelection } from '@/features/discovery/context'
import { selectionParams, type ContentSelection } from '@/features/discovery/selection'
import { useQuery } from '@tanstack/react-query'
import { dailyJokeAdapter } from '@/lib/api-adapter'

export const dailyJokeKeys = {
  all: ['daily-joke'] as const,
  today: (params?: Partial<ContentSelection>) => [...dailyJokeKeys.all, 'today', params] as const,
  history: (params?: Partial<ContentSelection>) => [...dailyJokeKeys.all, 'history', params] as const,
}

export function useTodaysJoke() {
  const params = selectionParams(useContentSelection())
  return useQuery({
    queryKey: dailyJokeKeys.today(params),
    queryFn: () => dailyJokeAdapter.getToday(params),
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  })
}

export function useDailyJokeHistory() {
  const params = selectionParams(useContentSelection())
  return useQuery({
    queryKey: dailyJokeKeys.history(params),
    queryFn: () => dailyJokeAdapter.getHistory(params),
    staleTime: 1000 * 60 * 5,
  })
}
