import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store'
import { api } from '@/lib/axios'

export type ContentPeriod = 'week' | 'month' | 'quarter' | 'year'
export type ContentSort = 'newest' | 'oldest' | 'views' | 'reactions' | 'saves' | 'shares'
export interface ContentFilters {
  period: ContentPeriod
  start?: string
  end?: string
  joke_format?: string
  language?: string
  theme?: string
  category?: string
  q?: string
  sort: ContentSort
}
export interface CreatorContentRow {
  id: number
  text: string
  setup: string
  punchline: string
  format: { slug: string; name: string }
  language: { code: string; name: string }
  themes: { slug: string; name: string }[]
  categories: { slug: string; name: string }[]
  created_at: string
  views: number
  reactions: number
  saves: number
  share_initiations: number
  metadata_missing: string[]
  metadata_completeness: number
  recommendation: { kind: 'complete_metadata' | 'collect_feedback'; detail: string; sample_size: number }
}
export interface CreatorContentPageData {
  count: number
  next: string | null
  previous: string | null
  results: CreatorContentRow[]
  window: { start: string; end: string; timezone: string }
  measurement_notes: string[]
}
export const contentDemoMode = () => !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCKS === 'true'
export const contentStatus = (error: unknown) => (error as { response?: { status?: number } })?.response?.status
export function useCreatorContent(filters: ContentFilters, page: number) {
  const owner = useAuthStore((state) => state.isAuthenticated ? state.user?.pk : undefined)
  return useQuery({
    queryKey: ['creator-content', owner, filters, page],
    queryFn: async ({ signal }) => (await api.get<CreatorContentPageData>('/creators/me/content/', {
      params: { ...filters, page_size: 25, page }, signal,
    })).data,
    enabled: owner !== undefined && !contentDemoMode(),
    staleTime: 60_000,
    retry: (count, error) => ![400, 401, 403, 404].includes(contentStatus(error) ?? 0) && count < 1,
  })
}

/** A constant filename and a local blob URL keep downloads on the authenticated API path. */
async function downloadContent(filters: ContentFilters, owner: number | undefined) {
  const sameAccount = () => owner !== undefined && useAuthStore.getState().isAuthenticated && useAuthStore.getState().user?.pk === owner
  if (!sameAccount()) throw new Error('Your account changed. Please retry the export.')
  const { data } = await api.get<Blob>('/creators/me/content/export/', { params: filters, responseType: 'blob' })
  if (!sameAccount()) throw new Error('Your account changed. Please retry the export.')
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'jokesfor-creator-content.csv'
  document.body.appendChild(link)
  try { link.click() } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 0) }
}

export function useExportCreatorContent() {
  const mutation = useMutation({
    mutationFn: ({ filters, owner }: { filters: ContentFilters; owner: number | undefined }) => downloadContent(filters, owner),
  })
  return {
    ...mutation,
    exportContent: (filters: ContentFilters) => mutation.mutate({ filters, owner: useAuthStore.getState().user?.pk }),
  }
}

export async function contentErrorMessage(error: unknown, fallback: string): Promise<string> {
  const response = (error as { response?: { data?: unknown } })?.response
  let data = response?.data
  if (data && typeof (data as Blob).text === 'function') {
    try { data = JSON.parse(await (data as Blob).text()) } catch { return fallback }
  }
  if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') return data.detail
  return error instanceof Error && !response ? error.message : fallback
}
