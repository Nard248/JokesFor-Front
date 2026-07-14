import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Joke, JokeSearchParams, PaginatedResponse } from '@/lib/api'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

// Mock the card so the test focuses on data source, ids, links and params —
// not the card internals (telemetry / reactions). jokeToFlowData passes the
// joke through so the identifying id is preserved.
vi.mock('@/components/FlowJokeCard', () => ({
  FlowJokeCard: ({ joke }: { joke: { id: number | string } }) => (
    <div data-testid="joke-card">joke-{String(joke.id)}</div>
  ),
  jokeToFlowData: (j: unknown) => j,
}))

const mockUseJokeSearch = vi.fn()
vi.mock('@/features/jokes', () => ({
  useJokeSearch: (params: JokeSearchParams) => mockUseJokeSearch(params),
}))

import { ExplorePage } from './ExplorePage'

function makeJoke(id: number): Joke {
  return {
    id,
    text: `joke ${id}`,
    setup: null,
    punchline: null,
    format: 'one_liner',
    age_rating: 'family_friendly',
    tones: [],
    context_tags: [],
    culture_tags: [],
    language: { id: 1, name: 'English', code: 'en' },
    source: 'community',
    share_image_url: null,
    created_at: '2026-01-01T00:00:00Z',
  } as unknown as Joke
}

function page(jokes: Joke[]): PaginatedResponse<Joke> {
  return { count: jokes.length, next: null, previous: null, results: jokes }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/explore']}>
      <ExplorePage />
    </MemoryRouter>,
  )
}

function lastParams(): JokeSearchParams {
  const calls = mockUseJokeSearch.mock.calls
  return calls[calls.length - 1][0] as JokeSearchParams
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseJokeSearch.mockReturnValue({
    data: page([makeJoke(11), makeJoke(12)]),
    isLoading: false,
    isError: false,
  })
})

describe('ExplorePage — real backend search', () => {
  it('renders real jokes and links each card to the correct joke id', () => {
    renderPage()
    const card = screen.getByText('joke-11')
    expect(card).toBeDefined()
    const anchor = card.closest('a')
    expect(anchor?.getAttribute('href')).toBe('/jokes/11?source=explore')
    expect(screen.getByText('joke-12').closest('a')?.getAttribute('href')).toBe(
      '/jokes/12?source=explore',
    )
  })

  it('shows the real total count from the paginated response', () => {
    renderPage()
    expect(screen.getByText(/2 jokes loaded/)).toBeDefined()
  })

  it('keeps the query enabled by default (page:1, no filters)', () => {
    renderPage()
    const p = lastParams()
    expect(p.page).toBe(1)
    expect(p.joke_format).toBeUndefined()
    expect(p.tones).toBeUndefined()
    expect(p.context_tags).toBeUndefined()
  })

  it('maps a Format chip to the REAL backend joke_format slug', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'One-liner' }))
    // The real DB slug is `oneliner`, not the invented `one_liner` (which
    // returned 0 rows). See FLOW_FORMAT_TO_BACKEND_SLUG.
    expect(lastParams().joke_format).toBe('oneliner')
    fireEvent.click(screen.getByRole('button', { name: 'Setup → Punchline' }))
    // Multiple formats join as comma slugs, both real.
    expect(lastParams().joke_format).toBe('oneliner,setup')
  })

  it('maps a Theme chip to context_tags and a Category chip to tones', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Work' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dad' }))
    const p = lastParams()
    expect(p.context_tags).toBe('work')
    expect(p.tones).toBe('dad')
  })

  it('sends the REAL tone slug for remapped Category chips (office-proper / kid-safe)', () => {
    renderPage()
    // These chips used to send `office` / `kid`, which return 0 rows.
    fireEvent.click(screen.getByRole('button', { name: 'Office-proper' }))
    expect(lastParams().tones).toBe('office-proper')
    fireEvent.click(screen.getByRole('button', { name: 'Kid-safe' }))
    expect(lastParams().tones).toBe('office-proper,kid-safe')
  })

  it('renders a loading skeleton while fetching', () => {
    mockUseJokeSearch.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderPage()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('renders the empty state when there are no results', () => {
    mockUseJokeSearch.mockReturnValue({ data: page([]), isLoading: false, isError: false })
    renderPage()
    expect(screen.getByText(/No jokes match/)).toBeDefined()
  })

  it('does NOT interleave the fabricated "Curator note" editorial tile', () => {
    // Enough results that the old code would have injected the hardcoded
    // editorial quote at result index 4. No real curation source exists.
    mockUseJokeSearch.mockReturnValue({
      data: page([11, 12, 13, 14, 15, 16].map(makeJoke)),
      isLoading: false,
      isError: false,
    })
    renderPage()
    expect(screen.queryByText(/Curator note/i)).toBeNull()
    expect(screen.queryByText(/leaned hard into puns/i)).toBeNull()
    expect(screen.queryByText(/The JokesFor desk/i)).toBeNull()
  })

  it('paginates: "Load more" fetches page 2 and appends the new results', () => {
    // Page 1 has 2 of 3 total (hasMore); page 2 delivers the third joke.
    const p1 = {
      data: { count: 3, next: 'x', previous: null, results: [makeJoke(11), makeJoke(12)] },
      isLoading: false, isError: false, isFetching: false,
    }
    const p2 = {
      data: { count: 3, next: null, previous: 'x', results: [makeJoke(13)] },
      isLoading: false, isError: false, isFetching: false,
    }
    // Return STABLE references per page so the accumulation effect only fires
    // when the page actually changes.
    mockUseJokeSearch.mockImplementation((p: JokeSearchParams) => ((p.page ?? 1) >= 2 ? p2 : p1))

    renderPage()
    // Page 1 rendered; page 3 not yet requested.
    expect(screen.getByText('joke-11')).toBeDefined()
    expect(screen.queryByText('joke-13')).toBeNull()
    expect(lastParams().page).toBe(1)

    fireEvent.click(screen.getByRole('button', { name: /load more/i }))

    // Page 2 requested, and its result is appended to the accumulated grid.
    expect(lastParams().page).toBe(2)
    expect(screen.getByText('joke-11')).toBeDefined()
    expect(screen.getByText('joke-13')).toBeDefined()
  })
})
