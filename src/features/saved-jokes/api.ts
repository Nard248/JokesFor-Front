import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { savedJokesAdapter } from '@/lib/api-adapter'

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
    mutationFn: ({ jokeId, collectionId, note }: { jokeId: number; collectionId: number; note?: string }) =>
      savedJokesAdapter.save(jokeId, collectionId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedJokeKeys.all })
    },
  })
}

export function useUnsaveJoke() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (savedJokeId: number) => savedJokesAdapter.unsave(savedJokeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedJokeKeys.all })
    },
  })
}
