import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { favoritesAdapter } from '@/lib/api-adapter'
import { profileKeys } from '@/features/profile'

export const favoriteKeys = {
  all: ['favorites'] as const,
  list: (params?: { tones?: string; page?: number }) => [...favoriteKeys.all, 'list', params] as const,
  stats: () => [...favoriteKeys.all, 'stats'] as const,
}

export function useFavorites(params?: { tones?: string; page?: number }) {
  return useQuery({
    queryKey: favoriteKeys.list(params),
    queryFn: () => favoritesAdapter.list(params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useFavoriteStats() {
  return useQuery({
    queryKey: favoriteKeys.stats(),
    queryFn: () => favoritesAdapter.stats(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useAddFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jokeId: number) => favoritesAdapter.add(jokeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jokeId: number) => favoritesAdapter.remove(jokeId),
    // Optimistic: update stats immediately
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.stats() })
      const prevStats = queryClient.getQueryData<{ totalCount: number; topTone: string; thisWeekCount: number }>(favoriteKeys.stats())
      if (prevStats) {
        queryClient.setQueryData(favoriteKeys.stats(), {
          ...prevStats,
          totalCount: prevStats.totalCount - 1,
        })
      }
      return { prevStats }
    },
    onError: (_err, _id, context) => {
      if (context?.prevStats) {
        queryClient.setQueryData(favoriteKeys.stats(), context.prevStats)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}
