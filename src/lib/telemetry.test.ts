import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mocks for the gate's dependencies ──────────────────────────────────────
const authState = { isAuthenticated: true, user: { date_of_birth: '1990-01-01' } as { date_of_birth?: string | null } }
vi.mock('@/features/auth/store', () => ({
  useAuthStore: { getState: () => authState },
}))

let token: string | null = 'tok'
vi.mock('@/lib/axios', () => ({
  getAccessToken: () => token,
}))

let consent: { analytics: boolean } | null = { analytics: true }
vi.mock('@/features/consent/storage', () => ({
  readConsent: () => consent,
}))
// Real isAdult is fine, but keep it deterministic and independent.
vi.mock('@/features/consent/age', () => ({
  isAdult: (dob?: string | null) => dob === '1990-01-01',
}))

// Load the telemetry module fresh with a chosen env, after the mocks above.
async function loadTelemetry(opts: { mocks: boolean }) {
  vi.resetModules()
  vi.stubEnv('VITE_API_URL', opts.mocks ? '' : 'http://x/api/v1')
  vi.stubEnv('VITE_USE_MOCKS', opts.mocks ? 'true' : 'false')
  return await import('./telemetry')
}

beforeEach(() => {
  // Reset gate inputs to the "open" baseline before each test.
  authState.isAuthenticated = true
  authState.user = { date_of_birth: '1990-01-01' }
  token = 'tok'
  consent = { analytics: true }
  // Transport is fetch(keepalive) — sendBeacon cannot carry the bearer token
  // the API requires, so beacon-delivered events were rejected 403.
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true } as Response)))
  vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('telemetry gating', () => {
  it('does not send when USE_MOCKS (no real API)', async () => {
    const t = await loadTelemetry({ mocks: true })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackImpression(1, 'feed')
    t.flush()
    expect(sent).not.toHaveBeenCalled()
  })

  it('does not send when unauthenticated', async () => {
    authState.isAuthenticated = false
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackImpression(1, 'feed')
    t.flush()
    expect(sent).not.toHaveBeenCalled()
  })

  it('does not send when there is no access token', async () => {
    token = null
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackImpression(1, 'feed')
    t.flush()
    expect(sent).not.toHaveBeenCalled()
  })

  it('does not send when consent is not granted', async () => {
    consent = { analytics: false }
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackImpression(1, 'feed')
    t.flush()
    expect(sent).not.toHaveBeenCalled()
  })

  it('does not send when the user is not a verified adult', async () => {
    authState.user = { date_of_birth: '2015-01-01' }
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackImpression(1, 'feed')
    t.flush()
    expect(sent).not.toHaveBeenCalled()
  })

  it('sends when the gate is fully open', async () => {
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackImpression(1, 'feed')
    t.flush()
    expect(sent).toHaveBeenCalledTimes(1)
  })
})

describe('telemetry transport', () => {
  // The backend enforces CSRF on the cookie-auth path. navigator.sendBeacon can
  // set neither Authorization nor X-CSRFToken, so every beacon-delivered event
  // was rejected 403 and silently lost -- verified in a real browser, where the
  // beacon returned true (so the fetch fallback never ran) and the request
  // landed as "POST /api/v1/telemetry/events => 403 Forbidden".
  // Events must go out on a transport that can carry the bearer token.
  it('sends the access token so the request is actually accepted', async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve({ ok: true } as Response))
    vi.stubGlobal('fetch', fetchMock)
    const beacon = vi.fn(() => true)
    vi.stubGlobal('navigator', { sendBeacon: beacon })

    const t = await loadTelemetry({ mocks: false })
    t.trackImpression(1, 'feed')
    t.flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok')
    expect(init.keepalive).toBe(true)
    expect(beacon).not.toHaveBeenCalled()
  })

  it('still delivers on unload via keepalive rather than a credential-less beacon', async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve({ ok: true } as Response))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) })

    const t = await loadTelemetry({ mocks: false })
    t.trackReveal(2, 'search')
    t.flush()

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.keepalive).toBe(true)
  })
})

describe('telemetry buffering + dedup', () => {
  // Capture the JSON each flush puts on the wire. The transport is
  // fetch(keepalive) with a plain string body, so read it straight off the call.
  function captureBeaconBodies() {
    const bodies: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        if (init?.body) bodies.push(String(init.body))
        return Promise.resolve({ ok: true } as Response)
      }),
    )
    return bodies
  }

  it('dedupes the same (type, joke, source) within a page-session', async () => {
    const bodies = captureBeaconBodies()
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackImpression(7, 'feed')
    t.trackImpression(7, 'feed') // duplicate — dropped
    t.flush()
    expect(sent).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(bodies[0])
    expect(payload.events).toHaveLength(1)
    expect(payload.events[0]).toEqual({ joke: 7, type: 'impression', source: 'feed' })
  })

  it('treats impression and reveal of the same joke as distinct events', async () => {
    const bodies = captureBeaconBodies()
    const t = await loadTelemetry({ mocks: false })
    t.trackImpression(7, 'feed')
    t.trackReveal(7, 'feed')
    t.flush()
    const payload = JSON.parse(bodies[0])
    expect(payload.events).toHaveLength(2)
  })

  it('auto-flushes once the queue reaches the batch threshold (~10)', async () => {
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    for (let i = 1; i <= 10; i++) t.trackImpression(i, 'feed')
    // Reached FLUSH_AT — should have auto-flushed without an explicit flush().
    expect(sent).toHaveBeenCalledTimes(1)
  })

  it('ignores non-positive joke ids', async () => {
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackImpression(0, 'feed')
    t.trackImpression(-3, 'feed')
    t.flush()
    expect(sent).not.toHaveBeenCalled()
  })

  it('never throws even if the transport fails', async () => {
    vi.stubGlobal('navigator', {
      sendBeacon: () => {
        throw new Error('boom')
      },
    })
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('nope'))))
    const t = await loadTelemetry({ mocks: false })
    expect(() => {
      t.trackImpression(1, 'feed')
      t.flush()
    }).not.toThrow()
  })
})

describe('trackDwell helper (Phase 2)', () => {
  function captureBeaconBodies() {
    const bodies: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        if (init?.body) bodies.push(String(init.body))
        return Promise.resolve({ ok: true } as Response)
      }),
    )
    return bodies
  }

  it('enqueues a dwell event with value and optional scroll_pct', async () => {
    const bodies = captureBeaconBodies()
    const t = await loadTelemetry({ mocks: false })
    t.trackDwell(7, 'feed', 3_200, 64)
    t.flush()
    const payload = JSON.parse(bodies[0])
    expect(payload.events[0]).toEqual({
      joke: 7,
      type: 'dwell',
      source: 'feed',
      value: 3_200,
      scroll_pct: 64,
    })
  })

  it('omits scroll_pct when not provided', async () => {
    const bodies = captureBeaconBodies()
    const t = await loadTelemetry({ mocks: false })
    t.trackDwell(7, 'daily', 1_500)
    t.flush()
    const payload = JSON.parse(bodies[0])
    expect(payload.events[0]).toEqual({ joke: 7, type: 'dwell', source: 'daily', value: 1_500 })
    expect('scroll_pct' in payload.events[0]).toBe(false)
  })

  it('drops sub-1s samples (too short to count as a read)', async () => {
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackDwell(7, 'feed', 800)
    t.flush()
    expect(sent).not.toHaveBeenCalled()
  })

  it('clamps value to the 600000ms cap and rounds + clamps scroll_pct', async () => {
    const bodies = captureBeaconBodies()
    const t = await loadTelemetry({ mocks: false })
    t.trackDwell(7, 'feed', 9_999_999, 142.7)
    t.flush()
    const payload = JSON.parse(bodies[0])
    expect(payload.events[0].value).toBe(600_000)
    expect(payload.events[0].scroll_pct).toBe(100)
  })

  it('does NOT dedupe dwell — multiple read samples for one joke all count', async () => {
    const bodies = captureBeaconBodies()
    const t = await loadTelemetry({ mocks: false })
    t.trackDwell(7, 'feed', 2_000)
    t.trackDwell(7, 'feed', 3_000)
    t.flush()
    const payload = JSON.parse(bodies[0])
    expect(payload.events).toHaveLength(2)
  })

  it('respects the gate (no dwell when consent is off)', async () => {
    consent = { analytics: false }
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackDwell(7, 'feed', 4_000)
    t.flush()
    expect(sent).not.toHaveBeenCalled()
  })
})

describe('trackWatch helper (Phase 3)', () => {
  function captureBeaconBodies() {
    const bodies: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        if (init?.body) bodies.push(String(init.body))
        return Promise.resolve({ ok: true } as Response)
      }),
    )
    return bodies
  }

  it('enqueues a watch event with watch_ms and watch_pct', async () => {
    const bodies = captureBeaconBodies()
    const t = await loadTelemetry({ mocks: false })
    t.trackWatch(7, 'feed', 5_200, 9)
    t.flush()
    const payload = JSON.parse(bodies[0])
    expect(payload.events[0]).toEqual({
      joke: 7,
      type: 'watch',
      source: 'feed',
      watch_ms: 5_200,
      watch_pct: 9,
    })
  })

  it('omits watch_pct when not provided', async () => {
    const bodies = captureBeaconBodies()
    const t = await loadTelemetry({ mocks: false })
    t.trackWatch(7, 'daily', 3_000)
    t.flush()
    const payload = JSON.parse(bodies[0])
    expect(payload.events[0]).toEqual({ joke: 7, type: 'watch', source: 'daily', watch_ms: 3_000 })
    expect('watch_pct' in payload.events[0]).toBe(false)
  })

  it('clamps watch_ms to the 600000ms cap and rounds + clamps watch_pct', async () => {
    const bodies = captureBeaconBodies()
    const t = await loadTelemetry({ mocks: false })
    t.trackWatch(7, 'feed', 9_999_999, 142.7)
    t.flush()
    const payload = JSON.parse(bodies[0])
    expect(payload.events[0].watch_ms).toBe(600_000)
    expect(payload.events[0].watch_pct).toBe(100)
  })

  it('does NOT dedupe watch — multiple watch samples for one joke all count', async () => {
    const bodies = captureBeaconBodies()
    const t = await loadTelemetry({ mocks: false })
    t.trackWatch(7, 'feed', 2_000)
    t.trackWatch(7, 'feed', 5_000)
    t.flush()
    const payload = JSON.parse(bodies[0])
    expect(payload.events).toHaveLength(2)
  })

  it('does not send when anonymous / gate closed (not authenticated)', async () => {
    authState.isAuthenticated = false
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackWatch(7, 'feed', 5_000, 50)
    t.flush()
    expect(sent).not.toHaveBeenCalled()
  })

  it('respects the gate (no watch when consent is off)', async () => {
    consent = { analytics: false }
    const t = await loadTelemetry({ mocks: false })
    const sent = fetch as unknown as ReturnType<typeof vi.fn>
    t.trackWatch(7, 'feed', 5_000, 50)
    t.flush()
    expect(sent).not.toHaveBeenCalled()
  })

  it('never throws even with a non-finite watch_ms', async () => {
    const t = await loadTelemetry({ mocks: false })
    expect(() => t.trackWatch(7, 'feed', NaN, 50)).not.toThrow()
  })
})
