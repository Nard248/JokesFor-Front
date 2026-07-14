import { describe, it, expect } from 'vitest'
import { nextDailyResetInstant, timeUntilDailyReset, dailyResetLocalLabel } from './dailyReset'

describe('dailyReset — countdown targets MIDNIGHT UTC (not 9 AM local)', () => {
  it('nextDailyResetInstant returns the next 00:00:00 UTC', () => {
    const now = new Date('2026-07-14T10:00:00Z')
    expect(nextDailyResetInstant(undefined, now).toISOString()).toBe('2026-07-15T00:00:00.000Z')
  })

  it('rolls over month/year boundaries via Date.UTC', () => {
    const now = new Date('2026-12-31T23:30:00Z')
    expect(nextDailyResetInstant(undefined, now).toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })

  it('counts down whole hours+minutes to the next UTC midnight', () => {
    const now = new Date('2026-07-14T10:00:00Z')
    expect(timeUntilDailyReset(undefined, now)).toEqual({ h: 14, m: 0 })
  })

  it('prefers the server-provided reset_at when present', () => {
    const now = new Date('2026-07-14T10:00:00Z')
    expect(nextDailyResetInstant('2026-07-14T18:30:00Z', now).toISOString()).toBe(
      '2026-07-14T18:30:00.000Z',
    )
    expect(timeUntilDailyReset('2026-07-14T18:30:00Z', now)).toEqual({ h: 8, m: 30 })
  })

  it('ignores an unparseable reset_at and falls back to next UTC midnight', () => {
    const now = new Date('2026-07-14T10:00:00Z')
    expect(nextDailyResetInstant('not-a-date', now).toISOString()).toBe('2026-07-15T00:00:00.000Z')
  })

  it('never returns a negative countdown', () => {
    const now = new Date('2026-07-14T23:59:00Z')
    expect(timeUntilDailyReset(undefined, now)).toEqual({ h: 0, m: 1 })
  })

  it('produces a local-time label for the reset instant', () => {
    const now = new Date('2026-07-14T10:00:00Z')
    // Exact string is locale/timezone dependent; assert it renders a clock time.
    expect(dailyResetLocalLabel(undefined, now)).toMatch(/\d/)
  })
})
