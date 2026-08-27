import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/features/auth/store'
import { notificationsAdapter } from '@/lib/api-adapter'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationsAdapter.list(),
    staleTime: 1000 * 30,
  })
}

export function useUnreadCount() {
  // Authenticated-only: the notification bell renders in the shell on public
  // pages too, so without this gate every anonymous page view fired a 401.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationsAdapter.unreadCount(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsAdapter.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
