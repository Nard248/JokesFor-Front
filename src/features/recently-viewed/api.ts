import { useQuery } from '@tanstack/react-query'
import { activityApi } from '@/lib/api'

export const recentlyViewedKeys = {
  all: ['recently-viewed'] as const,
  list: (limit?: number) => [...recentlyViewedKeys.all, limit ?? 'default'] as const,
}

/** GET /users/me/recently-viewed/?limit=N */
export function useRecentlyViewed(limit = 20) {
  return useQuery({
    queryKey: recentlyViewedKeys.list(limit),
    queryFn: () => activityApi.recentlyViewed(limit).then((r) => r.data),
    staleTime: 1000 * 30,
  })
}
