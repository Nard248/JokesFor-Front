import { describe, it, expect } from 'vitest'
import { jokeToFlowData } from './FlowJokeCard'
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
    expect(flow.id).toBe(11)
    expect(flow.fmt).toBe('oneliner')
    expect(flow.text).toBe('A one-liner')
    // slug strings get prettified into display labels
    expect(flow.catLabel).toBe('Nerd')
    expect(flow.themeLabel).toBe('Work')
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
    expect(flow.id).toBe(7)
    expect(flow.fmt).toBe('setup')
    expect(flow.setup).toContain('scarecrow')
    expect(flow.punch).toContain('outstanding')
    expect(flow.catLabel).toBe('Dad')
    expect(flow.themeLabel).toBe('Animals')
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
    expect(flow.fmt).toBe('observ')
    expect(flow.catLabel).toBe('Wholesome')
    expect(flow.themeLabel).toBe('Food')
  })

  it('falls back to oneliner when the format is unknown/empty', () => {
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

    expect(jokeToFlowData(raw).fmt).toBe('oneliner')
  })
})
