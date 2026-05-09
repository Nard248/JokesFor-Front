import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { jokesAdapter } from '@/lib/api-adapter'
import type { JokeSearchParams } from './types'

export const jokeKeys = {
  all: ['jokes'] as const,
  search: (params: JokeSearchParams) => [...jokeKeys.all, 'search', params] as const,
  detail: (id: number) => [...jokeKeys.all, 'detail', id] as const,
  random: () => [...jokeKeys.all, 'random'] as const,
}

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

export function useJokeSearch(params: JokeSearchParams) {
  return useQuery({
    queryKey: jokeKeys.search(params),
    queryFn: () => jokesAdapter.search(params),
    enabled: hasSearchParams(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

export function useRandomJoke() {
  return useQuery({
    queryKey: jokeKeys.random(),
    queryFn: () => jokesAdapter.getRandom(),
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
