import { describe, it, expect } from 'vitest'
import { isAdult } from './age'

/** Returns an ISO date string for a date that is `yearsAgo` years before today. */
function dobYearsAgo(yearsAgo: number, offsetDays = 0): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - yearsAgo)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

describe('isAdult()', () => {
  it('returns true for a DOB 25 years ago', () => {
    expect(isAdult(dobYearsAgo(25))).toBe(true)
  })

  it('returns true for a DOB exactly 18 years ago today', () => {
    // offsetDays = 0 → same calendar date 18 years back → person turned 18 exactly today
    expect(isAdult(dobYearsAgo(18, 0))).toBe(true)
  })

  it('returns false for a DOB that is 1 day after the 18-year mark (still 17)', () => {
    // +1 day means the birthday is tomorrow, so they are still 17
    expect(isAdult(dobYearsAgo(18, 1))).toBe(false)
  })

  it('returns false for a DOB 17 years ago', () => {
    expect(isAdult(dobYearsAgo(17))).toBe(false)
  })

  it('returns false for null', () => {
    expect(isAdult(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isAdult(undefined)).toBe(false)
  })

  it('returns false for an invalid date string', () => {
    expect(isAdult('not-a-date')).toBe(false)
    expect(isAdult('2000-99-99')).toBe(false)
    expect(isAdult('')).toBe(false)
  })
})
