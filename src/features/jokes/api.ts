import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { jokesApi } from '@/lib/api'
import type { JokeSearchParams } from './types'

/**
 * Query key factory for jokes following TanStack Query patterns
 * @see https://tanstack.com/query/v5/docs/react/guides/query-keys
 */
export const jokeKeys = {
  all: ['jokes'] as const,
  search: (params: JokeSearchParams) => [...jokeKeys.all, 'search', params] as const,
  detail: (id: number) => [...jokeKeys.all, 'detail', id] as const,
  random: () => [...jokeKeys.all, 'random'] as const,
}

/**
 * Check if search params have any actual filters
 */
function hasSearchParams(params: JokeSearchParams): boolean {
  return Boolean(
    params.q ||
    params.joke_format ||
    params.age_rating ||
    params.tones ||
    params.context_tags ||
    params.culture_tags ||
    params.language ||
    params.page
  )
}

/**
 * Hook to search for jokes
 * Uses keepPreviousData to prevent flash during pagination
 * Only enabled when there are actual search params
 */
export function useJokeSearch(params: JokeSearchParams) {
  return useQuery({
    queryKey: jokeKeys.search(params),
    queryFn: async () => {
      const response = await jokesApi.search(params)
      return response.data
    },
    enabled: hasSearchParams(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to get a random joke
 */
export function useRandomJoke() {
  return useQuery({
    queryKey: jokeKeys.random(),
    queryFn: async () => {
      const response = await jokesApi.getRandom()
      return response.data
    },
    staleTime: 0, // Always refetch for random jokes
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook to get a joke by ID
 */
export function useJoke(id: number) {
  return useQuery({
    queryKey: jokeKeys.detail(id),
    queryFn: async () => {
      const response = await jokesApi.getById(id)
      return response.data
    },
    enabled: id > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}
