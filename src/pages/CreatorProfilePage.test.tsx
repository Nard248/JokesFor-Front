import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { CreatorProfile, Joke } from '@/lib/api'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

vi.mock('@/components/JokeCard', () => ({
  JokeCard: ({ joke }: { joke: { id: number; text: string } }) => (
    <div data-testid="joke-card">{joke.text}</div>
  ),
}))

// Mock useCreatorProfile and FollowButton from follows feature
const mockUseCreatorProfile = vi.fn()

vi.mock('@/features/follows', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/follows')>()
  return {
    ...original,
    useCreatorProfile: (id: number) => mockUseCreatorProfile(id),
    FollowButton: ({ isFollowing, creatorId }: { isFollowing: boolean | null; creatorId: number; followerCount: number }) =>
      isFollowing === null ? null : (
        <button data-testid="follow-button" data-creator-id={creatorId}>
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      ),
  }
})

import { CreatorProfilePage } from './CreatorProfilePage'

const MOCK_JOKES = [
  {
    id: 1, text: 'Why do scientists not trust atoms?',
    setup: null, punchline: null,
    format: { id: 1, name: 'One-Liner', slug: 'one_liner' },
    age_rating: { id: 1, name: 'Family', slug: 'family_friendly', min_age: 0 },
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [], culture_tags: [],
    language: { id: 1, name: 'English', code: 'en' },
    source: 'community', share_image_url: null, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2, text: 'What do you call a fish with no eyes?',
    setup: null, punchline: null,
    format: { id: 1, name: 'One-Liner', slug: 'one_liner' },
    age_rating: { id: 1, name: 'Family', slug: 'family_friendly', min_age: 0 },
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [], culture_tags: [],
    language: { id: 1, name: 'English', code: 'en' },
    source: 'community', share_image_url: null, created_at: '2026-01-02T00:00:00Z',
  },
]

// Real shape for the creator-profile endpoint (JokeListSerializer): format/
// tones/categories are slug STRINGS (not nested objects), text is truncated,
// and there is no setup/punchline/lines/context_tags/themes at all. Media
// items are DIMS-ONLY — no url/poster_url ever, by paywall design (see
// jokes/serializers.py JokeListSerializer.get_media).
const IMAGE_JOKE = {
  id: 3,
  text: 'A soggy paper airplane joke truncated somewhere in the middle of a much long...',
  format: 'image',
  age_rating: 'family_friendly',
  tones: ['nerd'],
  categories: ['nerd'],
  share_image_url: null,
  media: [{ kind: 'image', width: 1080, height: 1350 }],
} as unknown as Joke

const MOCK_PROFILE: CreatorProfile = {
  id: 7,
  display_name: 'user_7',
  handle: '@user7',
  avatar_url: null,
  published_jokes: 14,
  follower_count: 42,
  is_following: false,
  jokes: MOCK_JOKES,
  jokes_pagination: { count: 14, next: null, previous: null },
}

function makeWrapper(path = '/creators/7') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/creators/:creatorId" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseCreatorProfile.mockReturnValue({
    data: MOCK_PROFILE,
    isLoading: false,
    isError: false,
    error: null,
  })
})

describe('CreatorProfilePage', () => {
  it('renders creator profile with name, handle, follower count, joke count', () => {
    render(<CreatorProfilePage />, { wrapper: makeWrapper() })
    expect(screen.getByText('user_7')).toBeDefined()
    expect(screen.getByText('@user7')).toBeDefined()
    expect(screen.getByText('42')).toBeDefined()
    expect(screen.getByText('14')).toBeDefined()
  })

  it('renders jokes grid', () => {
    render(<CreatorProfilePage />, { wrapper: makeWrapper() })
    const cards = screen.getAllByTestId('joke-card')
    expect(cards.length).toBe(MOCK_JOKES.length)
    expect(screen.getByText('Why do scientists not trust atoms?')).toBeDefined()
    expect(screen.getByText('What do you call a fish with no eyes?')).toBeDefined()
  })

  it('shows loading skeleton when loading', () => {
    mockUseCreatorProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })
    render(<CreatorProfilePage />, { wrapper: makeWrapper() })
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows not-found message on 404', () => {
    mockUseCreatorProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 404 } },
    })
    render(<CreatorProfilePage />, { wrapper: makeWrapper() })
    expect(screen.getByText(/creator not found/i)).toBeDefined()
  })

  it('renders FollowButton for non-self profiles (is_following = false)', () => {
    render(<CreatorProfilePage />, { wrapper: makeWrapper() })
    const btn = screen.getByTestId('follow-button')
    expect(btn).toBeDefined()
    expect(btn.textContent).toBe('Follow')
  })

  it('shows "No jokes yet" when jokes array is empty', () => {
    mockUseCreatorProfile.mockReturnValue({
      data: { ...MOCK_PROFILE, jokes: [] },
      isLoading: false,
      isError: false,
      error: null,
    })
    render(<CreatorProfilePage />, { wrapper: makeWrapper() })
    expect(screen.getByText(/no jokes yet/i)).toBeDefined()
  })

  describe('media joke cards (dims-only payload)', () => {
    it('renders a media joke as a placeholder card, not the legacy joke-card, with no <img>', () => {
      mockUseCreatorProfile.mockReturnValue({
        data: { ...MOCK_PROFILE, jokes: [...MOCK_JOKES, IMAGE_JOKE] },
        isLoading: false,
        isError: false,
        error: null,
      })
      render(<CreatorProfilePage />, { wrapper: makeWrapper() })

      // The two text jokes still render through the legacy JokeCard —
      // the media joke gets its own card instead of a third joke-card.
      expect(screen.getAllByTestId('joke-card').length).toBe(MOCK_JOKES.length)

      // Format badge is visible.
      expect(screen.getByText('Image')).toBeDefined()

      // A dimensioned placeholder renders — never a bare <img> with a
      // missing/undefined src (the payload carries no url, ever).
      expect(screen.getByTestId('media-placeholder')).toBeDefined()
      expect(document.querySelectorAll('img').length).toBe(0)
    })

    it('wraps the media joke card in a Link to its detail page', () => {
      mockUseCreatorProfile.mockReturnValue({
        data: { ...MOCK_PROFILE, jokes: [IMAGE_JOKE] },
        isLoading: false,
        isError: false,
        error: null,
      })
      render(<CreatorProfilePage />, { wrapper: makeWrapper() })
      const link = screen.getByTestId('media-placeholder').closest('a')
      expect(link?.getAttribute('href')).toBe('/jokes/3?source=other')
    })

    it.each([
      ['image', 'Image'],
      ['video', 'Video'],
      ['audio', 'Audio'],
    ])('classifies a %s-format joke as a media card labeled %s', (format, label) => {
      const mediaJoke = {
        ...IMAGE_JOKE,
        id: 99,
        format,
        media: [{ kind: format, width: 640, height: 360 }],
      } as unknown as Joke
      mockUseCreatorProfile.mockReturnValue({
        data: { ...MOCK_PROFILE, jokes: [mediaJoke] },
        isLoading: false,
        isError: false,
        error: null,
      })
      render(<CreatorProfilePage />, { wrapper: makeWrapper() })
      expect(screen.getByText(label)).toBeDefined()
      expect(screen.queryByTestId('joke-card')).toBeNull()
    })
  })
})
