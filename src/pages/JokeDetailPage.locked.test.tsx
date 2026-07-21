import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Joke } from '@/lib/api'

// ── Router: real MemoryRouter, but spy navigation + fixed params ──────────────
const navigateSpy = vi.fn()
vi.mock('react-router', async (orig) => ({
  ...(await orig<typeof import('react-router')>()),
  useNavigate: () => navigateSpy,
  useParams: () => ({ id: '7' }),
  useSearchParams: () => [new URLSearchParams('source=feed'), vi.fn()],
}))

// ── The joke fetch: return a LOCKED joke (server stripped the punchline) ───────
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

// ── Auth: this suite exercises the AUTHENTICATED unlock path (billing) ───────
// The anon path ('Sign up free' → /register) is covered in FlowJokeCard.anon.test.tsx.
vi.mock('@/features/auth', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { pk: 1 } }),
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
vi.mock('@/features/telemetry', () => ({ recordShare: vi.fn(), useDwell: () => ({ current: null }) }))

import { JokeDetailPage } from './JokeDetailPage'

const LOCKED_JOKE: Joke = {
  id: 7,
  text: '',
  setup: 'Why did the scarecrow win an award?',
  punchline: null,
  is_locked: true,
  format: { id: 2, name: 'Setup → Punchline', slug: 'setup' },
  age_rating: { id: 1, name: 'Family', slug: 'family', min_age: 0 },
  tones: [],
  categories: [],
  context_tags: [],
  themes: [],
  culture_tags: [],
  language: { id: 1, name: 'English', code: 'en' },
  source: 'community',
  share_image_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <JokeDetailPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getJokeMock.mockResolvedValue({ data: LOCKED_JOKE })
})

describe('JokeDetailPage — locked joke', () => {
  it('shows the setup teaser + Unlock CTA instead of the (stripped) punchline', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('detail-locked')).toBeInTheDocument())
    expect(screen.getByText('Why did the scarecrow win an award?')).toBeInTheDocument()
    expect(screen.getByTestId('detail-unlock-cta')).toBeInTheDocument()
  })

  it('does NOT fire a reveal for a locked joke', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('detail-locked')).toBeInTheDocument())
    expect(trackRevealSpy).not.toHaveBeenCalled()
  })

  it('routes the Unlock CTA to the billing page', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('detail-unlock-cta')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('detail-unlock-cta'))
    expect(navigateSpy).toHaveBeenCalledWith('/settings/billing')
  })
})
