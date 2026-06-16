export const CONSENT_VERSION = 1
export const CONSENT_KEY = 'jokesfor-consent'

export interface ConsentRecord {
  version: number
  analytics: boolean
  ts: number
}

export function writeConsent(analytics: boolean): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    analytics,
    ts: Date.now(),
  }
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
  } catch {
    // Storage unavailable (QuotaExceeded, Safari private-mode SecurityError).
    // The in-memory record is still returned so callers can dismiss the banner.
  }
  return record
}

export function readConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentRecord
    if (parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function clearConsent(): void {
  localStorage.removeItem(CONSENT_KEY)
}
