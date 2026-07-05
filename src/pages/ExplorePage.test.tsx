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

  it('maps a Format chip to the backend joke_format slug', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'One-liner' }))
    expect(lastParams().joke_format).toBe('one_liner')
  })

  it('maps a Theme chip to context_tags and a Category chip to tones', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Work' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dad' }))
    const p = lastParams()
    expect(p.context_tags).toBe('work')
    expect(p.tones).toBe('dad')
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
})
