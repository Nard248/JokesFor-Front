import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { savedJokesAdapter } from '@/lib/api-adapter'
import type { PaginatedResponse, SavedJoke } from '@/lib/api'
import { favoriteKeys } from '@/features/favorites'
import { profileKeys } from '@/features/profile'
import { collectionKeys } from '@/features/collections'

export const savedJokeKeys = {
  all: ['saved-jokes'] as const,
  list: () => [...savedJokeKeys.all, 'list'] as const,
}

export function useSavedJokes() {
  return useQuery({
    queryKey: savedJokeKeys.list(),
    queryFn: () => savedJokesAdapter.list(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveJoke() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jokeId, collectionId, note }: { jokeId: number; collectionId?: number | null; note?: string }) =>
      savedJokesAdapter.save(jokeId, collectionId, note),
    onSuccess: () => {
      // Cascade invalidation: saving a joke affects multiple data sources
      queryClient.invalidateQueries({ queryKey: savedJokeKeys.all })
      queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

export function useUnsaveJoke() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (savedJokeId: number) => savedJokesAdapter.unsave(savedJokeId),
    // Optimistic update: remove from cache immediately
    onMutate: async (savedJokeId) => {
      await queryClient.cancelQueries({ queryKey: savedJokeKeys.list() })
      const previous = queryClient.getQueryData<PaginatedResponse<SavedJoke>>(savedJokeKeys.list())
      if (previous) {
        queryClient.setQueryData<PaginatedResponse<SavedJoke>>(savedJokeKeys.list(), {
          ...previous,
          count: previous.count - 1,
          results: previous.results.filter((s) => s.id !== savedJokeId),
        })
      }
      return { previous }
    },
    onError: (_err, _id, context) => {
      // Roll back on error
      if (context?.previous) {
        queryClient.setQueryData(savedJokeKeys.list(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedJokeKeys.all })
      queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}
