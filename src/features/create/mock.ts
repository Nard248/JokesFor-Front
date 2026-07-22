import type { PaginatedResponse } from '@/lib/api'
import type {
  ContentDraftDTO,
  CreateDraftBody,
  PatchDraftBody,
  FormatRule,
  AgeRating,
  Taxon,
  Language,
  MediaAssetDTO,
  MediaKind,
} from './types'

// ── Delay helper (mirrors mock-api.ts) ──
function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200))
}

// ── Mock upload URLs ──
// Real browsers always have URL.createObjectURL; jsdom (unit tests) does not
// implement it at all. Rather than require a global test polyfill, each call
// site falls back to a stable placeholder so the mock stays exercisable
// directly (not just behind a vi.mock) in any environment.
const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/800x600?text=Image'
const PLACEHOLDER_VIDEO_URL = 'https://placehold.co/1280x720?text=Video'
const PLACEHOLDER_POSTER_URL = 'https://placehold.co/1280x720?text=Poster'
const PLACEHOLDER_AUDIO_URL = 'https://placehold.co/mock-audio.mp3'

function objectURLOrPlaceholder(file: File, placeholder: string): string {
  if (typeof URL.createObjectURL === 'function') {
    try {
      return URL.createObjectURL(file)
    } catch {
      // fall through to placeholder
    }
  }
  return placeholder
}

// ── Format catalog ──
const FORMAT_CATALOG: FormatRule[] = [
  {
    id: 1,
    slug: 'oneliner',
    name: 'One-liner',
    description: 'A single witty sentence that delivers the punchline immediately.',
    required_fields: ['text'],
    forbidden_fields: ['setup', 'punchline', 'lines'],
    constraints: {},
  },
  {
    id: 2,
    slug: 'setup',
    name: 'Setup → Punchline',
    description: 'A classic two-part joke: a setup that raises a question and a punchline that resolves it.',
    required_fields: ['setup', 'punchline'],
    forbidden_fields: ['text', 'lines'],
    constraints: {},
  },
  {
    id: 3,
    slug: 'knock',
    name: 'Knock-knock',
    description: 'The beloved call-and-response format with alternating dialogue lines.',
    required_fields: ['lines'],
    forbidden_fields: ['text', 'setup', 'punchline'],
    constraints: { min_lines: 4, max_lines: 8, max_line_chars: 200 },
  },
  {
    id: 4,
    slug: 'story',
    name: 'Story',
    description: 'A narrative joke with a longer build-up and a surprising conclusion.',
    required_fields: ['text'],
    forbidden_fields: ['setup', 'punchline', 'lines'],
    constraints: { min_text_words: 30 },
  },
  {
    id: 5,
    slug: 'anti',
    name: 'Anti-joke',
    description: 'Subverts expectations by following the setup with a deadpan literal answer.',
    required_fields: ['setup', 'punchline'],
    forbidden_fields: ['text', 'lines'],
    constraints: {},
  },
  {
    id: 6,
    slug: 'observ',
    name: 'Observational',
    description: "A wry observation about everyday life presented as a single reflective statement.",
    required_fields: ['text'],
    forbidden_fields: ['setup', 'punchline', 'lines'],
    constraints: {},
  },
  {
    id: 9,
    slug: 'image',
    name: 'Image',
    description: 'A caption with an image punchline.',
    required_fields: ['setup', 'media'],
    forbidden_fields: ['punchline', 'lines'],
    constraints: { min_media: 1, max_media: 6 },
  },
  {
    id: 10,
    slug: 'video',
    name: 'Video',
    description: 'A caption with a video punchline.',
    required_fields: ['setup', 'media'],
    forbidden_fields: ['punchline', 'lines'],
    constraints: { min_media: 1, max_media: 1, max_duration_ms: 60000 },
  },
  {
    id: 11,
    slug: 'audio',
    name: 'Audio',
    description: 'A caption with an audio punchline.',
    required_fields: ['setup', 'media'],
    forbidden_fields: ['punchline', 'lines'],
    constraints: { min_media: 1, max_media: 1, max_duration_ms: 60000 },
  },
]

// ── Taxonomy catalogs ──
const AGE_RATING_CATALOG: AgeRating[] = [
  { id: 1, slug: 'kid-safe', name: 'Kid Safe', description: 'Appropriate for all ages', min_age: 0 },
  { id: 2, slug: 'family', name: 'Family Friendly', description: 'Suitable for families', min_age: 6 },
  { id: 3, slug: 'teen', name: 'Teen+', description: 'Best for teens and adults', min_age: 13 },
  { id: 4, slug: 'adult', name: 'Adult', description: 'Mature audiences only', min_age: 18 },
]

const TONES_CATALOG: Taxon[] = [
  { id: 1, slug: 'wholesome', name: 'Wholesome', description: 'Warm, positive humor' },
  { id: 2, slug: 'dad', name: 'Dad Joke', description: 'Classic groan-worthy puns' },
  { id: 3, slug: 'dark', name: 'Dark', description: 'Edgy, dark humor' },
  { id: 4, slug: 'surreal', name: 'Surreal', description: 'Absurdist, weird humor' },
  { id: 5, slug: 'nerd', name: 'Nerd', description: 'Geeky, tech, or science humor' },
  { id: 6, slug: 'office', name: 'Office-safe', description: 'Workplace appropriate' },
]

const CONTEXT_TAGS_CATALOG: Taxon[] = [
  { id: 1, slug: 'work', name: 'Work', description: 'Work and office situations' },
  { id: 2, slug: 'family', name: 'Family', description: 'Family dynamics' },
  { id: 3, slug: 'food', name: 'Food', description: 'Food and cooking' },
  { id: 4, slug: 'tech', name: 'Tech', description: 'Technology and software' },
  { id: 5, slug: 'animals', name: 'Animals', description: 'Animals and pets' },
  { id: 6, slug: 'dating', name: 'Dating', description: 'Relationships and dating' },
  { id: 7, slug: 'science', name: 'Science', description: 'Science and math' },
  { id: 8, slug: 'travel', name: 'Travel', description: 'Travel and geography' },
]

const CULTURE_TAGS_CATALOG: Taxon[] = [
  { id: 1, slug: 'en-us', name: 'American', description: 'American cultural references' },
  { id: 2, slug: 'en-gb', name: 'British', description: 'British cultural references' },
  { id: 3, slug: 'universal', name: 'Universal', description: 'No specific cultural context' },
]

const LANGUAGES_CATALOG: Language[] = [
  { id: 1, code: 'en', name: 'English' },
  { id: 2, code: 'es', name: 'Spanish' },
  { id: 3, code: 'fr', name: 'French' },
  { id: 4, code: 'de', name: 'German' },
]

// ── In-memory draft store ──
let nextId = 100

function nowISO(): string {
  return new Date().toISOString()
}

function makeEmptyDTO(id: number, format: string): ContentDraftDTO {
  return {
    id,
    format: format as ContentDraftDTO['format'],
    status: 'draft',
    text: '',
    setup: '',
    punchline: '',
    lines: null,
    tones: [],
    categories: [],
    context_tags: [],
    themes: [],
    culture_tags: [],
    age_rating: null,
    language: 'en',
    source: 'original',
    last_edited_at: nowISO(),
    created_at: nowISO(),
    likes: null,
    rejection_reason: '',
    stats: null,
    media: [],
  }
}

// Seed data: 3 sample drafts across statuses
const seedDrafts: ContentDraftDTO[] = [
  {
    id: 1,
    format: 'setup',
    status: 'draft',
    text: '',
    setup: "Why don't scientists trust atoms?",
    punchline: '',
    lines: null,
    tones: ['dad'],
    categories: ['dad'],
    context_tags: ['science'],
    themes: ['science'],
    culture_tags: ['universal'],
    age_rating: 'family',
    language: 'en',
    source: 'original',
    last_edited_at: '2026-05-20T10:00:00Z',
    created_at: '2026-05-20T09:55:00Z',
    likes: null,
    rejection_reason: '',
    stats: null,
  },
  {
    id: 2,
    format: 'oneliner',
    status: 'published',
    text: 'I told my wife she should embrace her mistakes. She gave me a hug.',
    setup: '',
    punchline: '',
    lines: null,
    tones: ['wholesome', 'dad'],
    categories: ['wholesome', 'dad'],
    context_tags: ['family'],
    themes: ['family'],
    culture_tags: ['universal'],
    age_rating: 'family',
    language: 'en',
    source: 'original',
    last_edited_at: '2026-05-18T14:00:00Z',
    created_at: '2026-05-18T13:50:00Z',
    likes: 42,
    rejection_reason: '',
    stats: { saves: 15, reactions: 38, reports: 0 },
  },
  {
    id: 3,
    format: 'knock',
    status: 'rejected',
    text: '',
    setup: '',
    punchline: '',
    lines: ['Knock, knock.', "Who's there?", 'Interrupting cow.', 'Moo!'],
    tones: ['wholesome'],
    categories: ['wholesome'],
    context_tags: ['animals'],
    themes: ['animals'],
    culture_tags: ['universal'],
    age_rating: 'kid-safe',
    language: 'en',
    source: 'original',
    last_edited_at: '2026-05-15T11:00:00Z',
    created_at: '2026-05-15T10:45:00Z',
    likes: null,
    rejection_reason: 'The punchline arrives before the "who\'s there" response — the timing is off. Please fix the dialogue order.',
    stats: null,
  },
]

// Uploaded mock media assets, keyed by id — lets patchDraft resolve
// `media_asset_ids` back to the full asset shape (mirrors a real backend
// keeping only previously-uploaded, matching assets).
const mockMediaStore = new Map<string, MediaAssetDTO>()

// Mutable store (clone seeds so tests can mutate without polluting each other)
let drafts: ContentDraftDTO[] = [...seedDrafts.map((d) => ({ ...d }))]

// ── Catalog mock functions ──
export async function mockFormats(): Promise<FormatRule[]> {
  await delay(100)
  return [...FORMAT_CATALOG]
}

export async function mockAgeRatings(): Promise<AgeRating[]> {
  await delay(100)
  return [...AGE_RATING_CATALOG]
}

export async function mockTones(): Promise<Taxon[]> {
  await delay(100)
  return [...TONES_CATALOG]
}

export async function mockContextTags(): Promise<Taxon[]> {
  await delay(100)
  return [...CONTEXT_TAGS_CATALOG]
}

export async function mockCultureTags(): Promise<Taxon[]> {
  await delay(100)
  return [...CULTURE_TAGS_CATALOG]
}

export async function mockLanguages(): Promise<Language[]> {
  await delay(100)
  return [...LANGUAGES_CATALOG]
}

// ── Mock content API ──
export const mockContentApi = {
  listDrafts: async (): Promise<PaginatedResponse<ContentDraftDTO>> => {
    await delay()
    return {
      count: drafts.length,
      next: null,
      previous: null,
      results: [...drafts],
    }
  },

  getDraft: async (id: number): Promise<ContentDraftDTO> => {
    await delay(150)
    const draft = drafts.find((d) => d.id === id)
    if (!draft) throw new Error(`Draft ${id} not found`)
    return { ...draft }
  },

  createDraft: async (body: CreateDraftBody): Promise<ContentDraftDTO> => {
    await delay()
    const id = nextId++
    const dto = makeEmptyDTO(id, body.format)
    if (body.age_rating !== undefined) dto.age_rating = body.age_rating
    if (body.language !== undefined) dto.language = body.language
    drafts.push(dto)
    return { ...dto }
  },

  patchDraft: async (id: number, body: PatchDraftBody): Promise<ContentDraftDTO> => {
    await delay()
    const idx = drafts.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error(`Draft ${id} not found`)
    const updated: ContentDraftDTO = {
      ...drafts[idx],
      ...(body.format !== undefined && { format: body.format }),
      ...(body.text !== undefined && { text: body.text }),
      ...(body.setup !== undefined && { setup: body.setup }),
      ...(body.punchline !== undefined && { punchline: body.punchline }),
      ...(body.lines !== undefined && { lines: body.lines }),
      ...(body.tones !== undefined && { tones: body.tones }),
      ...(body.context_tags !== undefined && { context_tags: body.context_tags }),
      ...(body.culture_tags !== undefined && { culture_tags: body.culture_tags }),
      ...(body.age_rating !== undefined && { age_rating: body.age_rating }),
      ...(body.language !== undefined && { language: body.language }),
      ...(body.source !== undefined && { source: body.source }),
      ...(body.media_asset_ids !== undefined && {
        media: body.media_asset_ids
          .map((id) => mockMediaStore.get(id))
          .filter((m): m is MediaAssetDTO => m !== undefined),
      }),
      last_edited_at: nowISO(),
    }
    drafts[idx] = updated
    return { ...updated }
  },

  submitDraft: async (id: number): Promise<ContentDraftDTO> => {
    await delay()
    const idx = drafts.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error(`Draft ${id} not found`)
    drafts[idx] = { ...drafts[idx], status: 'pending', last_edited_at: nowISO() }
    return { ...drafts[idx] }
  },

  uploadMedia: async (file: File, kind: MediaKind = 'image'): Promise<MediaAssetDTO> => {
    await delay(300)
    const id = `mock-${Date.now()}-${file.name}`
    const asset: MediaAssetDTO =
      kind === 'video'
        ? {
            id, kind: 'video',
            url: objectURLOrPlaceholder(file, PLACEHOLDER_VIDEO_URL),
            poster_url: objectURLOrPlaceholder(file, PLACEHOLDER_POSTER_URL),
            width: 1280, height: 720, duration_ms: 5000,
            is_gif: /\.gif$/i.test(file.name),
          }
        : kind === 'audio'
        ? {
            id, kind: 'audio',
            url: objectURLOrPlaceholder(file, PLACEHOLDER_AUDIO_URL),
            poster_url: null,
            width: null, height: null, duration_ms: 5000, is_gif: false,
          }
        : {
            id, kind: 'image',
            url: objectURLOrPlaceholder(file, PLACEHOLDER_IMAGE_URL),
            poster_url: null,
            width: 800, height: 600, duration_ms: null, is_gif: false,
          }
    mockMediaStore.set(asset.id, asset)
    return asset
  },

  deleteDraft: async (id: number): Promise<void> => {
    await delay()
    const idx = drafts.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error(`Draft ${id} not found`)
    drafts.splice(idx, 1)
  },
}

/** Reset the in-memory store to seed state (useful in tests). */
export function resetMockStore(): void {
  drafts = [...seedDrafts.map((d) => ({ ...d }))]
  nextId = 100
  mockMediaStore.clear()
}
