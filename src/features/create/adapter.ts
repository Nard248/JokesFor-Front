/**
 * Content creation adapter — mirrors the preferencesAdapter pattern.
 *
 * Default path: mock (mockContentApi).
 * Real path: when VITE_USE_REAL_CREATE === 'true', calls contentApi (axios)
 * and maps results through fromDTO/toPatchBody.
 *
 * Both paths route DTOs through fromDTO so mock and real share one mapping path.
 */
import { contentApi, fromDTO, toPatchBody } from './api'
import {
  mockContentApi,
  mockFormats,
  mockAgeRatings,
  mockTones,
  mockContextTags,
  mockCultureTags,
  mockLanguages,
} from './mock'
import type { ContentDraft, ContentDraftDTO, FormatRule, AgeRating, Taxon, Language, FormatSlug } from './types'

const USE_REAL = import.meta.env.VITE_USE_REAL_CREATE === 'true'

export const contentAdapter = {
  // ── Catalog endpoints ──

  formats: (): Promise<FormatRule[]> => {
    if (USE_REAL) {
      return contentApi.formats().then((r) => r.data.results)
    }
    return mockFormats()
  },

  ageRatings: (): Promise<AgeRating[]> => {
    if (USE_REAL) {
      return contentApi.ageRatings().then((r) => r.data)
    }
    return mockAgeRatings()
  },

  tones: (): Promise<Taxon[]> => {
    if (USE_REAL) {
      return contentApi.tones().then((r) => r.data)
    }
    return mockTones()
  },

  contextTags: (): Promise<Taxon[]> => {
    if (USE_REAL) {
      return contentApi.contextTags().then((r) => r.data)
    }
    return mockContextTags()
  },

  cultureTags: (): Promise<Taxon[]> => {
    if (USE_REAL) {
      return contentApi.cultureTags().then((r) => r.data)
    }
    return mockCultureTags()
  },

  languages: (): Promise<Language[]> => {
    if (USE_REAL) {
      return contentApi.languages().then((r) => r.data)
    }
    return mockLanguages()
  },

  // ── Draft CRUD — both paths map through fromDTO ──

  listDrafts: (): Promise<ContentDraft[]> => {
    if (USE_REAL) {
      return contentApi.listDrafts().then((r) => r.data.results.map(fromDTO))
    }
    return mockContentApi.listDrafts().then((r) => r.results.map(fromDTO))
  },

  getDraft: (id: number): Promise<ContentDraft> => {
    if (USE_REAL) {
      return contentApi.getDraft(id).then((r) => fromDTO(r.data))
    }
    return mockContentApi.getDraft(id).then((dto) => fromDTO(dto))
  },

  createDraft: (format: FormatSlug): Promise<ContentDraft> => {
    if (USE_REAL) {
      return contentApi.createDraft({ format }).then((r) => fromDTO(r.data))
    }
    return mockContentApi.createDraft({ format }).then((dto) => fromDTO(dto))
  },

  patchDraft: (id: number, patch: Partial<ContentDraft>): Promise<ContentDraft> => {
    const body = toPatchBody(patch)
    if (USE_REAL) {
      return contentApi.patchDraft(id, body).then((r) => fromDTO(r.data))
    }
    return mockContentApi.patchDraft(id, body).then((dto: ContentDraftDTO) => fromDTO(dto))
  },

  submitDraft: (id: number): Promise<ContentDraft> => {
    if (USE_REAL) {
      // Real submit returns {id, status}; refetch the full DTO after
      return contentApi.submitDraft(id).then(() => contentApi.getDraft(id).then((r) => fromDTO(r.data)))
    }
    return mockContentApi.submitDraft(id).then((dto) => fromDTO(dto))
  },

  deleteDraft: (id: number): Promise<void> => {
    if (USE_REAL) {
      return contentApi.deleteDraft(id).then(() => undefined)
    }
    return mockContentApi.deleteDraft(id)
  },
}
