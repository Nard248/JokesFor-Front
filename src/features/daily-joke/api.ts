import { useQuery } from '@tanstack/react-query'
import { dailyJokeApi } from '@/lib/api'

/**
 * Query key factory for daily jokes following TanStack Query patterns
 * @see https://tanstack.com/query/v5/docs/react/guides/query-keys
 */
export const dailyJokeKeys = {
  all: ['daily-joke'] as const,
  today: () => [...dailyJokeKeys.all, 'today'] as const,
  history: () => [...dailyJokeKeys.all, 'history'] as const,
}

/**
 * Hook to fetch today's daily joke
 * Works for both anonymous and authenticated users:
 * - Anonymous: Gets a random recommendation
 * - Authenticated: Gets personalized based on preferences
 *
 * Configured with long staleTime since the daily joke changes once per day
 */
export function useTodaysJoke() {
  return useQuery({
    queryKey: dailyJokeKeys.today(),
    queryFn: async () => {
      const response = await dailyJokeApi.getToday()
      return response.data
    },
    staleTime: 1000 * 60 * 60, // 1 hour - joke changes daily, not per request
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook to fetch daily joke history
 * Shows previously served daily jokes
 */
export function useDailyJokeHistory() {
  return useQuery({
    queryKey: dailyJokeKeys.history(),
    queryFn: async () => {
      const response = await dailyJokeApi.getHistory()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
