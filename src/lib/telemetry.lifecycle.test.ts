import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/store'
import { clearConsent, writeConsent } from '@/features/consent/storage'
import { setAccountAnalyticsPreference } from '@/features/telemetry/session'
import { __resetTelemetryForTests, trackImpression, flush } from './telemetry'

const user = (pk: number, date_of_birth = '1990-01-01') => ({ pk, date_of_birth, username: `reader${pk}`, email: '', first_name: '', last_name: '' })
const sent = vi.fn().mockResolvedValue({ ok: true })
const signIn = (pk: number) => {
  useAuthStore.getState().setAuth(user(pk), `token-${pk}`)
  setAccountAnalyticsPreference(pk, true)
}

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'https://example.test/api/v1')
  vi.stubEnv('VITE_USE_MOCKS', 'false')
  vi.stubGlobal('fetch', sent)
  sent.mockClear()
  useAuthStore.getState().logout()
  clearConsent()
  __resetTelemetryForTests()
  writeConsent(true)
})
afterEach(() => { useAuthStore.getState().logout(); clearConsent(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('account-bound audience telemetry', () => {
  it('requires account opt-in as well as browser consent', () => {
    useAuthStore.getState().setAuth(user(1), 'token-1')
    trackImpression(11, 'feed')
    flush()
    expect(sent).not.toHaveBeenCalled()
    setAccountAnalyticsPreference(1, true)
    trackImpression(11, 'feed')
    flush()
    expect(sent).toHaveBeenCalledTimes(1)
  })
  it('drops queued events on account switch and resets dedup for the new reader', () => {
    signIn(1)
    trackImpression(11, 'feed')
    signIn(2)
    trackImpression(11, 'feed')
    flush()
    expect(sent).toHaveBeenCalledTimes(1)
    const init = sent.mock.calls[0][1]
    expect(init.headers.Authorization).toBe('Bearer token-2')
    expect(JSON.parse(init.body).events).toHaveLength(1)
  })
  it('drops old samples when browser consent is withdrawn then restored before flush', () => {
    signIn(1)
    trackImpression(11, 'feed')
    writeConsent(false)
    writeConsent(true)
    flush()
    expect(sent).not.toHaveBeenCalled()
    trackImpression(11, 'feed')
    flush()
    expect(sent).toHaveBeenCalledTimes(1)
  })
  it('drops old samples when account opt-in is withdrawn then restored', () => {
    signIn(1)
    trackImpression(11, 'feed')
    setAccountAnalyticsPreference(1, false)
    setAccountAnalyticsPreference(1, true)
    flush()
    expect(sent).not.toHaveBeenCalled()
  })
  it('does not accept a previous account preference response after switching accounts', () => {
    signIn(1)
    useAuthStore.getState().setAuth(user(2), 'token-2')
    setAccountAnalyticsPreference(1, true)
    trackImpression(11, 'feed')
    flush()
    expect(sent).not.toHaveBeenCalled()
  })
  it('clears samples on logout even if the same reader logs back in', () => {
    signIn(1)
    trackImpression(11, 'feed')
    useAuthStore.getState().logout()
    signIn(1)
    flush()
    expect(sent).not.toHaveBeenCalled()
  })
  it('retains the same reader sample across token refresh', () => {
    signIn(1)
    trackImpression(11, 'feed')
    useAuthStore.getState().setToken('refreshed')
    flush()
    expect(sent.mock.calls[0][1].headers.Authorization).toBe('Bearer refreshed')
  })
  it('honors withdrawal even when browser storage fails', () => {
    signIn(1)
    trackImpression(11, 'feed')
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('unavailable') })
    writeConsent(false)
    flush()
    expect(sent).not.toHaveBeenCalled()
    setItem.mockRestore()
  })
  it('never enables analytics for minors' , () => {
    useAuthStore.getState().setAuth(user(1, '2020-01-01'), 'token-1')
    setAccountAnalyticsPreference(1, true)
    trackImpression(11, 'feed')
    flush()
    expect(sent).not.toHaveBeenCalled()
  })
})
