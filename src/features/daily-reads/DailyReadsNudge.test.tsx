import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

// Control the over-cap signal; the store (dismiss state) stays real.
const overMock = { value: false }
vi.mock('./api', () => ({
  useDailyReads: () => ({ over: overMock.value }),
}))

import { DailyReadsNudge } from './DailyReadsNudge'
import { __resetDailyReadsStore } from './store'

function renderNudge() {
  return render(
    <MemoryRouter>
      <DailyReadsNudge />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  __resetDailyReadsStore()
  overMock.value = false
  vi.clearAllMocks()
})

describe('DailyReadsNudge — one-time over-cap nudge', () => {
  it('is silent while the user is under the cap', () => {
    renderNudge()
    expect(screen.queryByTestId('daily-reads-nudge')).toBeNull()
  })

  it('shows once the user crosses the cap, with an upgrade link to billing', () => {
    overMock.value = true
    renderNudge()
    expect(screen.getByTestId('daily-reads-nudge')).toBeInTheDocument()
    expect(screen.getByTestId('daily-reads-nudge-upgrade').getAttribute('href')).toBe(
      '/settings/billing',
    )
  })

  it('stays dismissed for the rest of the session (shown only once)', () => {
    overMock.value = true
    const { rerender } = renderNudge()
    fireEvent.click(screen.getByTestId('daily-reads-nudge-dismiss'))
    expect(screen.queryByTestId('daily-reads-nudge')).toBeNull()
    // Still over-cap on a later render — the nudge must NOT come back.
    rerender(
      <MemoryRouter>
        <DailyReadsNudge />
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('daily-reads-nudge')).toBeNull()
  })
})
