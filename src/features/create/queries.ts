import { useQuery } from '@tanstack/react-query'
import { contentAdapter } from './adapter'

const ONE_HOUR = 1000 * 60 * 60
const THIRTY_SECONDS = 1000 * 30

export const createKeys = {
  formats: ['formats'] as const,
  taxonomy: {
    ages: ['taxonomy', 'ages'] as const,
    tones: ['taxonomy', 'tones'] as const,
    themes: ['taxonomy', 'themes'] as const,
    cultures: ['taxonomy', 'cultures'] as const,
    languages: ['taxonomy', 'languages'] as const,
  },
  drafts: {
    list: ['create', 'drafts'] as const,
    detail: (id: number) => ['create', 'drafts', id] as const,
  },
} as const

export function useFormats() {
  return useQuery({
    queryKey: createKeys.formats,
    queryFn: () => contentAdapter.formats(),
    staleTime: ONE_HOUR,
  })
}

export function useAgeRatings() {
  return useQuery({
    queryKey: createKeys.taxonomy.ages,
    queryFn: () => contentAdapter.ageRatings(),
    staleTime: ONE_HOUR,
  })
}

export function useTones() {
  return useQuery({
    queryKey: createKeys.taxonomy.tones,
    queryFn: () => contentAdapter.tones(),
    staleTime: ONE_HOUR,
  })
}

export function useContextTags() {
  return useQuery({
    queryKey: createKeys.taxonomy.themes,
    queryFn: () => contentAdapter.contextTags(),
    staleTime: ONE_HOUR,
  })
}

export function useCultureTags() {
  return useQuery({
    queryKey: createKeys.taxonomy.cultures,
    queryFn: () => contentAdapter.cultureTags(),
    staleTime: ONE_HOUR,
  })
}

export function useLanguages() {
  return useQuery({
    queryKey: createKeys.taxonomy.languages,
    queryFn: () => contentAdapter.languages(),
    staleTime: ONE_HOUR,
  })
}

export function useDrafts() {
  return useQuery({
    queryKey: createKeys.drafts.list,
    queryFn: () => contentAdapter.listDrafts(),
    staleTime: THIRTY_SECONDS,
  })
}

export function useDraft(id: number) {
  return useQuery({
    queryKey: createKeys.drafts.detail(id),
    queryFn: () => contentAdapter.getDraft(id),
    enabled: id > 0,
    refetchOnMount: 'always',
  })
}
