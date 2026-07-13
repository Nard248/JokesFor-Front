import React, { act } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Joke, JokeSearchParams, PaginatedResponse } from '@/lib/api'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

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

import { SearchPage } from './SearchPage'

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
    <MemoryRouter initialEntries={['/search']}>
      <SearchPage />
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
    data: page([makeJoke(21), makeJoke(22)]),
    isLoading: false,
    isError: false,
  })
})

describe('SearchPage — real backend search', () => {
  it('renders real jokes and links each card to the correct joke id', () => {
    renderPage()
    expect(screen.getByText('joke-21').closest('a')?.getAttribute('href')).toBe(
      '/jokes/21?source=search',
    )
    expect(screen.getByText('joke-22').closest('a')?.getAttribute('href')).toBe(
      '/jokes/22?source=search',
    )
  })

  it('shows the real match count', () => {
    renderPage()
    expect(screen.getByText(/2 matches/)).toBeDefined()
  })

  it('maps a quick prompt to joke_format / context_tags / tones', () => {
    renderPage()
    // "Dad-joke ammo" → fmts: [oneliner], themes: [family], cats: [dad]
    fireEvent.click(screen.getByRole('button', { name: 'Dad-joke ammo' }))
    const p = lastParams()
    // Real backend slug is `oneliner`, not `one_liner`.
    expect(p.joke_format).toBe('oneliner')
    expect(p.context_tags).toBe('family')
    expect(p.tones).toBe('dad')
  })

  it('quick prompt sends the REAL office-proper tone slug', () => {
    renderPage()
    // "Office Slack-safe" → cats: [office-proper] (was the empty-returning `office`)
    fireEvent.click(screen.getByRole('button', { name: 'Office Slack-safe' }))
    expect(lastParams().tones).toBe('office-proper')
  })

  it('wires the debounced keyword box to the real full-text q param', () => {
    vi.useFakeTimers()
    try {
      renderPage()
      const input = screen.getByPlaceholderText(/Refine with a keyword/)
      fireEvent.change(input, { target: { value: 'coffee' } })
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(lastParams().q).toBe('coffee')
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders the empty state when there are no matches', () => {
    mockUseJokeSearch.mockReturnValue({ data: page([]), isLoading: false, isError: false })
    renderPage()
    expect(screen.getByText(/No jokes for that exact/)).toBeDefined()
  })

  it('paginates: "Load more" fetches page 2 and appends the new results', () => {
    const p1 = {
      data: { count: 3, next: 'x', previous: null, results: [makeJoke(21), makeJoke(22)] },
      isLoading: false, isError: false, isFetching: false,
    }
    const p2 = {
      data: { count: 3, next: null, previous: 'x', results: [makeJoke(23)] },
      isLoading: false, isError: false, isFetching: false,
    }
    mockUseJokeSearch.mockImplementation((p: JokeSearchParams) => ((p.page ?? 1) >= 2 ? p2 : p1))

    renderPage()
    expect(screen.getByText('joke-21')).toBeDefined()
    expect(screen.queryByText('joke-23')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /load more/i }))

    expect(lastParams().page).toBe(2)
    expect(screen.getByText('joke-21')).toBeDefined()
    expect(screen.getByText('joke-23')).toBeDefined()
  })
})

afterEach(() => {
  vi.useRealTimers()
})
