import { useAuthStore } from '@/features/auth/store'
import { useQuery } from '@tanstack/react-query'
import type { InsightsPeriod } from '@/lib/api'
import { creatorInsightsAdapter } from '@/lib/api-adapter'

export const creatorInsightsKeys = {
  all: ['creator-insights'] as const,
  byPeriod: (period: InsightsPeriod, owner?: number) => [...creatorInsightsKeys.all, owner, period] as const,
}

export function useCreatorInsights(period: InsightsPeriod = 'month') {
  const owner = useAuthStore((state) => state.isAuthenticated ? state.user?.pk : undefined)
  return useQuery({
    queryKey: creatorInsightsKeys.byPeriod(period, owner),
    enabled: owner !== undefined,
    queryFn: () => creatorInsightsAdapter.get(period),
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 403 || status === 401) return false
      return failureCount < 2
    },
  })
}
