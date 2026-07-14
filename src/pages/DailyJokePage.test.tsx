import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockUseTodaysJoke = vi.fn()
const mockUseHistory = vi.fn()
vi.mock('@/features/daily-joke', () => ({
  useTodaysJoke: () => mockUseTodaysJoke(),
  useDailyJokeHistory: () => mockUseHistory(),
}))

// JotdHero pulls in save/telemetry hooks — stub them so the page renders without
// query/router-dependent side effects.
vi.mock('@/features/saved-jokes', () => ({ useSaveJoke: () => ({ mutate: vi.fn() }) }))
vi.mock('@/features/telemetry', () => ({ recordShare: vi.fn(), useDwell: () => ({ current: null }) }))
vi.mock('@/lib/telemetry', () => ({ trackReveal: vi.fn() }))

import { DailyJokePage } from './DailyJokePage'

const TODAY = {
  joke: { id: 5, text: 'A one-liner about mornings.', setup: null, punchline: null },
  date: '2026-07-13',
  issue_label: 'Vol. I · No. 042',
}
const HISTORY = {
  results: [
    { joke: { id: 1, text: 'History joke one.' }, date: '2026-07-12' },
    { joke: { id: 2, text: 'History joke two.' }, date: '2026-07-11' },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DailyJokePage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseTodaysJoke.mockReturnValue({ data: TODAY, isLoading: false })
  mockUseHistory.mockReturnValue({ data: HISTORY, isLoading: false })
})

describe('DailyJokePage', () => {
  it('renders the REAL issue_label from the /daily-jokes/today/ response', () => {
    renderPage()
    // The label is now data-driven ("Daily · " + the response's issue_label),
    // not the previously hardcoded "Daily · Vol. I · No. 042" literal.
    expect(screen.getByText('Daily · Vol. I · No. 042')).toBeDefined()
  })

  it('falls back to a plain "Daily" label when issue_label is absent (no fabricated number)', () => {
    mockUseTodaysJoke.mockReturnValue({ data: { ...TODAY, issue_label: undefined }, isLoading: false })
    renderPage()
    expect(screen.getByText('Daily')).toBeDefined()
    // No fabricated "No. NNN" edition number anywhere.
    expect(screen.queryByText(/No\.\s*\d/)).toBeNull()
  })

  it('history tiles keep the real weekday but drop the fabricated "No. NNN" edition number', () => {
    // Use a today label without a "No." so any "No. NNN" match can only come
    // from the (now-removed) history-tile fabrication.
    mockUseTodaysJoke.mockReturnValue({ data: { ...TODAY, issue_label: 'Vol. II' }, isLoading: false })
    renderPage()
    expect(screen.getByText('History joke one.', { exact: false })).toBeDefined()
    expect(screen.queryByText(/No\.\s*\d/)).toBeNull()
  })
})
