import { useQuery } from '@tanstack/react-query'
import { insightsApi, type TastePeriod } from '@/lib/api'

export const insightsKeys = {
  all: ['insights'] as const,
  taste: (period: TastePeriod) => [...insightsKeys.all, 'taste', period] as const,
  todayAugmented: () => [...insightsKeys.all, 'today-augmented'] as const,
  tomorrow: () => [...insightsKeys.all, 'tomorrow'] as const,
}

/** GET /users/me/taste-profile/?period=… — derived analytics. */
export function useTasteProfile(period: TastePeriod = 'month') {
  return useQuery({
    queryKey: insightsKeys.taste(period),
    queryFn: () => insightsApi.tasteProfile(period).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

/** GET /daily-jokes/today/ — augmented with issue_label. */
export function useTodayAugmented() {
  return useQuery({
    queryKey: insightsKeys.todayAugmented(),
    queryFn: () => insightsApi.todayAugmented().then((r) => r.data),
    staleTime: 1000 * 60 * 60, // 1 hour — daily joke is idempotent for the day
  })
}

/** GET /daily-jokes/tomorrow/ — preview teaser; lazy-creates row inline. */
export function useTomorrowTeaser() {
  return useQuery({
    queryKey: insightsKeys.tomorrow(),
    queryFn: () => insightsApi.tomorrow().then((r) => r.data),
    staleTime: 1000 * 60 * 30,
    retry: false, // can 404 if backend hasn't generated yet
  })
}
