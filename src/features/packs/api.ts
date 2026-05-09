import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { packsApi } from '@/lib/api'

export const packsKeys = {
  all: ['packs'] as const,
  list: () => [...packsKeys.all, 'list'] as const,
  one: (slug: string) => [...packsKeys.all, 'one', slug] as const,
  featured: () => [...packsKeys.all, 'featured'] as const,
  inProgress: () => [...packsKeys.all, 'in-progress'] as const,
}

export function usePacks() {
  return useQuery({
    queryKey: packsKeys.list(),
    queryFn: () => packsApi.list().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

export function usePack(slug: string | undefined) {
  return useQuery({
    queryKey: packsKeys.one(slug ?? ''),
    queryFn: () => packsApi.get(slug!).then((r) => r.data),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  })
}

export function useFeaturedPack() {
  return useQuery({
    queryKey: packsKeys.featured(),
    queryFn: () => packsApi.featured().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    retry: false, // 404 if none featured — don't retry
  })
}

export function usePacksInProgress() {
  return useQuery({
    queryKey: packsKeys.inProgress(),
    queryFn: () => packsApi.inProgress().then((r) => r.data),
    staleTime: 1000 * 60,
  })
}

export function useRecordPackProgress(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entryOrder: number) =>
      packsApi.recordProgress(slug, entryOrder).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packsKeys.one(slug) })
      queryClient.invalidateQueries({ queryKey: packsKeys.inProgress() })
    },
  })
}
