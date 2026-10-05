import { useContentSelection } from '@/features/discovery/context'
import { selectionParams, type ContentSelection } from '@/features/discovery/selection'
import { useQuery } from '@tanstack/react-query'
import { trendingAdapter } from '@/lib/api-adapter'

export const trendingKeys = {
  all: ['trending'] as const,
  jokes: (period: string, params?: Partial<ContentSelection>) => [...trendingKeys.all, 'jokes', period, params] as const,
  tags: () => [...trendingKeys.all, 'tags'] as const,
  risingTopics: () => [...trendingKeys.all, 'rising'] as const,
  topJokesters: () => [...trendingKeys.all, 'jokesters'] as const,
  popularThemes: () => [...trendingKeys.all, 'themes'] as const,
}

export function useTrendingJokes(period: string = 'week') {
  const params = selectionParams(useContentSelection())
  return useQuery({
    queryKey: trendingKeys.jokes(period, params),
    queryFn: () => trendingAdapter.getJokes(period, params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useTrendingTags() {
  return useQuery({
    queryKey: trendingKeys.tags(),
    queryFn: () => trendingAdapter.getTags(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useRisingTopics() {
  return useQuery({
    queryKey: trendingKeys.risingTopics(),
    queryFn: () => trendingAdapter.getRisingTopics(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useTopJokesters(limit?: number) {
  return useQuery({
    queryKey: trendingKeys.topJokesters(),
    queryFn: () => trendingAdapter.getTopJokesters(limit),
    staleTime: 1000 * 60 * 10,
  })
}

export function usePopularThemes() {
  return useQuery({
    queryKey: trendingKeys.popularThemes(),
    queryFn: () => trendingAdapter.getPopularThemes(),
    staleTime: 1000 * 60 * 15,
  })
}
