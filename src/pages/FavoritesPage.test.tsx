import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

vi.mock('@/components/FlowJokeCard', () => ({
  FlowJokeCard: ({ joke }: { joke: { id: number | string } }) => (
    <div data-testid="joke-card">joke-{String(joke.id)}</div>
  ),
}))

const mockUseFavorites = vi.fn()
vi.mock('@/features/favorites', () => ({
  useFavorites: (params: { tones?: string; page?: number }) => mockUseFavorites(params),
  useFavoriteStats: () => ({ data: { totalCount: 3, topTone: 'Dad', thisWeekCount: 1 } }),
}))

import { FavoritesPage, favoriteToFlowData } from './FavoritesPage'

type Fav = { joke: { id: number; text: string; setup: string | null; punchline: string | null; format?: { slug: string } } }

function makeFav(id: number, slug = 'oneliner'): Fav {
  return { joke: { id, text: `fav ${id}`, setup: null, punchline: null, format: { slug } } }
}

function favPage(items: Fav[], count = items.length, next: string | null = null) {
  return { data: { count, next, previous: null, results: items }, isLoading: false, isError: false, isFetching: false }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/favorites']}>
      <FavoritesPage />
    </MemoryRouter>,
  )
}

function lastParams() {
  const calls = mockUseFavorites.mock.calls
  return calls[calls.length - 1][0] as { tones?: string; page?: number }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseFavorites.mockReturnValue(favPage([makeFav(31), makeFav(32)]))
})

describe('FavoritesPage — tone filter sends real slugs', () => {
  it('the "Office" tone chip sends the real `office-proper` slug (not `office`)', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Office' }))
    expect(lastParams().tones).toBe('office-proper')
  })

  it('the "Dad" tone chip sends `dad`', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Dad' }))
    expect(lastParams().tones).toBe('dad')
  })

  it('renders the error state when the favorites query fails', () => {
    mockUseFavorites.mockReturnValue({ data: undefined, isLoading: false, isError: true, isFetching: false })
    renderPage()
    expect(screen.getByText(/Couldn't load your favorites/)).toBeDefined()
  })
})

describe('FavoritesPage — pagination', () => {
  it('"Load more" fetches page 2 and appends the new favorites', () => {
    const p1 = favPage([makeFav(31), makeFav(32)], 3, 'x')
    const p2 = favPage([makeFav(33)], 3, null)
    mockUseFavorites.mockImplementation((params: { page?: number }) => ((params.page ?? 1) >= 2 ? p2 : p1))

    renderPage()
    expect(screen.getByText('joke-31')).toBeDefined()
    expect(screen.queryByText('joke-33')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /load more/i }))

    expect(lastParams().page).toBe(2)
    expect(screen.getByText('joke-31')).toBeDefined()
    expect(screen.getByText('joke-33')).toBeDefined()
  })
})

describe('favoriteToFlowData — real DB format slugs', () => {
  it('resolves a favorited setup-punchline (real slug `setup`) to the setup skin', () => {
    const flow = favoriteToFlowData(
      { joke: { id: 5, text: '', setup: 'Q?', punchline: 'A!', format: { slug: 'setup' } } },
      0,
    )
    expect(flow).not.toBeNull()
    expect(flow!.fmt).toBe('setup')
    expect(flow!.id).toBe(5)
  })
})
