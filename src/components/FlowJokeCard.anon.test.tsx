import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FlowJokeData } from './FlowJokeCard'

// ── Navigation ───────────────────────────────────────────────────────────────
const navigateSpy = vi.fn()
vi.mock('react-router', async (orig) => ({
  ...(await orig<typeof import('react-router')>()),
  useNavigate: () => navigateSpy,
}))

// ── Auth state (controlled per test) ──────────────────────────────────────────
const isAuthenticatedMock = vi.fn<() => boolean>(() => false)
vi.mock('@/features/auth', () => ({
  useAuth: () => ({ isAuthenticated: isAuthenticatedMock(), user: null }),
}))

// ── Reveal endpoint (anon paywall consumption) ────────────────────────────────
const revealApiPostSpy = vi.fn((_jokeId: number) =>
  Promise.resolve({ data: { limit: 10, used: 1, remaining: 9, over: false, reset_at: '2026-07-22T00:00:00Z' } }),
)
vi.mock('@/lib/api', () => ({
  revealApi: { post: (jokeId: number) => revealApiPostSpy(jokeId) },
}))

// ── Daily-reads enforcement (controlled per test) ─────────────────────────────
const canRevealMock = vi.fn<(id: number) => boolean>(() => true)
const registerRevealMock = vi.fn()
vi.mock('@/features/daily-reads', () => ({
  useDailyReads: () => ({
    canReveal: canRevealMock,
    registerReveal: registerRevealMock,
    hasRevealed: () => false,
    over: false,
    active: true,
    remaining: 0,
    limit: 10,
    used: 10,
    resetAt: null,
  }),
  dailyReadsKeys: { all: ['daily-reads'] },
}))

// ── Reveal telemetry ──────────────────────────────────────────────────────────
const trackRevealSpy = vi.fn()
vi.mock('@/lib/telemetry', () => ({
  trackReveal: (...args: unknown[]) => trackRevealSpy(...args),
}))

// ── Peripheral hooks (no-op; avoid QueryClient/network) ───────────────────────
vi.mock('@/features/reactions', () => ({
  useReactions: () => ({ data: undefined }),
  useReactToJoke: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/features/saved-jokes', () => ({ useSaveJoke: () => ({ mutate: vi.fn() }) }))
vi.mock('@/features/telemetry', () => ({
  useImpression: () => ({ current: null }),
  useDwell: () => ({ current: null }),
  recordShare: vi.fn(),
}))

import { FlowJokeCard } from './FlowJokeCard'

const setupJoke: FlowJokeData = {
  id: 42,
  fmt: 'setup',
  setup: 'Why did the scarecrow win an award?',
  punch: 'He was outstanding in his field.',
}

const imageJoke: FlowJokeData = {
  id: 99,
  fmt: 'image',
  setup: 'A cat wearing sunglasses',
  media: [{ kind: 'image', url: 'https://cdn.example.com/cat.jpg', width: 800, height: 600 }],
}

const videoJoke: FlowJokeData = {
  id: 100,
  fmt: 'video',
  setup: 'A dog skateboarding',
  media: [{ kind: 'video', url: 'https://cdn.example.com/dog.mp4', poster_url: 'https://cdn.example.com/dog-poster.jpg', width: 1280, height: 720 }],
}

const audioJoke: FlowJokeData = {
  id: 101,
  fmt: 'audio',
  setup: 'A very punny podcast clip',
  media: [{ kind: 'audio', url: 'https://cdn.example.com/clip.mp3' }],
}

function renderCard(joke: FlowJokeData) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <FlowJokeCard joke={joke} source="feed" />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  canRevealMock.mockReturnValue(true)
  isAuthenticatedMock.mockReturnValue(false)
})

describe('FlowJokeCard — anonymous paywall', () => {
  it('anon + unlocked setup joke: tapping the punchline calls revealApi.post and does NOT track a reveal', () => {
    renderCard(setupJoke)
    fireEvent.click(screen.getByText('Why did the scarecrow win an award?'))
    expect(registerRevealMock).toHaveBeenCalledWith(42)
    expect(revealApiPostSpy).toHaveBeenCalledWith(42)
    expect(trackRevealSpy).not.toHaveBeenCalled()
  })

  it('anon + locked joke: CTA reads "Sign up free" and clicking it navigates to /register', () => {
    renderCard({ ...setupJoke, isLocked: true })
    const cta = screen.getByTestId('unlock-supporter-cta')
    expect(cta).toHaveTextContent('Sign up free')
    fireEvent.click(cta)
    expect(navigateSpy).toHaveBeenCalledWith('/register')
  })

  it('authed + locked joke: CTA reads "Unlock with Supporter" and navigates to /settings/billing (regression)', () => {
    isAuthenticatedMock.mockReturnValue(true)
    renderCard({ ...setupJoke, isLocked: true })
    const cta = screen.getByTestId('unlock-supporter-cta')
    expect(cta).toHaveTextContent('Unlock with Supporter')
    fireEvent.click(cta)
    expect(navigateSpy).toHaveBeenCalledWith('/settings/billing')
  })

  it('image-format joke is reveal-gated: over cap + fresh image joke renders the locked CTA', () => {
    canRevealMock.mockReturnValue(false)
    renderCard(imageJoke)
    expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument()
  })

  it('video-format joke is reveal-gated: over cap + fresh video joke renders the locked CTA', () => {
    canRevealMock.mockReturnValue(false)
    renderCard(videoJoke)
    expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument()
  })

  it('audio-format joke is reveal-gated: over cap + fresh audio joke renders the locked CTA', () => {
    canRevealMock.mockReturnValue(false)
    renderCard(audioJoke)
    expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument()
  })
})
