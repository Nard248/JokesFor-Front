import axios from 'axios'
import { useSyncExternalStore } from 'react'
import { useAuthStore } from '@/features/auth/store'
import { api } from '@/lib/axios'

const ownerNow = () => {
  const auth = useAuthStore.getState()
  return auth.isAuthenticated ? auth.user?.pk : undefined
}

let identity = { owner: ownerNow(), revision: 0 }
const listeners = new Set<() => void>()
useAuthStore.subscribe(() => {
  const owner = ownerNow()
  if (owner !== identity.owner) {
    identity = { owner, revision: identity.revision + 1 }
    listeners.forEach((listener) => listener())
  }
})
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
const getIdentity = () => identity

export interface AccountIntent {
  owner: number | undefined
  revision: number
  token: string | null
}

export function useAccountIdentity() {
  return useSyncExternalStore(subscribe, getIdentity, getIdentity)
}

export function captureAccountIntent(): AccountIntent {
  return { ...identity, token: useAuthStore.getState().accessToken }
}

export function isAccountIntentCurrent(intent: AccountIntent) {
  return intent.owner !== undefined && intent.owner === identity.owner && intent.revision === identity.revision
}

export function assertAccountIntent(intent: AccountIntent) {
  if (!isAccountIntentCurrent(intent)) throw new Error('Your account changed. Please retry this action.')
}

/** A private account request never enters the shared refresh/CSRF retry queue. */
export async function accountRequest<T>(
  intent: AccountIntent, method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string, data?: unknown, signal?: AbortSignal,
): Promise<T> {
  assertAccountIntent(intent)
  if (!intent.token) throw new Error('Please sign in again to update your account.')
  try {
    const response = await axios.request<T>({
      baseURL: api.defaults.baseURL, method, url, data, signal, timeout: 15000,
      withCredentials: false, headers: { Authorization: `Bearer ${intent.token}` },
    })
    assertAccountIntent(intent)
    return response.data
  } catch (error) {
    assertAccountIntent(intent)
    throw error
  }
}
