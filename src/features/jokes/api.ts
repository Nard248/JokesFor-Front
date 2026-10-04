import { useContentSelection } from '@/features/discovery/context'
import { selectionParams, type ContentSelection } from '@/features/discovery/selection'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { jokesAdapter } from '@/lib/api-adapter'
import { useAccountIdentity } from '@/lib/account-request'
import { useAuthStore } from '@/features/auth/store'
import type { JokeSearchParams } from './types'

export const jokeKeys = {
  all: ['jokes'] as const,
  search: (params: JokeSearchParams) => [...jokeKeys.all, 'search', params] as const,
  detail: (id: number) => [...jokeKeys.all, 'detail', id] as const,
  random: (params?: Partial<ContentSelection>) => [...jokeKeys.all, 'random', params] as const,
}

export function useJokeSearch(params: JokeSearchParams) {
  const selection = useContentSelection()
  const effective = { ...selectionParams(selection), ...params }
  return useQuery({
    queryKey: jokeKeys.search(effective),
    queryFn: ({ signal }) => jokesAdapter.search(effective, signal),
    staleTime: 1000 * 60 * 5,
  })
}

/** Each search owns its pages; never carry results across a query or reader change. */
export function useInfiniteJokeSearch(params: Omit<JokeSearchParams, 'page'>) {
  const selection = useContentSelection()
  const effective = { ...selectionParams(selection), ...params }
  const { owner, revision } = useAccountIdentity()
  const dateOfBirth = useAuthStore((state) => state.user?.date_of_birth ?? null)
  return useInfiniteQuery({
    queryKey: [...jokeKeys.all, 'infinite-search', { owner, revision, dateOfBirth }, effective],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => jokesAdapter.search({ ...effective, page: pageParam }, signal),
    getNextPageParam: (lastPage, _pages, lastPageParam) => lastPage.next ? lastPageParam + 1 : undefined,
    staleTime: 1000 * 60,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status
      return !(status && status >= 400 && status < 500) && failureCount < 1
    },
  })
}

export function useRandomJoke() {
  const params = selectionParams(useContentSelection())
  return useQuery({
    queryKey: jokeKeys.random(params),
    queryFn: () => jokesAdapter.getRandom(params),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useJoke(id: number) {
  return useQuery({
    queryKey: jokeKeys.detail(id),
    queryFn: () => jokesAdapter.getById(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 10,
  })
}
