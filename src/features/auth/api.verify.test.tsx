import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import { vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({
  authApi: {
    verifyEmail: vi.fn(),
    refreshToken: vi.fn(),
    getUser: vi.fn(),
    register: vi.fn(),
  },
}))

import { authApi } from '@/lib/api'
import { useVerifyEmail } from './api'
import { useAuthStore } from './store'

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

test('verify success establishes auth via refresh token + setAuth', async () => {
  const user = { pk: 12, username: 'a', email: 'a@b.com', first_name: '', last_name: '' }
  ;(authApi.verifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { user } })
  ;(authApi.refreshToken as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { access: 'tok123' } })

  const { result } = renderHook(() => useVerifyEmail(), { wrapper })
  result.current.mutate({ email: 'a@b.com', code: '135790' })

  await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
  expect(useAuthStore.getState().accessToken).toBe('tok123')
  expect(useAuthStore.getState().user?.email).toBe('a@b.com')
})

test('verify still establishes auth when the refresh hiccups (verified, lazy token)', async () => {
  const user = { pk: 12, username: 'a', email: 'a@b.com', first_name: '', last_name: '' }
  ;(authApi.verifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { user } })
  ;(authApi.refreshToken as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('refresh failed'))

  const { result } = renderHook(() => useVerifyEmail(), { wrapper })
  result.current.mutate({ email: 'a@b.com', code: '135790' })

  // Verified user is authenticated even though the token refresh failed;
  // the in-memory token stays empty and the axios interceptor acquires it lazily.
  await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
  expect(useAuthStore.getState().user?.email).toBe('a@b.com')
  expect(useAuthStore.getState().accessToken).toBe('')
})
