import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

// Card is mocked — Library tests focus on collection wiring + the saved-joke
// adapter, not the card internals (telemetry / reactions need a QueryClient).
vi.mock('@/components/FlowJokeCard', () => ({
  FlowJokeCard: ({ joke }: { joke: { id: number | string } }) => (
    <div data-testid="joke-card">joke-{String(joke.id)}</div>
  ),
}))

const mockUseCollections = vi.fn()
vi.mock('@/features/collections', () => ({
  useCollections: () => mockUseCollections(),
}))

const mockUseSavedJokes = vi.fn()
vi.mock('@/features/saved-jokes', () => ({
  useSavedJokes: () => mockUseSavedJokes(),
}))

import { LibraryPage, savedJokeToFlowData } from './LibraryPage'

function collectionsPage(items: { id: number; name: string; joke_count: number; is_default: boolean }[]) {
  return { data: { count: items.length, next: null, previous: null, results: items } }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/library']}>
      <LibraryPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseCollections.mockReturnValue(
    collectionsPage([
      { id: 7, name: 'Office-safe', joke_count: 4, is_default: false },
      { id: 9, name: 'Dad jokes', joke_count: 2, is_default: true },
    ]),
  )
  mockUseSavedJokes.mockReturnValue({ data: { count: 0, next: null, previous: null, results: [] } })
})

describe('LibraryPage — collection controls are wired', () => {
  it('the "New collection" button routes to /collections', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /new collection/i })
    expect(link.getAttribute('href')).toBe('/collections')
  })

  it('collection tiles navigate to /collections/:id', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /open collection office-safe/i }).getAttribute('href')).toBe(
      '/collections/7',
    )
    expect(screen.getByRole('link', { name: /open collection dad jokes/i }).getAttribute('href')).toBe(
      '/collections/9',
    )
  })

  it('the empty-state "Create collection" button routes to /collections', () => {
    mockUseCollections.mockReturnValue(collectionsPage([]))
    renderPage()
    const link = screen.getByRole('link', { name: /create collection/i })
    expect(link.getAttribute('href')).toBe('/collections')
  })
})

describe('savedJokeToFlowData — real DB format slugs', () => {
  it('resolves a saved setup-punchline (real slug `setup`) to the setup skin', () => {
    const flow = savedJokeToFlowData({
      id: 100,
      joke: { id: 5, text: '', setup: 'Setup?', punchline: 'Punch!', format: { slug: 'setup' } },
    })
    expect(flow).not.toBeNull()
    expect(flow!.fmt).toBe('setup')
    expect(flow!.setup).toBe('Setup?')
    expect(flow!.punch).toBe('Punch!')
  })

  it('resolves the other real slugs (observ / knock)', () => {
    expect(
      savedJokeToFlowData({ id: 1, joke: { id: 1, text: 'x', setup: null, punchline: null, format: { slug: 'observ' } } })?.fmt,
    ).toBe('observ')
    expect(
      savedJokeToFlowData({ id: 2, joke: { id: 2, text: 'x', setup: null, punchline: null, format: { slug: 'knock' } } })?.fmt,
    ).toBe('knock')
  })

  it('returns null (skip render) for an unrecognized format slug', () => {
    expect(
      savedJokeToFlowData({ id: 3, joke: { id: 3, text: 'x', setup: null, punchline: null, format: { slug: 'hologram' } } }),
    ).toBeNull()
  })
})
