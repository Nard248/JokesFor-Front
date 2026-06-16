import { describe, it, expect } from 'vitest'
import { isAdult } from './age'

/**
 * Build a YYYY-MM-DD string using LOCAL date components so the result
 * is identical regardless of the runner's TZ environment variable.
 *
 * `yearsAgo`  — how many years to subtract from today
 * `offsetDays` — additional day offset (positive = later, negative = earlier)
 */
function dobLocal(yearsAgo: number, offsetDays = 0): string {
  const today = new Date()
  // Work in local-time parts to avoid any UTC conversion
  const year = today.getFullYear() - yearsAgo
  const month = today.getMonth()       // 0-indexed for Date constructor
  const day = today.getDate() + offsetDays

  // Let Date normalise overflow (e.g. Feb 30 → Mar 2)
  const d = new Date(year, month, day)

  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

describe('isAdult()', () => {
  // ---- clear adult ----
  it('returns true for a DOB 25 years ago', () => {
    expect(isAdult(dobLocal(25))).toBe(true)
  })

  // ---- exact 18th-birthday boundary ----
  it('returns true for a DOB exactly 18 years ago today (18th birthday = today)', () => {
    expect(isAdult(dobLocal(18, 0))).toBe(true)
  })

  it('returns true for a DOB whose 18th birthday was yesterday (one day past)', () => {
    // birthday is 18 years ago minus 1 day → already turned 18 yesterday
    expect(isAdult(dobLocal(18, -1))).toBe(true)
  })

  it('returns false for a DOB whose 18th birthday is tomorrow (still 17)', () => {
    // +1 day → birthday is tomorrow → still 17
    expect(isAdult(dobLocal(18, 1))).toBe(false)
  })

  // ---- clearly under 18 ----
  it('returns false for a DOB 17 years ago', () => {
    expect(isAdult(dobLocal(17))).toBe(false)
  })

  // ---- null / undefined / empty ----
  it('returns false for null', () => {
    expect(isAdult(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isAdult(undefined)).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isAdult('')).toBe(false)
  })

  // ---- invalid / malformed strings ----
  it('returns false for a non-date string', () => {
    expect(isAdult('not-a-date')).toBe(false)
  })

  it('returns false for out-of-range month/day (2000-99-99)', () => {
    expect(isAdult('2000-99-99')).toBe(false)
  })

  it('returns false for an impossible calendar date (Feb 30)', () => {
    expect(isAdult('2000-02-30')).toBe(false)
  })

  it('returns false for month 13', () => {
    expect(isAdult('2007-13-40')).toBe(false)
  })

  // ---- future date ----
  it('returns false for a future date', () => {
    const future = dobLocal(-1)  // 1 year in the future
    expect(isAdult(future)).toBe(false)
  })
})
