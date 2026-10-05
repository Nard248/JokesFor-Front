/**
 * Joke format vocabulary shared by the renderer, the card and the pages:
 * UI format ids, skins, labels and backend slug mapping. Plain data/functions
 * live here (not in JokeRenderer.tsx) so that file only exports components.
 */

export type FlowJokeFormat = 'setup' | 'oneliner' | 'observ' | 'anti' | 'knock' | 'story' | 'image' | 'video' | 'audio'

export interface SkinSpec { bg: string; fg: string; border: string; divider: string }

export const SKIN: Record<FlowJokeFormat, SkinSpec> = {
  setup:    { bg: '#FFFFFF',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  oneliner: { bg: '#CAFD00',  fg: '#3A4A00', border: 'none',              divider: 'rgba(58,74,0,0.18)' },
  observ:   { bg: '#FBFAF7',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  anti:     { bg: '#1A1A1A',  fg: '#FFFFFF', border: 'none',              divider: 'rgba(255,255,255,0.14)' },
  knock:    { bg: '#FFFFFF',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  story:    { bg: '#FFC965',  fg: '#5F4200', border: 'none',              divider: 'rgba(95,66,0,0.2)' },
  image:    { bg: '#FFFFFF',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  video:    { bg: '#FFFFFF',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  audio:    { bg: '#F2E9FF',  fg: '#6A1CF6', border: 'none',              divider: 'rgba(106,28,246,0.18)' },
}

export const FORMAT_LABEL: Record<FlowJokeFormat, string> = {
  setup: 'Setup → Punchline', oneliner: 'One-liner', observ: 'Observational',
  anti: 'Anti-joke', knock: 'Knock-knock', story: 'Story', image: 'Image',
  video: 'Video', audio: 'Audio',
}

/**
 * Map a UI FlowJokeFormat to the backend JokeFormat slug for the
 * `joke_format` query param (JokeViewSet.list). These are the REAL slugs
 * stored in the DB (verified against /jokes/?joke_format=…): the flow
 * formats map 1:1 onto the short-form slugs the backend actually filters on.
 * (The long-form guesses `setup_punchline`/`one_liner`/etc. returned 0 rows.)
 */
export const FLOW_FORMAT_TO_BACKEND_SLUG: Record<FlowJokeFormat, string> = {
  setup: 'setup',
  oneliner: 'oneliner',
  observ: 'observ',
  anti: 'anti',
  knock: 'knock',
  story: 'story',
  image: 'image',
  video: 'video',
  audio: 'audio',
}

/**
 * Resolve a backend format slug (from `format.slug` on a saved/favorite joke)
 * to the UI FlowJokeFormat that picks the render skin. Tolerant of BOTH the
 * real DB slugs (`setup`/`oneliner`/`observ`/`anti`/`knock`/`story`/`short-story`/`image`/`video`/`audio`)
 * and the older long-form guesses (`setup_punchline`/`one_liner`/…) so a saved
 * joke never silently renders in the wrong skin (e.g. a setup as a one-liner).
 *
 * Returns `null` for an empty slug (caller falls back by shape) or an
 * unrecognized slug (a future format wave not yet supported here) — the
 * caller must skip rendering rather than garble it into the wrong skin.
 */
export function formatSlugToFlow(rawSlug: string | null | undefined): FlowJokeFormat | null {
  switch ((rawSlug ?? '').toLowerCase()) {
    case 'setup':
    case 'setup_punchline':
    case 'setup-punchline':
      return 'setup'
    case 'oneliner':
    case 'one_liner':
    case 'one-liner':
      return 'oneliner'
    case 'observ':
    case 'observational':
      return 'observ'
    case 'anti':
    case 'anti_joke':
    case 'anti-joke':
      return 'anti'
    case 'knock':
    case 'knock_knock':
    case 'knock-knock':
      return 'knock'
    case 'story':
    case 'short-story':
    case 'short_story':
      return 'story'
    case 'image':
      return 'image'
    case 'video':
      return 'video'
    case 'audio':
      return 'audio'
    case '':
      return null   // slugless: caller falls back by shape
    default:
      return null   // unknown format (future wave) → skip render, don't garble
  }
}

export function formatLabelFor(fmt: FlowJokeFormat): string { return FORMAT_LABEL[fmt] }

export function tagToneFor(fmt: FlowJokeFormat): string {
  switch (fmt) {
    case 'oneliner':
    case 'anti': return 'dark'
    case 'observ':
    case 'knock':
    case 'story':
    case 'image':
    case 'video':
    case 'audio': return 'amber'
    case 'setup':
    default: return ''
  }
}
