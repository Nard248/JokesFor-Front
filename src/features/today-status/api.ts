import { useQuery } from '@tanstack/react-query'
import { todayStatusApi } from '@/lib/api'

export const todayStatusKeys = {
  all: ['today-status'] as const,
}

/** GET /users/me/today-status/ — controls Today screen "ready" hero state. */
export function useTodayStatus() {
  return useQuery({
    queryKey: todayStatusKeys.all,
    queryFn: () => todayStatusApi.get().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true, // catches the moment notification time crosses
  })
}
