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

// ── Auth: this suite exercises the AUTHENTICATED reveal/unlock path. The anon
// path (no quota consumption and no registration wall) is covered in
// FlowJokeCard.anon.test.tsx. ─────────────────────────────────────────────────
vi.mock('@/features/auth', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { pk: 1 } }),
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
})

describe('FlowJokeCard — free reading and unavailable content', () => {
  it('withheld content stays hidden without offering a subscription', () => {
    renderCard({ ...setupJoke, isLocked: true })
    expect(screen.getByText('This joke is unavailable.')).toBeInTheDocument()
    expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /unlock|subscribe/i })).toBeNull()
    expect(navigateSpy).not.toHaveBeenCalled()
    expect(trackRevealSpy).not.toHaveBeenCalled()
  })

  it('unlocked card reveals on tap and records the reveal', () => {
    renderCard(setupJoke)
    expect(screen.getByText(/tap to reveal punchline/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Why did the scarecrow win an award?'))
    expect(trackRevealSpy).toHaveBeenCalledWith(42, 'feed')
    expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
  })

  it('stale reader quota cannot prevent a new joke from revealing', () => {
    renderCard(setupJoke)
    fireEvent.click(screen.getByText('Why did the scarecrow win an award?'))
    expect(screen.getByText('He was outstanding in his field.')).toBeInTheDocument()
    expect(screen.queryByText(/unlock with supporter/i)).toBeNull()
    expect(trackRevealSpy).toHaveBeenCalledWith(42, 'feed')
  })
})
