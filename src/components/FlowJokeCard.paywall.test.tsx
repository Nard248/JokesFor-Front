import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { FlowJokeData } from './FlowJokeCard'

// ── Navigation ───────────────────────────────────────────────────────────────
const navigateSpy = vi.fn()
vi.mock('react-router', async (orig) => ({
  ...(await orig<typeof import('react-router')>()),
  useNavigate: () => navigateSpy,
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

beforeEach(() => {
  vi.clearAllMocks()
  canRevealMock.mockReturnValue(true)
})

describe('FlowJokeCard — paywall', () => {
  it('server-locked joke (is_locked) renders the CTA and never tracks a reveal', () => {
    render(<FlowJokeCard joke={{ ...setupJoke, isLocked: true }} source="feed" />)
    expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument()
    expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('unlock-supporter-cta'))
    expect(navigateSpy).toHaveBeenCalledWith('/settings/billing')
    expect(trackRevealSpy).not.toHaveBeenCalled()
    expect(registerRevealMock).not.toHaveBeenCalled()
  })

  it('unlocked card reveals on tap and records the reveal', () => {
    render(<FlowJokeCard joke={setupJoke} source="feed" />)
    expect(screen.getByText(/tap to reveal punchline/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Why did the scarecrow win an award?'))
    expect(registerRevealMock).toHaveBeenCalledWith(42)
    expect(trackRevealSpy).toHaveBeenCalledWith(42, 'feed')
    expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
  })

  it('over-cap (canReveal=false) soft-locks a fresh reveal-gated joke with the CTA', () => {
    canRevealMock.mockReturnValue(false) // user is over their free cap
    render(<FlowJokeCard joke={setupJoke} source="feed" />)
    expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument()
    expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
    expect(trackRevealSpy).not.toHaveBeenCalled()
  })
})
