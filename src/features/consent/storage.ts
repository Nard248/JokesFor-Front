export const CONSENT_VERSION = 1
export const CONSENT_KEY = 'jokesfor-consent'
const CONSENT_EVENT = 'jokesfor-consent-change'
let storageFailureOptOut = false

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
    storageFailureOptOut = false
  } catch {
    if (!analytics) storageFailureOptOut = true
    // Storage unavailable (QuotaExceeded, Safari private-mode SecurityError).
    // The in-memory record is still returned so callers can dismiss the banner.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT))
  return record
}

export function readConsent(): ConsentRecord | null {
  if (storageFailureOptOut) return { version: CONSENT_VERSION, analytics: false, ts: 0 }
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentRecord
    if (parsed.version !== CONSENT_VERSION || typeof parsed.analytics !== 'boolean') return null
    return parsed
  } catch {
    return null
  }
}

export function clearConsent(): void {
  storageFailureOptOut = true
  try { localStorage.removeItem(CONSENT_KEY); storageFailureOptOut = false } catch { /* unavailable storage */ }
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

/** Notify same-tab consumers immediately, and observe consent changes in other tabs. */
export function subscribeConsent(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_KEY || event.key === null) listener()
  }
  window.addEventListener(CONSENT_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CONSENT_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}
