import { useContentSelection } from '@/features/discovery/context'
import { selectionParams, type ContentSelection } from '@/features/discovery/selection'
import { useQuery } from '@tanstack/react-query'
import { insightsApi, type TastePeriod } from '@/lib/api'

export const insightsKeys = {
  all: ['insights'] as const,
  taste: (period: TastePeriod) => [...insightsKeys.all, 'taste', period] as const,
  todayAugmented: (params?: Partial<ContentSelection>) => [...insightsKeys.all, 'today-augmented', params] as const,
  tomorrow: (params?: Partial<ContentSelection>) => [...insightsKeys.all, 'tomorrow', params] as const,
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
  const params = selectionParams(useContentSelection())
  return useQuery({
    queryKey: insightsKeys.todayAugmented(params),
    queryFn: () => insightsApi.todayAugmented(params).then((r) => r.data),
    staleTime: 1000 * 60 * 60, // 1 hour — daily joke is idempotent for the day
  })
}

/** GET /daily-jokes/tomorrow/ — preview teaser; lazy-creates row inline. */
export function useTomorrowTeaser() {
  const params = selectionParams(useContentSelection())
  return useQuery({
    queryKey: insightsKeys.tomorrow(params),
    queryFn: () => insightsApi.tomorrow(params).then((r) => r.data),
    staleTime: 1000 * 60 * 30,
    retry: false, // can 404 if backend hasn't generated yet
  })
}
