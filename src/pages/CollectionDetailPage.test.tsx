/**
 * CollectionDetailPage test — renders the collection's saved jokes.
 *
 * Mocks the collections hooks (useCollections for the header name,
 * useCollectionJokes for the list) and FlowJokeCard (avoids telemetry/network),
 * then asserts one card per saved joke is rendered.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

// FlowJokeCard → a lightweight stand-in that surfaces the mapped text.
vi.mock('@/components/FlowJokeCard', () => ({
  FlowJokeCard: ({ joke }: { joke: { id: number | string; text?: string } }) => (
    <div data-testid="joke-card">{joke.text}</div>
  ),
}))

const mockUseCollections = vi.fn()
const mockUseCollectionJokes = vi.fn()
vi.mock('@/features/collections', () => ({
  useCollections: () => mockUseCollections(),
  useCollectionJokes: () => mockUseCollectionJokes(),
}))

import { CollectionDetailPage } from './CollectionDetailPage'

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/collections/${id}`]}>
      <Routes>
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CollectionDetailPage', () => {
  it("renders a card for each of the collection's saved jokes", () => {
    mockUseCollections.mockReturnValue({
      data: { results: [{ id: 1, name: 'Office-safe', joke_count: 2, is_default: false }] },
    })
    mockUseCollectionJokes.mockReturnValue({
      data: {
        results: [
          { id: 11, joke: { id: 101, text: 'Joke one', setup: null, punchline: null, format: { slug: 'one-liner' } } },
          { id: 12, joke: { id: 102, text: 'Joke two', setup: null, punchline: null, format: { slug: 'one-liner' } } },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderAt('1')

    // Header reflects the collection name.
    expect(screen.getByRole('heading', { name: 'Office-safe' })).toBeInTheDocument()
    // One card per saved joke.
    const cards = screen.getAllByTestId('joke-card')
    expect(cards).toHaveLength(2)
    expect(screen.getByText('Joke one')).toBeInTheDocument()
    expect(screen.getByText('Joke two')).toBeInTheDocument()
  })

  it('shows an empty state when the collection has no jokes', () => {
    mockUseCollections.mockReturnValue({ data: { results: [] } })
    mockUseCollectionJokes.mockReturnValue({
      data: { results: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderAt('1')
    expect(screen.queryByTestId('joke-card')).not.toBeInTheDocument()
    expect(screen.getByText(/no jokes in this collection yet/i)).toBeInTheDocument()
  })
})
