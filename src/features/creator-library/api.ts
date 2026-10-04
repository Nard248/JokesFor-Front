import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountRequest, captureAccountIntent, useAccountIdentity } from '@/lib/account-request'
import { contentDemoMode } from '@/features/creator-content/api'

export interface Page<T> { count: number; next: string | null; previous: string | null; results: T[]; unavailable_count?: number }
export interface PrivateNote { joke_id: number; private_note: string; updated_at: string | null }
export interface CreatorCollection {
  id: number; name: string; kind: 'series' | 'set_list'; description: string
  joke_ids: number[]; items?: { joke_id: number; display_text: string }[]; unavailable_count: number; updated_at: string
}
export interface MetadataRequest {
  id: number; joke_id: number; changes: { themes?: string[]; categories?: string[] }
  reason: string; status: 'pending' | 'approved' | 'rejected'; decision_reason: string; created_at: string; reviewed_at: string | null
}
export interface MetadataChanges { joke_ids: number[]; themes?: string[]; categories?: string[]; reason?: string }

export const captureLibraryOwner = captureAccountIntent
export const libraryRequest = accountRequest
type Owner = ReturnType<typeof captureLibraryOwner>

export function useLibraryQuery<T>(path: string, enabled = true) {
  const { owner: account, revision } = useAccountIdentity()
  const intent = captureLibraryOwner()
  return useQuery({
    queryKey: ['creator-library', account, revision, path],
    queryFn: ({ signal }) => libraryRequest<T>(intent, 'GET', path, undefined, signal),
    enabled: enabled && account !== undefined && !contentDemoMode(), retry: false, staleTime: 0,
  })
}

export function useLibraryAccess() {
  const query = useLibraryQuery<{ features: Record<string, boolean> }>('/billing/entitlements')
  return { ...query, canWrite: !query.isError && query.data?.features.creator_content_explorer === true }
}

export function useLibraryMutation<T = unknown>() {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ intent, method, path, data }: { intent: Owner; method: 'POST' | 'PATCH' | 'DELETE'; path: string; data?: unknown }) => libraryRequest<T>(intent, method, path, data),
    onSuccess: (_, variables) => { void client.invalidateQueries({ queryKey: ['creator-library', variables.intent.owner] }) },
  })
  return { ...mutation, save: (method: 'POST' | 'PATCH' | 'DELETE', path: string, data?: unknown) => mutation.mutateAsync({ intent: captureLibraryOwner(), method, path, data }) }
}

export function libraryError(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: Record<string, unknown> } })?.response
  if (response?.status === 401) return 'Your session expired. Sign in again, then retry.'
  if (response?.status === 403) return 'Creator Pro is needed to save changes. Your existing private work remains available.'
  if (response?.status === 404) return 'This item is unavailable or no longer accessible to your account.'
  if (response?.status === 409) return 'A change request is already pending for this material. Check your review history.'
  if (response?.status === 400 && response.data) {
    const first = Object.values(response.data).flat().find((value) => typeof value === 'string')
    if (typeof first === 'string') return first
  }
  return error instanceof Error && !response ? error.message : 'Could not save your changes. Please try again.'
}
