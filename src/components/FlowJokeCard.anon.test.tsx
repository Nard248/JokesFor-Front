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
  qc.setQueryData(['daily-reads'], { limit: 10, used: 10, remaining: 0, over: true })
  return render(
    <QueryClientProvider client={qc}>
      <FlowJokeCard joke={joke} source="feed" />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  isAuthenticatedMock.mockReturnValue(false)
})

describe('FlowJokeCard — free anonymous reading', () => {
  it('reveals without sending an anonymous quota-consumption request', () => {
    renderCard(setupJoke)
    fireEvent.click(screen.getByText('Why did the scarecrow win an award?'))
    expect(screen.getByText('He was outstanding in his field.')).toBeInTheDocument()
    expect(revealApiPostSpy).not.toHaveBeenCalled()
    expect(trackRevealSpy).not.toHaveBeenCalled()
  })

  it.each([false, true])('withheld content has no purchase or registration CTA (authenticated=%s)', (authenticated) => {
    isAuthenticatedMock.mockReturnValue(authenticated)
    renderCard({ ...setupJoke, isLocked: true })
    expect(screen.getByText('This joke is unavailable.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /unlock|sign up/i })).toBeNull()
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it.each([imageJoke, videoJoke, audioJoke])('allows free $fmt reveals despite an exhausted legacy quota', (joke) => {
    renderCard(joke)
    expect(screen.getByText(/tap to reveal/i)).toBeInTheDocument()
    expect(screen.queryByText(/unlock with supporter/i)).toBeNull()
  })
})
