import { useAuthStore } from '@/features/auth/store'
import { isAdult } from '@/features/consent/age'
import { readConsent, subscribeConsent } from '@/features/consent/storage'
import { getAccessToken } from '@/lib/axios'

// Preferences are account data, not browser consent. Fail closed until the
// current account's response arrives; never persist this state across logins.
let preferenceOwner: number | null = null
let accountOptIn = false
const withdrawals = new Set<number>()
let snapshot = { owner: null as number | null, eligible: false, generation: 0 }
const listeners = new Set<() => void>()

function refresh() {
  const auth = useAuthStore.getState()
  const owner = auth.isAuthenticated ? auth.user?.pk ?? null : null
  if (owner !== snapshot.owner) {
    preferenceOwner = null
    accountOptIn = false
  }
  const eligible = Boolean(
    import.meta.env.VITE_API_URL && import.meta.env.VITE_USE_MOCKS !== 'true' &&
    owner && getAccessToken() && isAdult(auth.user?.date_of_birth) &&
    readConsent()?.analytics === true && preferenceOwner === owner && accountOptIn && !withdrawals.has(owner),
  )
  if (owner !== snapshot.owner || eligible !== snapshot.eligible) {
    snapshot = { owner, eligible, generation: snapshot.generation + 1 }
    listeners.forEach((listener) => listener())
  }
  return snapshot
}

useAuthStore.subscribe(refresh)
subscribeConsent(refresh)
refresh()

export function getTelemetrySession() {
  return refresh()
}

export function subscribeTelemetrySession(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function setAccountAnalyticsPreference(owner: number, enabled: boolean, explicitOptIn = false) {
  refresh()
  if (owner !== snapshot.owner) return
  if (enabled && explicitOptIn) withdrawals.delete(owner)
  preferenceOwner = owner
  accountOptIn = enabled === true
  refresh()
}

/** A failed privacy save must not be undone by a later background refetch.
 * Keep withdrawal local for this browser session until an explicit opt-in saves.
 */
export function withdrawAccountAnalytics(owner: number) {
  withdrawals.add(owner)
  refresh()
}

export function isAccountAnalyticsWithdrawn(owner: number | undefined) {
  return owner !== undefined && withdrawals.has(owner)
}
