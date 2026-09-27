import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/store'
import { clearConsent, writeConsent } from '@/features/consent/storage'
import { setAccountAnalyticsPreference } from '@/features/telemetry/session'
import { setAccessToken } from '@/lib/axios'
import { __resetTelemetryForTests, flush, trackDwell, trackImpression } from './telemetry'

const sent = vi.fn().mockResolvedValue({ ok: true })
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const signIn = (pk: number) => {
  useAuthStore.getState().setAuth({ pk, date_of_birth: '1990-01-01', username: '', email: '', first_name: '', last_name: '' }, `token-${pk}`)
  setAccountAnalyticsPreference(pk, true)
}
const events = () => sent.mock.calls.flatMap((call) => JSON.parse(call[1].body).events)

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'https://example.test/api/v1')
  vi.stubEnv('VITE_USE_MOCKS', 'false')
  vi.stubGlobal('fetch', sent)
  sent.mockClear()
  useAuthStore.getState().logout()
  clearConsent()
  __resetTelemetryForTests()
  writeConsent(true)
  signIn(91)
})
afterEach(() => { useAuthStore.getState().logout(); clearConsent(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it('captures versioned identity and time before buffering, rather than inventing them at upload', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-27T10:00:00Z'))
  trackImpression(42, 'feed')
  vi.setSystemTime(new Date('2026-09-27T10:01:00Z'))
  flush()
  expect(events()[0]).toMatchObject({ schema_version: 2, platform: 'web', occurred_at: '2026-09-27T10:00:00.000Z', joke: 42 })
  expect(events()[0].event_id).toMatch(uuid)
  expect(events()[0].session_id).toMatch(uuid)
  expect(events()[0]).not.toHaveProperty('user_id')
})

it('gives separate attention samples different event IDs but one eligible session', () => {
  trackDwell(42, 'feed', 1500)
  trackDwell(42, 'feed', 2500)
  flush()
  const [first, second] = events()
  expect(first.event_id).toMatch(uuid)
  expect(second.event_id).toMatch(uuid)
  expect(first.event_id).not.toBe(second.event_id)
  expect(first.session_id).toBe(second.session_id)
})

it('keeps session identity across batches and token refresh but rotates it after consent changes', () => {
  trackDwell(42, 'feed', 1500); flush()
  useAuthStore.getState().setToken('refreshed')
  trackDwell(42, 'feed', 1500); flush()
  writeConsent(false); writeConsent(true)
  trackDwell(42, 'feed', 1500); flush()
  const [first, refreshed, renewed] = events()
  expect(first.session_id).toMatch(uuid)
  expect(first.session_id).toBe(refreshed.session_id)
  expect(renewed.session_id).not.toBe(first.session_id)
})

it('rotates identity and drops old queued samples across account changes', () => {
  trackDwell(42, 'feed', 1500); flush()
  trackDwell(43, 'feed', 1500)
  signIn(92)
  trackDwell(44, 'feed', 1500); flush()
  const [first, second] = events()
  expect(events()).toHaveLength(2)
  expect(second.joke).toBe(44)
  expect(second.session_id).not.toBe(first.session_id)
  expect(sent.mock.calls[1][1].headers.Authorization).toBe('Bearer token-92')
})

it('fails closed when secure event identity is unavailable without interrupting reading', () => {
  vi.stubGlobal('crypto', {})
  expect(() => { trackImpression(42, 'feed'); flush() }).not.toThrow()
  expect(sent).not.toHaveBeenCalled()
})

it('does not attribute an active reader to a late global refresh from another account', () => {
  signIn(92)
  setAccessToken('late-refresh-from-account-91')
  trackDwell(42, 'feed', 1500); flush()
  expect(sent.mock.calls[0][1].headers.Authorization).toBe('Bearer token-92')
})
