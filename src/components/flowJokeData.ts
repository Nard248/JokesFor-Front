/**
 * FlowJokeData — the render model for FlowJokeCard — and the adapters that
 * build it from backend payloads. Every card surface goes through one of these
 * so language / origin / AI-generated badges appear consistently.
 *
 * Lives outside FlowJokeCard.tsx so that file only exports components
 * (React Fast Refresh).
 */
import type { Joke, JokeMediaItem } from '@/lib/api'
import { jokeProvenance, languageCode, type JokeProvenance, type ProvenanceFields } from '@/lib/jokeProvenance'
import { formatSlugToFlow, type FlowJokeFormat } from './jokeFormats'

export interface FlowJokeData {
  id: number | string
  fmt: FlowJokeFormat

  // Format-specific text fields. Use what's relevant for the format.
  setup?: string         // setup, anti
  punch?: string         // setup, anti
  text?: string          // oneliner, observ, story
  lines?: string[]       // knock-knock alternating bubbles
  media?: JokeMediaItem[] // image (wave 2: video/audio)

  /** BCP 47 code of the joke text; set as `lang` on the card. */
  language?: string
  /** Language / origin / AI-generated badges (see jokeProvenance). */
  provenance?: JokeProvenance
  themeLabel?: string
  catLabel?: string

  // Engagement stats (display-only — strings to allow "4.1K" style).
  laughs?: string | number
  saves?: string | number

  // Story extras
  read?: string          // "2 min" / "30 sec"

  /** Server-withheld payoff (`is_locked`). When true the card renders
   * an unavailable state without exposing withheld content. */
  isLocked?: boolean
}

/** `language` + `provenance` for any joke-shaped payload. */
export function localeFields(joke: ProvenanceFields | null | undefined): Pick<FlowJokeData, 'language' | 'provenance'> {
  if (!joke) return {}
  return { language: languageCode(joke.language), provenance: jokeProvenance(joke) }
}

// ──────────────────────────────────────────────────────────────────────────
// Adapter: real Joke (with new schema) → FlowJokeData
// ──────────────────────────────────────────────────────────────────────────

// The real lean list serializer (JokeListSerializer) emits `format`,
// `tones`/`categories`, `context_tags`/`themes` as slug STRINGS, whereas the
// detail serializer emits nested { id, name, slug } objects. These helpers
// tolerate either shape so a card renders (and links to the right id) in both.
function taxonSlug(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'slug' in value) {
    return String((value as { slug?: unknown }).slug ?? '')
  }
  return ''
}

function prettifySlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function taxonLabel(value: unknown): string | undefined {
  if (typeof value === 'string') return value ? prettifySlug(value) : undefined
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name
    return typeof name === 'string' ? name : undefined
  }
  return undefined
}

export function jokeToFlowData(joke: Joke): FlowJokeData | null {
  const slug = taxonSlug(joke.format).toLowerCase()
  let fmt = formatSlugToFlow(slug)
  if (fmt === null) {
    // Slugless (mock fixtures / legacy rows without a format at all): fall
    // back by shape, same as before the guard existed.
    if (slug === '') {
      fmt = joke.setup && joke.punchline ? 'setup' : joke.text ? 'oneliner' : null
    }
    if (fmt === null) return null // unknown format (future wave) → hide, don't garble
  }

  // Prefer new vocabulary (themes/categories), fall back to legacy
  // (context_tags/tones). Each entry may be a slug string or a taxon object.
  const themeLabel = taxonLabel(joke.themes?.[0]) ?? taxonLabel(joke.context_tags?.[0])
  const catLabel = taxonLabel(joke.categories?.[0]) ?? taxonLabel(joke.tones?.[0])

  return {
    id: joke.id,
    fmt,
    setup: joke.setup ?? undefined,
    punch: joke.punchline ?? undefined,
    text: joke.text ?? undefined,
    lines: joke.lines ?? undefined,
    media: joke.media ?? undefined,
    themeLabel,
    catLabel,
    ...localeFields(joke),
    // GRACEFUL DEGRADATION: only lock when the backend explicitly says so.
    // A missing `is_locked` (backend not deployed) reads as unlocked.
    isLocked: joke.is_locked === true,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Adapters for the nested `{ joke }` shapes (saved jokes, favorites).
// Format inference is lossy (legacy Joke has format.slug).
// ──────────────────────────────────────────────────────────────────────────

/** The joke fields the saved/favorite adapters read. */
export interface NestedJoke extends ProvenanceFields {
  id: number
  text: string
  setup: string | null
  punchline: string | null
  format?: { slug: string }
  media?: JokeMediaItem[]
}

/** SavedJoke (Library, collection detail) → FlowJokeData. */
export function savedJokeToFlowData(saved: { id: number; joke: NestedJoke }): FlowJokeData | null {
  const fmt = formatSlugToFlow(saved.joke?.format?.slug)
  if (fmt === null) return null // unknown format → skip render, don't garble
  return {
    id: saved.id,
    fmt,
    setup: saved.joke?.setup ?? undefined,
    punch: saved.joke?.punchline ?? undefined,
    text: saved.joke?.text ?? undefined,
    media: saved.joke?.media ?? undefined,
    ...localeFields(saved.joke),
  }
}

/** Favorite → FlowJokeData; `idx` is the fallback id for a joke-less row. */
export function favoriteToFlowData(fav: { joke: NestedJoke }, idx: number): FlowJokeData | null {
  const fmt = formatSlugToFlow(fav.joke?.format?.slug)
  if (fmt === null) return null // unknown format → skip render, don't garble
  return {
    id: fav.joke?.id ?? idx,
    fmt,
    setup: fav.joke?.setup ?? undefined,
    punch: fav.joke?.punchline ?? undefined,
    text: fav.joke?.text ?? undefined,
    media: fav.joke?.media ?? undefined,
    ...localeFields(fav.joke),
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Adapter — TrendingJoke → FlowJokeData
// ──────────────────────────────────────────────────────────────────────────

export function trendingToFlowData(
  tj: {
    joke: {
      id: number
      text: string
      setup: string | null
      punchline: string | null
      format?: { slug: string; name?: string }
      tones?: { name: string }[]
      media?: JokeMediaItem[]
    } & ProvenanceFields
    likes: number
    shares: number
  },
  fallbackId: number,
): FlowJokeData | null {
  const slug = (tj.joke?.format?.slug ?? '').toLowerCase()
  let fmt = formatSlugToFlow(slug)
  if (fmt === null) {
    if (slug === '') {
      // slugless: fall back by shape as before
      fmt = tj.joke?.setup && tj.joke?.punchline ? 'setup' : tj.joke?.text ? 'oneliner' : null
    }
    if (fmt === null) return null // unknown format → hide, don't garble
  }

  return {
    id: tj.joke?.id ?? fallbackId,
    fmt,
    setup: tj.joke?.setup ?? undefined,
    punch: tj.joke?.punchline ?? undefined,
    text: tj.joke?.text,
    media: tj.joke?.media ?? undefined,
    catLabel: tj.joke?.tones?.[0]?.name,
    ...localeFields(tj.joke),
    saves: String(tj.shares ?? '—'),
    laughs: String(tj.likes ?? '—'),
  }
}
