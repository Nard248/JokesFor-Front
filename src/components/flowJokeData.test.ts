import { describe, it, expect } from 'vitest'
import { favoriteToFlowData, jokeToFlowData, savedJokeToFlowData, trendingToFlowData } from './flowJokeData'
import type { Joke } from '@/lib/api'

/**
 * jokeToFlowData must tolerate BOTH real-backend shapes:
 *  - the lean list serializer (JokeListSerializer) emits format / tones /
 *    context_tags as slug STRINGS
 *  - the detail serializer emits nested { id, name, slug } objects
 * Explore/Search render from the lean list shape, so a crash or a wrong
 * format here is what made mock cards open unrelated jokes before.
 */
describe('jokeToFlowData — tolerant DTO mapping', () => {
  it('maps a lean list joke (format + tags as slug strings)', () => {
    const raw = {
      id: 11,
      text: 'A one-liner',
      setup: null,
      punchline: null,
      format: 'one_liner',
      age_rating: 'family_friendly',
      tones: ['nerd'],
      context_tags: ['work'],
      culture_tags: [],
      language: { id: 1, name: 'English', code: 'en' },
      source: 'community',
      share_image_url: null,
      created_at: '2026-01-01T00:00:00Z',
    } as unknown as Joke

    const flow = jokeToFlowData(raw)
    expect(flow).not.toBeNull()
    expect(flow!.id).toBe(11)
    expect(flow!.fmt).toBe('oneliner')
    expect(flow!.text).toBe('A one-liner')
    // slug strings get prettified into display labels
    expect(flow!.catLabel).toBe('Nerd')
    expect(flow!.themeLabel).toBe('Work')
  })

  it('maps a detail joke (format + tags as nested objects)', () => {
    const raw = {
      id: 7,
      text: '',
      setup: 'Why did the scarecrow win an award?',
      punchline: 'He was outstanding in his field.',
      format: { id: 2, name: 'Setup → Punchline', slug: 'setup_punchline' },
      age_rating: { id: 1, name: 'Family', slug: 'family_friendly', min_age: 0 },
      tones: [{ id: 3, name: 'Dad', slug: 'dad' }],
      context_tags: [{ id: 4, name: 'Animals', slug: 'animals' }],
      culture_tags: [],
      language: { id: 1, name: 'English', code: 'en' },
      source: 'community',
      share_image_url: null,
      created_at: '2026-01-01T00:00:00Z',
    } as unknown as Joke

    const flow = jokeToFlowData(raw)
    expect(flow).not.toBeNull()
    expect(flow!.id).toBe(7)
    expect(flow!.fmt).toBe('setup')
    expect(flow!.setup).toContain('scarecrow')
    expect(flow!.punch).toContain('outstanding')
    expect(flow!.catLabel).toBe('Dad')
    expect(flow!.themeLabel).toBe('Animals')
  })

  it('prefers new-vocabulary categories/themes over legacy tones/context_tags', () => {
    const raw = {
      id: 3,
      text: 'observ',
      setup: null,
      punchline: null,
      format: 'observational',
      age_rating: 'family_friendly',
      tones: ['office'],
      categories: [{ id: 9, name: 'Wholesome', slug: 'wholesome' }],
      context_tags: ['work'],
      themes: [{ id: 8, name: 'Food', slug: 'food' }],
      culture_tags: [],
      language: { id: 1, name: 'English', code: 'en' },
      source: 'community',
      share_image_url: null,
      created_at: '2026-01-01T00:00:00Z',
    } as unknown as Joke

    const flow = jokeToFlowData(raw)
    expect(flow).not.toBeNull()
    expect(flow!.fmt).toBe('observ')
    expect(flow!.catLabel).toBe('Wholesome')
    expect(flow!.themeLabel).toBe('Food')
  })

  it('falls back by shape (setup/oneliner) when the slug is empty', () => {
    const raw = {
      id: 1,
      text: 'no format',
      setup: null,
      punchline: null,
      format: '',
      age_rating: '',
      tones: [],
      context_tags: [],
      culture_tags: [],
      language: { id: 1, name: 'English', code: 'en' },
      source: 'community',
      share_image_url: null,
      created_at: '2026-01-01T00:00:00Z',
    } as unknown as Joke

    expect(jokeToFlowData(raw)?.fmt).toBe('oneliner')
  })

  it('returns null (skip render) for an unrecognized format slug', () => {
    const raw = {
      id: 2,
      text: 'mystery',
      setup: null,
      punchline: null,
      format: 'hologram',
      age_rating: '',
      tones: [],
      context_tags: [],
      culture_tags: [],
      language: { id: 1, name: 'English', code: 'en' },
      source: 'community',
      share_image_url: null,
      created_at: '2026-01-01T00:00:00Z',
    } as unknown as Joke

    expect(jokeToFlowData(raw)).toBeNull()
  })
})

describe('provenance mapping (language / origin / editorial status)', () => {
  const base = {
    id: 7,
    text: 'Chiste',
    setup: '¿Qué le dijo una pared a otra?',
    punchline: 'Nos vemos en la esquina.',
    format: { id: 1, name: 'Setup', slug: 'setup' },
    age_rating: { id: 1, name: 'All ages', slug: 'all', min_age: 0 },
    tones: [],
    context_tags: [],
    culture_tags: [],
    language: { id: 2, name: 'Spanish', code: 'es', native_name: 'Español' },
    origin_country: { code: 'MX', name: 'Mexico', native_name: 'México' },
    editorial_status: 'ai_screened',
    source: 'editorial',
    share_image_url: null,
    created_at: '2026-10-01T00:00:00Z',
  } as unknown as Joke

  it('jokeToFlowData carries the lang code and all three badges', () => {
    const flow = jokeToFlowData(base)!
    expect(flow.language).toBe('es')
    expect(flow.provenance).toEqual({
      languageCode: 'es',
      languageName: 'Spanish',
      languageLabel: 'Español',
      origin: { code: 'MX', name: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}' },
      aiGenerated: true,
    })
  })

  it('an English, human-written joke without origin gets no badges', () => {
    const flow = jokeToFlowData({
      ...base,
      language: { id: 1, name: 'English', code: 'en' },
      origin_country: null,
      editorial_status: 'native_reviewed',
    } as Joke)!
    expect(flow.language).toBe('en')
    expect(flow.provenance).toEqual({})
  })

  it('degrades gracefully when the backend omits the new fields', () => {
    const { origin_country: _o, editorial_status: _e, language: _l, ...legacy } = base
    const flow = jokeToFlowData(legacy as Joke)!
    expect(flow.language).toBeUndefined()
    expect(flow.provenance).toEqual({})
  })

  const nested = {
    id: 7,
    text: 'Chiste',
    setup: null,
    punchline: null,
    format: { slug: 'oneliner' },
    language: { code: 'es', name: 'Spanish', native_name: 'Español' },
    origin_country: { code: 'ES', name: 'Spain', native_name: 'España' },
    editorial_status: 'ai_screened',
  }

  it('savedJokeToFlowData maps provenance from the nested joke', () => {
    const flow = savedJokeToFlowData({ id: 3, joke: nested })!
    expect(flow.language).toBe('es')
    expect(flow.provenance?.languageLabel).toBe('Español')
    expect(flow.provenance?.origin?.name).toBe('Spain')
    expect(flow.provenance?.aiGenerated).toBe(true)
  })

  it('favoriteToFlowData maps provenance from the nested joke', () => {
    const flow = favoriteToFlowData({ joke: nested }, 0)!
    expect(flow.language).toBe('es')
    expect(flow.provenance?.origin?.flag).toBe('\u{1F1EA}\u{1F1F8}')
    expect(flow.provenance?.aiGenerated).toBe(true)
  })

  it('trendingToFlowData maps provenance and keeps English trending jokes badge-free', () => {
    const flow = trendingToFlowData({ joke: nested, likes: 1, shares: 2 }, 0)!
    expect(flow.language).toBe('es')
    expect(flow.provenance?.languageLabel).toBe('Español')
    expect(flow.provenance?.aiGenerated).toBe(true)
    const en = trendingToFlowData({ joke: { ...nested, language: { code: 'en', name: 'English' }, origin_country: null, editorial_status: 'legacy' }, likes: 0, shares: 0 }, 1)!
    expect(en.provenance).toEqual({})
  })
})
