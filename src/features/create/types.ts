import type { FlowJokeFormat, JokePayload } from '@/components/JokeRenderer'

// Re-export the format type from JokeRenderer — single source of truth.
export type { FlowJokeFormat, JokePayload }

/** FormatSlug === FlowJokeFormat from @/components/JokeRenderer */
export type FormatSlug = FlowJokeFormat // 'setup'|'oneliner'|'observ'|'anti'|'knock'|'story'

export const FORMAT_SLUGS = ['oneliner', 'setup', 'knock', 'story', 'anti', 'observ', 'image', 'video', 'audio'] as const

export type SubmissionStatus = 'draft' | 'pending' | 'published' | 'rejected'

export interface Taxon {
  id: number
  slug: string
  name: string
  description?: string
}

export interface AgeRating extends Taxon {
  min_age?: number
}

export interface Language {
  id: number
  code: string
  name: string
}

export interface FormatRule {
  id: number
  slug: FormatSlug
  name: string
  description: string
  required_fields: string[]
  forbidden_fields: string[]
  constraints: {
    min_lines?: number
    max_lines?: number
    max_line_chars?: number
    min_text_words?: number
    min_media?: number
    max_media?: number
    media_kind?: string
  }
}

/** A single uploaded media attachment (image today; video/audio in a later wave). */
export interface MediaAssetDTO {
  id: string
  kind: string
  url: string | null
  poster_url: string | null
  width: number | null
  height: number | null
  duration_ms: number | null
  is_gif: boolean
}

export interface PublishedStats {
  saves: number
  reactions: number
  reports: number
}

/**
 * View-model the editor + pages use. JokePayload = {format,text,setup,punchline,lines}.
 * `media` is redeclared here (Omit + override) because ContentDraft's media is the
 * upload-pipeline DTO shape (MediaAssetDTO[], always an array), not JokePayload's
 * render-shape `JokeMediaItem[] | null` — the two are mapped into each other by
 * toJokePayload, never passed through structurally.
 */
export interface ContentDraft extends Omit<JokePayload, 'media'> {
  id: number
  status: SubmissionStatus
  themes: string[]      // slugs (API: context_tags / themes)
  categories: string[]  // slugs (API: tones / categories)
  cultures: string[]    // slugs (API: culture_tags)
  ageRating: string | null
  language: string
  source: string
  lastEditedAt: string
  rejectionReason: string
  likes: number | null
  stats?: PublishedStats | null
  media: MediaAssetDTO[]
}

/** DTO shapes from the backend (snake_case). */
export interface ContentDraftDTO {
  id: number
  text: string
  setup: string
  punchline: string
  lines: string[] | null
  format: FormatSlug
  status: SubmissionStatus
  tones: string[]
  categories?: string[]
  context_tags: string[]
  themes?: string[]
  culture_tags: string[]
  age_rating: string | null
  language?: string
  source?: string
  last_edited_at: string
  created_at: string
  likes: number | null
  rejection_reason?: string
  stats?: PublishedStats | null
  media?: MediaAssetDTO[]
}

export interface CreateDraftBody {
  format: FormatSlug
  age_rating?: string | null
  language?: string
}

export interface PatchDraftBody {
  format?: FormatSlug
  text?: string
  setup?: string
  punchline?: string
  lines?: string[] | null
  tones?: string[]
  context_tags?: string[]
  culture_tags?: string[]
  age_rating?: string | null
  language?: string
  source?: string
  media_asset_ids?: string[]
}
