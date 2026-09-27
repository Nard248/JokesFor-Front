import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/store'
import { writeConsent, clearConsent } from '@/features/consent/storage'
import { getTelemetrySession, setAccountAnalyticsPreference } from '@/features/telemetry/session'
import { usePreferences, useUpdatePreferences } from './api'
import type { UserPreferences } from '@/lib/mock-data'
const get = vi.fn()
const update = vi.fn()
vi.mock('@/lib/api-adapter', () => ({ preferencesAdapter: { get: () => get(), update: (value: unknown) => update(value) } }))
const prefs = (enabled: boolean) => ({ privacy: { shareAnalytics: enabled, publicProfile: true, showActivity: true }, theme: 'light', notifications: {} } as UserPreferences)
const signIn = (pk: number) => useAuthStore.getState().setAuth({ pk, date_of_birth: '1990-01-01', username: '', email: '', first_name: '', last_name: '' }, `token-${pk}`)
const wrapper = (client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })) => {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'https://example.test/api/v1')
  vi.stubEnv('VITE_USE_MOCKS', 'false')
  get.mockReset(); update.mockReset(); useAuthStore.getState().logout(); writeConsent(true)
  signIn(1); setAccountAnalyticsPreference(1, false, true); setAccountAnalyticsPreference(1, true, true); useAuthStore.getState().logout()
})
afterEach(() => { act(() => { useAuthStore.getState().logout(); clearConsent() }); vi.unstubAllEnvs() })

describe('account audience preference lifecycle', () => {
  it('does not fetch while signed out, then enables only after the current account preference arrives', async () => {
    get.mockResolvedValue(prefs(true))
    const { result } = renderHook(() => usePreferences(), { wrapper: wrapper() })
    expect(get).not.toHaveBeenCalled()
    act(() => signIn(1))
    await waitFor(() => expect(result.current.data).toEqual(prefs(true)))
    expect(getTelemetrySession().eligible).toBe(true)
  })
  it('does not reuse account A cache or a late response as account B consent', async () => {
    let resolveA!: (data: UserPreferences) => void
    get.mockImplementationOnce(() => new Promise((resolve) => { resolveA = resolve })).mockResolvedValueOnce(prefs(false))
    signIn(1)
    renderHook(() => usePreferences(), { wrapper: wrapper() })
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1))
    act(() => signIn(2))
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    await act(async () => resolveA(prefs(true)))
    expect(getTelemetrySession().owner).toBe(2)
    expect(getTelemetrySession().eligible).toBe(false)
  })
  it('does not send account A preference intent under account B after asynchronous cancellation', async () => {
    const client = new QueryClient()
    let unblock!: () => void
    const cancel = vi.spyOn(client, 'cancelQueries').mockImplementation(() => new Promise<void>((resolve) => { unblock = resolve }))
    signIn(1)
    const { result } = renderHook(() => useUpdatePreferences(), { wrapper: wrapper(client) })
    act(() => result.current.mutate({ privacy: prefs(true).privacy }))
    await waitFor(() => expect(cancel).toHaveBeenCalled())
    act(() => signIn(2))
    await act(async () => unblock())
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(update).not.toHaveBeenCalled()
    cancel.mockRestore()
  })
  it('rejects an earlier login intent after A to B to A during query cancellation', async () => {
    const client = new QueryClient()
    let unblock!: () => void
    const cancel = vi.spyOn(client, 'cancelQueries').mockImplementation(() => new Promise<void>((resolve) => { unblock = resolve }))
    signIn(1)
    const { result } = renderHook(() => useUpdatePreferences(), { wrapper: wrapper(client) })
    act(() => result.current.mutate({ privacy: prefs(true).privacy }))
    await waitFor(() => expect(cancel).toHaveBeenCalled())
    act(() => { signIn(2); signIn(1) })
    await act(async () => unblock())
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(update).not.toHaveBeenCalled()
  })
  it('does not reuse a previous login cache after A to B to A', async () => {
    get.mockResolvedValueOnce(prefs(true)).mockResolvedValueOnce(prefs(false))
    signIn(1)
    const { result } = renderHook(() => usePreferences(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.privacy.shareAnalytics).toBe(true))
    act(() => { signIn(2); signIn(1) })
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.data?.privacy.shareAnalytics).toBe(false))
    expect(getTelemetrySession().eligible).toBe(false)
  })
  it('discards an in-flight mutation result and callback from a previous login', async () => {
    let finish!: (data: UserPreferences) => void
    update.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const succeeded = vi.fn()
    signIn(1)
    const { result } = renderHook(() => useUpdatePreferences(), { wrapper: wrapper() })
    act(() => result.current.mutate({ privacy: prefs(true).privacy }, { onSuccess: succeeded }))
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
    act(() => { signIn(2); signIn(1) })
    await act(async () => finish(prefs(true)))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(succeeded).not.toHaveBeenCalled()
    expect(getTelemetrySession().eligible).toBe(false)
  })
  it('does not let an older successful opt-in undo a newer withdrawal', async () => {
    let finishOptIn!: (data: UserPreferences) => void
    update.mockImplementationOnce(() => new Promise((resolve) => { finishOptIn = resolve })).mockRejectedValueOnce(new Error('offline'))
    signIn(1)
    const { result } = renderHook(() => useUpdatePreferences(), { wrapper: wrapper() })
    act(() => result.current.mutate({ privacy: prefs(true).privacy }))
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
    act(() => result.current.mutate({ privacy: prefs(false).privacy }))
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2))
    await act(async () => finishOptIn(prefs(true)))
    expect(getTelemetrySession().eligible).toBe(false)
  })
  it('keeps a failed withdrawal off through server refetch, until explicit opt-in succeeds', async () => {
    get.mockResolvedValue(prefs(true))
    update.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(prefs(true))
    signIn(1)
    setAccountAnalyticsPreference(1, true, true)
    const { result } = renderHook(() => ({ query: usePreferences(), mutation: useUpdatePreferences() }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.query.data).toBeDefined())
    act(() => result.current.mutation.mutate({ privacy: prefs(false).privacy }))
    await waitFor(() => expect(result.current.mutation.isError).toBe(true))
    get.mockResolvedValue({ ...prefs(true), theme: 'dark' })
    await act(async () => { await result.current.query.refetch() })
    await waitFor(() => expect(result.current.query.data?.theme).toBe('dark'))
    expect(getTelemetrySession().eligible).toBe(false)
    expect(result.current.query.data?.privacy.shareAnalytics).toBe(false)
    act(() => result.current.mutation.mutate({ privacy: prefs(true).privacy }))
    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(getTelemetrySession().eligible).toBe(true)
  })
  it('closes the telemetry gate immediately during a pending opt-out save', async () => {
    get.mockResolvedValue(prefs(true))
    update.mockImplementation(() => new Promise(() => {}))
    signIn(1)
    const { result } = renderHook(() => ({ query: usePreferences(), mutation: useUpdatePreferences() }), { wrapper: wrapper() })
    await waitFor(() => expect(getTelemetrySession().eligible).toBe(true))
    act(() => result.current.mutation.mutate({ privacy: prefs(false).privacy }))
    await waitFor(() => expect(result.current.mutation.isPending).toBe(true))
    expect(getTelemetrySession().eligible).toBe(false)
  })
})
