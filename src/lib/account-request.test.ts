import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/store'
import { setAccessToken } from '@/lib/axios'
import { accountRequest, captureAccountIntent } from './account-request'

const signIn = (pk: number) => useAuthStore.getState().setAuth({ pk, username: '', email: '', first_name: '', last_name: '' }, `token-${pk}`)
afterEach(() => { useAuthStore.getState().logout(); vi.restoreAllMocks() })

describe('account-bound transport', () => {
  it('uses the captured auth-store token even if a stale global refresh overwrites the shared token', async () => {
    signIn(2)
    const intent = captureAccountIntent()
    setAccessToken('late-account-1-token')
    const request = vi.spyOn(axios, 'request').mockResolvedValue({ data: { ok: true } })
    await expect(accountRequest(intent, 'PATCH', '/users/me/preferences/', { privacy: { share_analytics: false } })).resolves.toEqual({ ok: true })
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      withCredentials: false, headers: { Authorization: 'Bearer token-2' },
    }))
  })
  it.each([401, 403])('never refreshes, recovers CSRF or retries an HTTP %s', async (status) => {
    signIn(1)
    const intent = captureAccountIntent()
    const failure = { response: { status, data: { detail: 'CSRF Failed: expired' } } }
    const request = vi.spyOn(axios, 'request').mockRejectedValue(failure)
    const post = vi.spyOn(axios, 'post')
    const get = vi.spyOn(axios, 'get')
    await expect(accountRequest(intent, 'PATCH', '/users/me/preferences/', {})).rejects.toBe(failure)
    expect(request).toHaveBeenCalledTimes(1)
    expect(post).not.toHaveBeenCalled()
    expect(get).not.toHaveBeenCalled()
  })
  it('rejects queued work after A to B to A without dispatching', async () => {
    signIn(1)
    const intent = captureAccountIntent()
    signIn(2); signIn(1)
    const request = vi.spyOn(axios, 'request')
    await expect(accountRequest(intent, 'PATCH', '/users/me/preferences/', {})).rejects.toThrow('account changed')
    expect(request).not.toHaveBeenCalled()
  })
  it('discards a late read after logout and the same account signs back in', async () => {
    signIn(1)
    const intent = captureAccountIntent()
    let resolve!: (value: { data: unknown }) => void
    vi.spyOn(axios, 'request').mockImplementation(() => new Promise((done) => { resolve = done }))
    const response = accountRequest(intent, 'GET', '/users/me/preferences/')
    useAuthStore.getState().logout(); signIn(1)
    resolve({ data: { privacy: { share_analytics: true } } })
    await expect(response).rejects.toThrow('account changed')
  })
  it('passes query cancellation into the transport', async () => {
    signIn(1)
    const signal = new AbortController().signal
    const request = vi.spyOn(axios, 'request').mockResolvedValue({ data: {} })
    await accountRequest(captureAccountIntent(), 'GET', '/users/me/preferences/', undefined, signal)
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ signal }))
  })
})
