import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collectionsAdapter } from '@/lib/api-adapter'

export const collectionKeys = {
  all: ['collections'] as const,
  list: () => [...collectionKeys.all, 'list'] as const,
  jokes: (id: number) => [...collectionKeys.all, 'jokes', id] as const,
}

export function useCollections() {
  return useQuery({
    queryKey: collectionKeys.list(),
    queryFn: () => collectionsAdapter.list(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCollectionJokes(collectionId: number) {
  return useQuery({
    queryKey: collectionKeys.jokes(collectionId),
    queryFn: () => collectionsAdapter.getJokes(collectionId),
    enabled: collectionId > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => collectionsAdapter.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all })
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => collectionsAdapter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all })
    },
  })
}
