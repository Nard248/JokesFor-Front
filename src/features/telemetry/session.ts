import { useAuthStore } from '@/features/auth/store'
import { isAdult } from '@/features/consent/age'
import { clearConsent, readConsent, subscribeConsent } from '@/features/consent/storage'

// Preferences are account data, not browser consent. Fail closed until the
// current account's response arrives; never persist this state across logins.
let preferenceOwner: number | null = null
let accountOptIn = false
const withdrawals = new Map<string, string>()
let snapshot = { owner: null as number | null, eligible: false, generation: 0 }
const listeners = new Set<() => void>()

const withdrawalPrefix = () => `jokesfor-account-analytics-withdrawal:v1:${encodeURIComponent(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1')}:`
const withdrawalKey = (owner: number) => `${withdrawalPrefix()}${owner}`
const stores = ['localStorage', 'sessionStorage'] as const

function storedWithdrawal(storage: typeof stores[number], key: string) {
  try { return window[storage].getItem(key) } catch { return 'storage-unavailable' }
}

/** A snapshot lets an old opt-in response detect a newer local withdrawal. */
export function getAccountAnalyticsWithdrawalRevision(owner: number): string | null {
  const key = withdrawalKey(owner)
  const markers = [withdrawals.get(key) ?? null, ...stores.map((storage) => storedWithdrawal(storage, key))]
  return markers.some((marker) => marker !== null) ? JSON.stringify(markers) : null
}

function clearWithdrawal(owner: number, expected: string | null | undefined) {
  if (expected !== undefined && getAccountAnalyticsWithdrawalRevision(owner) !== expected) return
  const key = withdrawalKey(owner)
  try {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
    withdrawals.delete(key)
  } catch {
    // A browser that cannot remove the durable stop stays opted out.
    withdrawals.set(key, 'storage-unavailable')
  }
}

function refresh() {
  const auth = useAuthStore.getState()
  const owner = auth.isAuthenticated ? auth.user?.pk ?? null : null
  if (owner !== snapshot.owner) {
    preferenceOwner = null
    accountOptIn = false
  }
  const eligible = Boolean(
    import.meta.env.VITE_API_URL && import.meta.env.VITE_USE_MOCKS !== 'true' &&
    owner && auth.accessToken && isAdult(auth.user?.date_of_birth) &&
    readConsent()?.analytics === true && preferenceOwner === owner && accountOptIn && !isAccountAnalyticsWithdrawn(owner),
  )
  if (owner !== snapshot.owner || eligible !== snapshot.eligible) {
    snapshot = { owner, eligible, generation: snapshot.generation + 1 }
    listeners.forEach((listener) => listener())
  }
  return snapshot
}

useAuthStore.subscribe(refresh)
subscribeConsent(refresh)
window.addEventListener('storage', (event) => {
  if (event.key === null || event.key.startsWith(withdrawalPrefix())) refresh()
})
refresh()

export function getTelemetrySession() {
  return refresh()
}

export function subscribeTelemetrySession(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function setAccountAnalyticsPreference(owner: number, enabled: boolean, explicitOptIn = false, expectedWithdrawal?: string | null) {
  refresh()
  if (owner !== snapshot.owner) return
  if (enabled && explicitOptIn) clearWithdrawal(owner, expectedWithdrawal)
  preferenceOwner = owner
  accountOptIn = enabled === true
  refresh()
}

/** A failed privacy save must not be undone by a later background refetch.
 * Persist the local stop across reloads and login changes. Only a successful,
 * current explicit opt-in may clear it; server refetches never do.
 */
export function withdrawAccountAnalytics(owner: number) {
  if (!Number.isSafeInteger(owner) || owner <= 0) return
  const key = withdrawalKey(owner)
  const marker = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  withdrawals.set(key, marker)
  let stored = false
  for (const storage of stores) {
    try { window[storage].setItem(key, marker); stored = true } catch { /* keep the in-memory stop */ }
  }
  // Quota exhaustion can reject writes while allowing removals. If neither
  // durable store works, remove browser analytics consent as a second stop.
  if (!stored) clearConsent()
  refresh()
}

export function isAccountAnalyticsWithdrawn(owner: number | undefined) {
  return owner !== undefined && getAccountAnalyticsWithdrawalRevision(owner) !== null
}
