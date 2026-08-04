import { describe, it, expect } from 'vitest'
import { jokeJsonLd } from './jsonld'
import type { Joke } from '@/lib/api'

function makeJoke(overrides: Partial<Joke> = {}): Joke {
  return {
    id: 42,
    setup: 'Why did the chicken cross the road?',
    punchline: 'To get to the other side.',
    text: 'Why did the chicken cross the road? To get to the other side.',
    is_locked: false,
    created_at: '2026-01-01T00:00:00Z',
    language: { code: 'en' },
    format: { name: 'Setup & Punchline' },
    share_image_url: null,
    ...overrides,
  } as unknown as Joke
}

describe('jokeJsonLd', () => {
  it('includes setup + punchline for an unlocked joke', () => {
    const ld = jokeJsonLd(makeJoke()) as { text: string }
    expect(ld.text).toContain('other side')
  })

  it('does NOT republish the withheld punchline for a locked two-part joke', () => {
    // Server behaviour for a locked non-one-liner: `punchline` is nulled but
    // `text` still carries the full joke. jokeJsonLd must not re-leak it into
    // crawlable structured data (paywall regression guard).
    const locked = makeJoke({
      is_locked: true,
      punchline: null,
      text: 'Why did the chicken cross the road? To get to the other side.',
    })
    const ld = jokeJsonLd(locked) as { text?: string }
    expect(ld.text).toBe('Why did the chicken cross the road?') // setup only
    expect(ld.text).not.toContain('other side')
  })

  it('omits text entirely for a locked one-liner (setup + text both withheld)', () => {
    const lockedOneLiner = makeJoke({
      is_locked: true,
      setup: null,
      punchline: null,
      text: undefined, // server nulls text for a locked text-only format; typed string|undefined here
    })
    const ld = jokeJsonLd(lockedOneLiner) as { text?: string }
    expect(ld.text).toBeUndefined()
  })
})
