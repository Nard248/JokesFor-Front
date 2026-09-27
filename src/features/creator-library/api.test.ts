import axios from 'axios'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/store'
import { setAccessToken } from '@/lib/axios'
import { captureLibraryOwner, libraryRequest } from './api'

const signIn = (pk: number) => useAuthStore.getState().setAuth({ pk, username: '', email: '', first_name: '', last_name: '' }, `token-${pk}`)
beforeEach(() => { useAuthStore.getState().logout(); signIn(1) })
afterEach(() => { useAuthStore.getState().logout(); vi.restoreAllMocks() })

it('ignores a delayed global refresh token from another account', async () => {
  signIn(2)
  setAccessToken('late-refresh-from-account-1')
  const request = vi.spyOn(axios, 'request').mockResolvedValue({ data: {} })
  await libraryRequest(captureLibraryOwner(), 'POST', '/creators/me/collections/', { name: 'Private B set' })
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ headers: { Authorization: 'Bearer token-2' } }))
})

it('uses the initiating account bearer without shared credential refresh or cookies', async () => {
  const request = vi.spyOn(axios, 'request').mockResolvedValue({ data: { private_note: 'My timing note' } })
  expect(await libraryRequest(captureLibraryOwner(), 'PATCH', '/creators/me/content/42/workspace/', { private_note: 'My timing note' })).toEqual({ private_note: 'My timing note' })
  expect(request).toHaveBeenCalledWith(expect.objectContaining({
    method: 'PATCH', withCredentials: false, headers: { Authorization: 'Bearer token-1' }, data: { private_note: 'My timing note' },
  }))
})

it('rejects a queued mutation after an account change before sending it', async () => {
  const request = vi.spyOn(axios, 'request')
  const intent = captureLibraryOwner()
  signIn(2)
  await expect(libraryRequest(intent, 'PATCH', '/creators/me/content/42/workspace/', {})).rejects.toThrow(/account changed/i)
  expect(request).not.toHaveBeenCalled()
})

it('rejects a stale read result even if the original account has signed back in', async () => {
  let finish!: (value: unknown) => void
  vi.spyOn(axios, 'request').mockImplementation(() => new Promise((resolve) => { finish = resolve }))
  const result = libraryRequest(captureLibraryOwner(), 'GET', '/creators/me/collections/')
  signIn(2); signIn(1)
  finish({ data: { results: [{ name: 'Old private set' }] } })
  await expect(result).rejects.toThrow(/account changed/i)
})

it('keeps a same-account token refresh compatible without replaying a mutation', async () => {
  const intent = captureLibraryOwner()
  useAuthStore.getState().setToken('refreshed')
  const request = vi.spyOn(axios, 'request').mockRejectedValue({ response: { status: 401 } })
  await expect(libraryRequest(intent, 'PATCH', '/creators/me/content/42/workspace/', {})).rejects.toMatchObject({ response: { status: 401 } })
  expect(request).toHaveBeenCalledTimes(1)
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }))
})
