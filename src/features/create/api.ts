import { api } from '@/lib/axios'
import type { PaginatedResponse } from '@/lib/api'
import type {
  ContentDraft,
  ContentDraftDTO,
  CreateDraftBody,
  PatchDraftBody,
  FormatRule,
  Taxon,
  AgeRating,
  Language,
} from './types'

// ── Real API endpoints ──
export const contentApi = {
  formats: () => api.get<{ results: FormatRule[] }>('/formats/'),
  ageRatings: () => api.get<AgeRating[]>('/age-ratings/'),
  tones: () => api.get<Taxon[]>('/tones/'),
  contextTags: () => api.get<Taxon[]>('/context-tags/'),
  cultureTags: () => api.get<Taxon[]>('/culture-tags/'),
  languages: () => api.get<Language[]>('/languages/'),
  listDrafts: () =>
    api.get<PaginatedResponse<ContentDraftDTO>>('/jokes/my-drafts/?page_size=100'),
  getDraft: (id: number) =>
    api.get<ContentDraftDTO>(`/jokes/my-drafts/${id}/`),
  createDraft: (body: CreateDraftBody) =>
    api.post<ContentDraftDTO>('/jokes/my-drafts/', body),
  patchDraft: (id: number, body: PatchDraftBody) =>
    api.patch<ContentDraftDTO>(`/jokes/my-drafts/${id}/`, body),
  submitDraft: (id: number) =>
    api.post<{ id: number; status: string }>(`/jokes/my-drafts/${id}/submit/`),
  deleteDraft: (id: number) =>
    api.delete(`/jokes/my-drafts/${id}/`),
}

// ── DTO mappers ──

/**
 * Maps a backend DTO (snake_case) to the editor view-model (camelCase).
 * Prefers new field names (themes/categories) and falls back to legacy
 * (context_tags/tones) so both API generations are handled.
 */
export function fromDTO(d: ContentDraftDTO): ContentDraft {
  return {
    id: d.id,
    format: d.format,
    text: d.text ?? '',
    setup: d.setup ?? '',
    punchline: d.punchline ?? '',
    lines: d.lines ?? null,
    status: d.status,
    themes: d.themes ?? d.context_tags ?? [],
    categories: d.categories ?? d.tones ?? [],
    cultures: d.culture_tags ?? [],
    ageRating: d.age_rating ?? null,
    language: d.language ?? 'en',
    source: d.source ?? 'original',
    lastEditedAt: d.last_edited_at,
    rejectionReason: d.rejection_reason ?? '',
    likes: d.likes ?? null,
    stats: d.stats ?? null,
  }
}

/**
 * Maps an editor view-model patch to the API body (prefers legacy snake_case
 * field names that the backend accepts).  Only includes keys that are defined —
 * undefined fields are omitted so a PATCH does not accidentally clear data.
 */
export function toPatchBody(p: Partial<ContentDraft>): PatchDraftBody {
  const body: PatchDraftBody = {}

  if (p.format !== undefined) body.format = p.format
  if (p.text !== undefined) body.text = p.text
  if (p.setup !== undefined) body.setup = p.setup
  if (p.punchline !== undefined) body.punchline = p.punchline
  if (p.lines !== undefined) body.lines = p.lines
  // themes (new UI name) → context_tags (API snake_case)
  if (p.themes !== undefined) body.context_tags = p.themes
  // categories (new UI name) → tones (API snake_case)
  if (p.categories !== undefined) body.tones = p.categories
  // cultures → culture_tags
  if (p.cultures !== undefined) body.culture_tags = p.cultures
  // ageRating → age_rating
  if (p.ageRating !== undefined) body.age_rating = p.ageRating
  if (p.language !== undefined) body.language = p.language
  if (p.source !== undefined) body.source = p.source

  return body
}
