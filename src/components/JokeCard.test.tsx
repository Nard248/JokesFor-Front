import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Joke } from '@/lib/api'
import { mockAuthors } from '@/lib/mock-data'
import { JokeCard } from './JokeCard'

function makeJoke(id: number): Joke {
  return {
    id,
    text: 'Why did the scarecrow win an award? He was outstanding in his field.',
    setup: null,
    punchline: null,
    format: { id: 1, name: 'One-Liner', slug: 'one_liner' },
    age_rating: { id: 1, name: 'Family', slug: 'family_friendly', min_age: 0 },
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [],
    culture_tags: [],
    language: { id: 1, name: 'English', code: 'en' },
    source: 'community',
    share_image_url: null,
    created_at: '2026-01-01T00:00:00Z',
  } as unknown as Joke
}

describe('JokeCard', () => {
  it('renders the joke text and its tone badge', () => {
    render(<JokeCard joke={makeJoke(3)} />)
    expect(screen.getByText(/outstanding in his field/i)).toBeDefined()
    expect(screen.getByText('Punny')).toBeDefined()
  })

  it('never renders a fabricated @handle byline (Joke payload carries no author)', () => {
    // The old card derived a fake author from mockAuthors[joke.id % N] and always
    // rendered an invented @handle + avatar on real jokes. Verify no id produces
    // any '@'-prefixed handle text.
    for (const id of [1, 2, 3, 7, 42]) {
      const { unmount } = render(<JokeCard joke={makeJoke(id)} />)
      expect(screen.queryByText(/^@/)).toBeNull()
      unmount()
    }
  })

  it('does not surface any of the seeded mock author usernames', () => {
    render(<JokeCard joke={makeJoke(3)} />)
    for (const author of Object.values(mockAuthors)) {
      expect(screen.queryByText(author.username)).toBeNull()
    }
  })
})
