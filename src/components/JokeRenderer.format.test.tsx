import { describe, it, expect } from 'vitest'
import { formatSlugToFlow, SKIN, FORMAT_LABEL, FLOW_FORMAT_TO_BACKEND_SLUG } from './JokeRenderer'
import { jokeToFlowData } from './FlowJokeCard'
import type { Joke } from '@/lib/api'

function makeJoke(overrides: Partial<Joke> = {}): Joke {
  return {
    id: 1, text: 'caption', setup: 'caption', punchline: null,
    format: { id: 9, name: 'Image', slug: 'image' },
    age_rating: { id: 1, name: 'All Ages', slug: 'all-ages', min_age: 0 },
    tones: [], context_tags: [], culture_tags: [],
    language: { id: 1, name: 'English', code: 'en' },
    source: 'original', share_image_url: null, created_at: '2026-07-20T00:00:00Z',
    ...overrides,
  } as Joke
}

describe('image format registration', () => {
  it('maps the image slug and has card chrome entries', () => {
    expect(formatSlugToFlow('image')).toBe('image')
    expect(SKIN.image).toBeDefined()
    expect(FORMAT_LABEL.image).toBe('Image')
    expect(FLOW_FORMAT_TO_BACKEND_SLUG.image).toBe('image')
  })

  it('threads media through jokeToFlowData', () => {
    const joke = makeJoke({
      media: [{ kind: 'image', url: 'http://x/img.webp', width: 800, height: 600 }],
    })
    const flow = jokeToFlowData(joke)
    expect(flow).not.toBeNull()
    expect(flow!.fmt).toBe('image')
    expect(flow!.media?.[0].url).toBe('http://x/img.webp')
  })
})

describe('unknown-format guard', () => {
  it('formatSlugToFlow returns null for unknown slugs', () => {
    expect(formatSlugToFlow('hologram')).toBeNull()
  })

  it('jokeToFlowData returns null for unknown slugs instead of a garbled card', () => {
    const joke = makeJoke({ format: { id: 99, name: 'Hologram', slug: 'hologram' } })
    expect(jokeToFlowData(joke)).toBeNull()
  })

  it('legacy long-form slugs still resolve (regression)', () => {
    expect(formatSlugToFlow('setup_punchline')).toBe('setup')
    expect(formatSlugToFlow('one-liner')).toBe('oneliner')
  })

  it('slugless jokes still fall back by shape (regression)', () => {
    const joke = makeJoke({
      format: { id: 0, name: '', slug: '' }, setup: 's', punchline: 'p',
    })
    expect(jokeToFlowData(joke)?.fmt).toBe('setup')
  })
})
