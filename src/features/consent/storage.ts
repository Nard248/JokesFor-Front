export const CONSENT_VERSION = 1
export const CONSENT_KEY = 'jokesfor-consent'

export interface ConsentRecord {
  version: number
  analytics: boolean
  ts: number
}

export function writeConsent(analytics: boolean): void {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    analytics,
    ts: Date.now(),
  }
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
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
