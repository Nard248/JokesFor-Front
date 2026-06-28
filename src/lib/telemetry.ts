/**
 * Audience telemetry — Phase 1.
 *
 * A tiny fire-and-forget buffer that records joke `impression` and `reveal`
 * events and ships them to the backend in batches. This is what makes the
 * creator-insights `payoff_rate` / reach / source-mix numbers REAL.
 *
 * Hard rules (see the task brief):
 *   - MUST be fire-and-forget. It MUST NEVER throw, block, or break the UI.
 *     Every public entry point is wrapped; failures are silent.
 *   - Only enqueue/flush when the gate is open:
 *       authenticated  AND  consent granted  AND  verified adult
 *       AND real-API mode (VITE_API_URL set and not USE_MOCKS).
 *   - Batch size ≤ 50 (backend cap). We flush at ~10, and on page-hide.
 *   - Impressions are deduped server-side per user/joke/day, but the client
 *     still dedupes per (joke, type) for the page-session to avoid spam.
 *
 * Why no React here: the buffer is a module singleton so any surface (cards,
 * detail pages, daily hero) can call the helpers without prop-drilling, and so
 * the page-hide flush works without a mounted component.
 */
import { getAccessToken } from './axios'
import { readConsent } from '@/features/consent/storage'
import { isAdult } from '@/features/consent/age'
import { useAuthStore } from '@/features/auth/store'

export type TelemetryType = 'impression' | 'reveal'
export type TelemetrySource = 'feed' | 'explore' | 'search' | 'daily' | 'pack' | 'other'

interface TelemetryEvent {
  joke: number
  type: TelemetryType
  source: TelemetrySource
}

const FLUSH_AT = 10
const MAX_BATCH = 50

const USE_MOCKS =
  !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCKS === 'true'

// Resolve the events endpoint against the same base URL axios uses, so a
// sendBeacon (which can't use the axios instance) hits the right host.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const ENDPOINT = `${API_URL.replace(/\/$/, '')}/telemetry/events`

// In-memory queue + per-page-session dedup set. A page-session is the lifetime
// of this module (i.e. until a full reload), which is exactly the window the
// brief wants for "one impression per card per page-session".
const queue: TelemetryEvent[] = []
const seen = new Set<string>()
let listenersBound = false

/**
 * The gate. Telemetry only flows when EVERY condition holds. Defensive: any
 * exception (e.g. storage access throwing) collapses to `false` — no tracking.
 */
function gateOpen(): boolean {
  try {
    if (USE_MOCKS) return false
    if (!getAccessToken()) return false

    const { isAuthenticated, user } = useAuthStore.getState()
    if (!isAuthenticated) return false
    if (!isAdult(user?.date_of_birth)) return false

    const consent = readConsent()
    if (!consent?.analytics) return false

    return true
  } catch {
    return false
  }
}

function dedupKey(e: TelemetryEvent): string {
  return `${e.type}:${e.joke}:${e.source}`
}

function send(events: TelemetryEvent[]): void {
  if (events.length === 0) return
  const body = JSON.stringify({ events })
  const token = getAccessToken()

  try {
    // Prefer sendBeacon on page-hide paths — it survives unload. It can't set
    // an Authorization header, but the backend also accepts the httpOnly
    // refresh/session cookie (withCredentials), so beacon stays authenticated.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon(ENDPOINT, blob)) return
    }
  } catch {
    // fall through to fetch
  }

  try {
    // keepalive lets the request outlive the page on a normal flush, too.
    void fetch(ENDPOINT, {
      method: 'POST',
      keepalive: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    }).catch(() => { /* fire-and-forget */ })
  } catch {
    /* never throw */
  }
}

/** Flush the queue now, in ≤50-event batches. Safe to call any time. */
export function flush(): void {
  try {
    if (queue.length === 0) return
    if (!gateOpen()) {
      // Gate closed (e.g. logged out mid-session) — drop quietly.
      queue.length = 0
      return
    }
    while (queue.length > 0) {
      send(queue.splice(0, MAX_BATCH))
    }
  } catch {
    /* never throw */
  }
}

function bindPageHideListeners(): void {
  if (listenersBound || typeof document === 'undefined') return
  listenersBound = true
  try {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
    window.addEventListener('pagehide', () => flush())
  } catch {
    /* never throw */
  }
}

function enqueue(event: TelemetryEvent): void {
  try {
    if (!gateOpen()) return
    if (!Number.isFinite(event.joke) || event.joke <= 0) return

    const key = dedupKey(event)
    if (seen.has(key)) return
    seen.add(key)

    bindPageHideListeners()
    queue.push(event)
    if (queue.length >= FLUSH_AT) flush()
  } catch {
    /* never throw */
  }
}

/** Record that a joke card became visible to the user. Deduped per session. */
export function trackImpression(jokeId: number, source: TelemetrySource): void {
  enqueue({ joke: jokeId, type: 'impression', source })
}

/** Record that the user revealed a joke's punchline. Deduped per session. */
export function trackReveal(jokeId: number, source: TelemetrySource): void {
  enqueue({ joke: jokeId, type: 'reveal', source })
}

/** Test-only: reset module state between cases. */
export function __resetTelemetryForTests(): void {
  queue.length = 0
  seen.clear()
}
