import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import type { Joke } from '@/lib/api'

// ── Router: real MemoryRouter, but spy navigation + fixed params ──────────────
const navigateSpy = vi.fn()
vi.mock('react-router', async (orig) => ({
  ...(await orig<typeof import('react-router')>()),
  useNavigate: () => navigateSpy,
  useParams: () => ({ id: '9' }),
  useSearchParams: () => [new URLSearchParams('source=feed'), vi.fn()],
}))

// ── The joke fetch: controlled per-test ────────────────────────────────────
const getJokeMock = vi.fn()
vi.mock('@/lib/api', async (orig) => ({
  ...(await orig<typeof import('@/lib/api')>()),
  jokeDetailApi: { get: () => getJokeMock() },
}))

// ── Reveal telemetry ──────────────────────────────────────────────────────────
const trackRevealSpy = vi.fn()
vi.mock('@/lib/telemetry', () => ({
  trackReveal: (...a: unknown[]) => trackRevealSpy(...a),
  __esModule: true,
}))

// ── Chrome + peripheral sections stubbed to keep the test focused ─────────────
vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/ReportJokeButton', () => ({ ReportJokeButton: () => <div /> }))
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ toast: vi.fn() }) }))
vi.mock('@/features/reactions', () => ({
  useReactions: () => ({ data: undefined }),
  useReactToJoke: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/features/streak', () => ({ useStreak: () => ({ data: undefined }) }))
vi.mock('@/features/insights', () => ({ useTasteProfile: () => ({ data: undefined }) }))
vi.mock('@/features/saved-jokes', () => ({ useSaveJoke: () => ({ mutate: vi.fn() }) }))
vi.mock('@/features/jokes', () => ({ useJokeSearch: () => ({ data: undefined }) }))
vi.mock('@/features/mystery-box', () => ({ useRollMysteryBox: () => ({ mutate: vi.fn(), isPending: false }) }))
vi.mock('@/features/telemetry', () => ({
  recordShare: vi.fn(),
  useDwell: () => ({ current: null }),
  useImpression: () => ({ current: null }),
}))

import { JokeDetailPage } from './JokeDetailPage'

const BASE_MEDIA_JOKE: Joke = {
  id: 9,
  text: '',
  setup: 'A cat wearing sunglasses',
  punchline: null,
  is_locked: false,
  format: { id: 8, name: 'Image', slug: 'image' },
  age_rating: { id: 1, name: 'Family', slug: 'family', min_age: 0 },
  tones: [],
  categories: [],
  context_tags: [],
  themes: [],
  culture_tags: [],
  language: { id: 1, name: 'English', code: 'en' },
  source: 'community',
  share_image_url: null,
  media: [{ kind: 'image', url: 'https://cdn.example.com/joke-9.jpg', width: 800, height: 600 }],
  created_at: '2026-01-01T00:00:00Z',
}

const LOCKED_MEDIA_JOKE: Joke = {
  ...BASE_MEDIA_JOKE,
  is_locked: true,
  // Backend withholds the url server-side once a media joke is locked.
  media: [{ kind: 'image', url: null, width: 800, height: 600 }],
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <JokeDetailPage />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('JokeDetailPage — media joke', () => {
  it('routes an unlocked media joke through the big FlowJokeCard and renders its image', async () => {
    getJokeMock.mockResolvedValue({ data: BASE_MEDIA_JOKE })
    renderPage()

    const img = await waitFor(() => screen.getByRole('img'))
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/joke-9.jpg')
    // The bespoke text-locked block must not be present for a media joke.
    expect(screen.queryByTestId('detail-locked')).not.toBeInTheDocument()
  })

  it('shows no img elements and the unlock CTA for a LOCKED media joke (no url leakage)', async () => {
    getJokeMock.mockResolvedValue({ data: LOCKED_MEDIA_JOKE })
    renderPage()

    await waitFor(() => expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument())
    expect(screen.queryAllByRole('img')).toHaveLength(0)
    // The bespoke text-locked CTA belongs to the text path only.
    expect(screen.queryByTestId('detail-unlock-cta')).not.toBeInTheDocument()
  })

  it('does NOT fire a reveal for a locked media joke', async () => {
    getJokeMock.mockResolvedValue({ data: LOCKED_MEDIA_JOKE })
    renderPage()

    await waitFor(() => expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument())
    expect(trackRevealSpy).not.toHaveBeenCalled()
  })
})
