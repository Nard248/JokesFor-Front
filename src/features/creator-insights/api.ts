import { useQuery } from '@tanstack/react-query'
import { creatorInsightsApi, type InsightsPeriod } from '@/lib/api'

export const creatorInsightsKeys = {
  all: ['creator-insights'] as const,
  byPeriod: (period: InsightsPeriod) => [...creatorInsightsKeys.all, period] as const,
}

export function useCreatorInsights(period: InsightsPeriod = 'month') {
  return useQuery({
    queryKey: creatorInsightsKeys.byPeriod(period),
    queryFn: () => creatorInsightsApi.get(period).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 403 || status === 401) return false
      return failureCount < 2
    },
  })
}
