/**
 * Regression: cards built from wrapper rows (saved jokes, favorites) must act
 * on the JOKE id. The saved-joke adapter used to pass the saved-row id, so
 * Save / reactions / telemetry on Library and CollectionDetail hit a
 * different joke. Here the real FlowJokeCard renders with a saved-row id that
 * differs from the joke id, and every side effect is checked.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'

const SAVED_ROW_ID = 900
const JOKE_ID = 42

const savedRow = {
  id: SAVED_ROW_ID,
  joke: { id: JOKE_ID, text: '', setup: 'Why the long setup?', punchline: 'For the payoff.', format: { slug: 'setup' } },
  collection: 1,
  note: null,
  saved_at: '2026-10-01T00:00:00Z',
}

// ── Side-effect spies (everything FlowJokeCard sends a joke id to) ───────────
const saveMutate = vi.fn()
const reactHookIds: number[] = []
const reactMutate = vi.fn()
const impressionIds: (number | undefined)[] = []
const dwellIds: (number | undefined)[] = []
const trackReveal = vi.fn()
const recordShare = vi.fn()

vi.mock('@/features/saved-jokes', () => ({
  useSaveJoke: () => ({ mutate: saveMutate }),
  useSavedJokes: () => ({ data: { count: 1, next: null, previous: null, results: [savedRow] } }),
}))
vi.mock('@/features/reactions', () => ({
  useReactions: () => ({ data: undefined }),
  useReactToJoke: (jokeId: number) => {
    reactHookIds.push(jokeId)
    return { mutate: reactMutate }
  },
}))
vi.mock('@/features/telemetry', () => ({
  useImpression: (id: number | undefined) => {
    impressionIds.push(id)
    return { current: null }
  },
  useDwell: (id: number | undefined) => {
    dwellIds.push(id)
    return { current: null }
  },
  recordShare: (...a: unknown[]) => recordShare(...a),
}))
vi.mock('@/lib/telemetry', () => ({ trackReveal: (...a: unknown[]) => trackReveal(...a) }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ isAuthenticated: true, user: { pk: 1 } }) }))
vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/features/collections', () => ({
  useCollections: () => ({ data: { count: 1, results: [{ id: 1, name: 'Mine', joke_count: 1, is_default: true }] } }),
  useCollectionJokes: () => ({ data: { count: 1, next: null, previous: null, results: [savedRow] }, isLoading: false, isError: false, refetch: vi.fn() }),
}))
vi.mock('@/features/favorites', () => ({
  useFavorites: () => ({ data: { count: 1, next: null, previous: null, results: [{ id: SAVED_ROW_ID, joke: savedRow.joke }] }, isLoading: false, isError: false, isFetching: false }),
  useFavoriteStats: () => ({ data: undefined }),
}))

import { LibraryPage } from './LibraryPage'
import { CollectionDetailPage } from './CollectionDetailPage'
import { FavoritesPage } from './FavoritesPage'

beforeEach(() => {
  vi.clearAllMocks()
  reactHookIds.length = 0
  impressionIds.length = 0
  dwellIds.length = 0
})

function exerciseCard() {
  // Reveal (telemetry), Save, react, share — all from the one rendered card.
  fireEvent.click(screen.getByText('Why the long setup?'))
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  fireEvent.click(screen.getByRole('button', { name: 'LOL' }))
  fireEvent.click(screen.getByRole('button', { name: 'Share joke' }))
}

function expectJokeIdEverywhere() {
  expect(saveMutate).toHaveBeenCalledWith({ jokeId: JOKE_ID }, expect.anything())
  expect(reactHookIds.length).toBeGreaterThan(0)
  expect(new Set(reactHookIds)).toEqual(new Set([JOKE_ID]))
  expect(reactMutate).toHaveBeenCalledWith('lol', expect.anything())
  expect(new Set(impressionIds)).toEqual(new Set([JOKE_ID]))
  expect(new Set(dwellIds)).toEqual(new Set([JOKE_ID]))
  expect(trackReveal).toHaveBeenCalledWith(JOKE_ID, 'other')
  expect(recordShare).toHaveBeenCalledWith(JOKE_ID, 'copy')
  for (const id of [...reactHookIds, ...impressionIds, ...dwellIds]) expect(id).not.toBe(SAVED_ROW_ID)
}

describe('saved-joke cards act on the joke id, not the saved-row id', () => {
  it('LibraryPage', () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <LibraryPage />
      </MemoryRouter>,
    )
    exerciseCard()
    expectJokeIdEverywhere()
  })

  it('CollectionDetailPage', () => {
    render(
      <MemoryRouter initialEntries={['/collections/1']}>
        <Routes>
          <Route path="/collections/:id" element={<CollectionDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )
    exerciseCard()
    expectJokeIdEverywhere()
  })

  it('FavoritesPage (favorite row id differs from the joke id)', () => {
    render(
      <MemoryRouter initialEntries={['/favorites']}>
        <FavoritesPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('Why the long setup?'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(saveMutate).toHaveBeenCalledWith({ jokeId: JOKE_ID }, expect.anything())
    expect(trackReveal).toHaveBeenCalledWith(JOKE_ID, 'other')
    expect(new Set(reactHookIds)).toEqual(new Set([JOKE_ID]))
  })
})
