import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function setup() {
  const { useAuthStore } = await import('@/features/auth/store')
  const { writeConsent } = await import('@/features/consent/storage')
  const session = await import('./session')
  const signIn = (pk: number) => useAuthStore.getState().setAuth({ pk, date_of_birth: '1990-01-01', username: '', email: '', first_name: '', last_name: '' }, `token-${pk}`)
  signIn(1)
  writeConsent(true)
  session.setAccountAnalyticsPreference(1, true)
  return { ...session, useAuthStore, signIn }
}

beforeEach(() => {
  vi.resetModules()
  localStorage.clear(); sessionStorage.clear()
  vi.stubEnv('VITE_API_URL', 'https://example.test/api/v1')
  vi.stubEnv('VITE_USE_MOCKS', 'false')
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); localStorage.clear(); sessionStorage.clear() })

describe('durable account analytics withdrawal', () => {
  it('survives a module reload and a fresh server preference response', async () => {
    const first = await setup()
    first.withdrawAccountAnalytics(1)
    expect(first.getTelemetrySession().eligible).toBe(false)
    vi.resetModules()
    const reloaded = await setup()
    expect(reloaded.isAccountAnalyticsWithdrawn(1)).toBe(true)
    expect(reloaded.getTelemetrySession().eligible).toBe(false)
    reloaded.setAccountAnalyticsPreference(1, true, true, reloaded.getAccountAnalyticsWithdrawalRevision(1))
    expect(reloaded.isAccountAnalyticsWithdrawn(1)).toBe(false)
    expect(reloaded.getTelemetrySession().eligible).toBe(true)
  })
  it('keeps different accounts and API environments separate', async () => {
    const session = await setup()
    session.withdrawAccountAnalytics(1)
    session.signIn(2)
    session.setAccountAnalyticsPreference(2, true)
    expect(session.getTelemetrySession().eligible).toBe(true)
    session.signIn(1)
    session.setAccountAnalyticsPreference(1, true)
    expect(session.getTelemetrySession().eligible).toBe(false)
    vi.stubEnv('VITE_API_URL', 'https://other.test/api/v1')
    expect(session.isAccountAnalyticsWithdrawn(1)).toBe(false)
  })
  it('observes withdrawal made by another tab immediately', async () => {
    const session = await setup()
    expect(session.getTelemetrySession().eligible).toBe(true)
    const key = `jokesfor-account-analytics-withdrawal:v1:${encodeURIComponent('https://example.test/api/v1')}:1`
    localStorage.setItem(key, 'another-tab-withdrawal')
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: 'another-tab-withdrawal' }))
    expect(session.getTelemetrySession().eligible).toBe(false)
  })
  it('does not clear a newer withdrawal when an older explicit opt-in finishes', async () => {
    const session = await setup()
    const before = session.getAccountAnalyticsWithdrawalRevision(1)
    session.withdrawAccountAnalytics(1)
    session.setAccountAnalyticsPreference(1, true, true, before)
    expect(session.getTelemetrySession().eligible).toBe(false)
  })
  it('uses session backup when local storage writes fail', async () => {
    const session = await setup()
    const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (this === localStorage) throw new Error('quota')
      return original.call(this, key, value)
    })
    session.withdrawAccountAnalytics(1)
    vi.resetModules()
    const reloaded = await import('./session')
    expect(reloaded.isAccountAnalyticsWithdrawn(1)).toBe(true)
  })
  it('removes browser consent when both durable stores reject writes', async () => {
    const session = await setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    session.withdrawAccountAnalytics(1)
    expect(localStorage.getItem('jokesfor-consent')).toBeNull()
    expect(session.getTelemetrySession().eligible).toBe(false)
  })
  it('fails closed when storage cannot be read or its getter throws', async () => {
    const session = await setup()
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('blocked') })
    expect(session.isAccountAnalyticsWithdrawn(1)).toBe(true)
    expect(session.getTelemetrySession().eligible).toBe(false)
  })
})
