import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import type { Joke } from '@/lib/api'

// ── Router: real MemoryRouter, but spy navigation + fixed params ──────────────
const navigateSpy = vi.fn()
vi.mock('react-router', async (orig) => ({
  ...(await orig<typeof import('react-router')>()),
  useNavigate: () => navigateSpy,
  useParams: () => ({ id: '7' }),
  useSearchParams: () => [new URLSearchParams('source=feed'), vi.fn()],
}))

// ── The joke fetch ────────────────────────────────────────────────────────────
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
vi.mock('@/features/telemetry', () => ({ recordShare: vi.fn(), useDwell: () => ({ current: null }), useImpression: () => ({ current: null }) }))

import { JokeDetailPage } from './JokeDetailPage'

const SPANISH_JOKE: Joke = {
  id: 7,
  text: '',
  setup: '¿Qué le dijo una pared a otra?',
  punchline: 'Nos vemos en la esquina.',
  format: { id: 2, name: 'Setup → Punchline', slug: 'setup' },
  age_rating: { id: 1, name: 'Family', slug: 'family', min_age: 0 },
  tones: [],
  categories: [],
  context_tags: [],
  themes: [{ id: 1, name: 'Wordplay', slug: 'wordplay' }],
  culture_tags: [],
  language: { id: 2, name: 'Spanish', code: 'es', native_name: 'Español' },
  origin_country: { code: 'MX', name: 'Mexico', native_name: 'México' },
  editorial_status: 'ai_screened',
  source: 'editorial',
  share_image_url: null,
  created_at: '2026-01-01T00:00:00Z',
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

describe('JokeDetailPage — provenance badges', () => {
  it('shows language, origin and AI-generated badges in the hero and sets lang on the joke', async () => {
    getJokeMock.mockResolvedValue({ data: SPANISH_JOKE })
    renderPage()
    const setup = await screen.findByText('¿Qué le dijo una pared a otra?')
    expect(setup.closest('article')).toHaveAttribute('lang', 'es')

    const badges = screen.getByTestId('joke-provenance')
    expect(badges).toHaveAttribute('lang', 'en')
    expect(screen.getByText('Español')).toHaveAttribute('lang', 'es')
    expect(screen.getByTestId('joke-origin-badge')).toHaveTextContent('Mexico')
    expect(screen.getByTestId('joke-ai-badge')).toHaveTextContent('AI-generated')
    // English chrome inside the Spanish article is marked English.
    expect(screen.getByText('Wordplay').parentElement).toHaveAttribute('lang', 'en')
    expect(screen.getByText('Setup')).toHaveAttribute('lang', 'en')
  })

  it('does not repeat the badges inside a nested card (knock-knock body)', async () => {
    getJokeMock.mockResolvedValue({
      data: { ...SPANISH_JOKE, setup: null, punchline: null, text: 'Toc toc', format: { id: 5, name: 'Knock-knock', slug: 'knock' }, lines: ['Toc toc', '¿Quién es?', 'Ana', '¿Qué Ana?', 'Ananás'] },
    })
    renderPage()
    await screen.findByText('Toc toc')
    expect(screen.getAllByTestId('joke-provenance')).toHaveLength(1)
  })

  it('shows no badges for an English, human-written joke without origin', async () => {
    getJokeMock.mockResolvedValue({
      data: { ...SPANISH_JOKE, setup: 'Why?', punchline: 'Because.', language: { id: 1, name: 'English', code: 'en' }, origin_country: null, editorial_status: 'native_reviewed' },
    })
    renderPage()
    await screen.findByText('Why?')
    expect(screen.queryByTestId('joke-provenance')).toBeNull()
  })
})
