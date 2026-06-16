import { describe, it, expect, beforeEach } from 'vitest'
import {
  CONSENT_VERSION,
  readConsent,
  writeConsent,
  clearConsent,
} from './storage'

const KEY = 'jokesfor-consent'

beforeEach(() => {
  localStorage.clear()
})

describe('writeConsent / readConsent round-trip', () => {
  it('persists a versioned record with analytics:true', () => {
    writeConsent(true)
    const rec = readConsent()
    expect(rec).not.toBeNull()
    expect(rec!.version).toBe(CONSENT_VERSION)
    expect(rec!.analytics).toBe(true)
    expect(typeof rec!.ts).toBe('number')
  })

  it('persists a versioned record with analytics:false', () => {
    writeConsent(false)
    const rec = readConsent()
    expect(rec!.analytics).toBe(false)
    expect(rec!.version).toBe(CONSENT_VERSION)
  })
})

describe('readConsent version checks', () => {
  it('returns null when no record exists', () => {
    expect(readConsent()).toBeNull()
  })

  it('returns null when the stored version is older', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: CONSENT_VERSION - 1, analytics: true, ts: Date.now() }))
    expect(readConsent()).toBeNull()
  })

  it('returns null when the stored version is newer (future-proof)', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: CONSENT_VERSION + 99, analytics: true, ts: Date.now() }))
    expect(readConsent()).toBeNull()
  })

  it('returns null for malformed JSON without throwing', () => {
    localStorage.setItem(KEY, 'not-json{{{{')
    expect(() => readConsent()).not.toThrow()
    expect(readConsent()).toBeNull()
  })
})

describe('clearConsent', () => {
  it('removes the stored record', () => {
    writeConsent(true)
    clearConsent()
    expect(readConsent()).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})
