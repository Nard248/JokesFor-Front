import { act, renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/features/auth/store'
import { useCreatorInsights } from './api'
const get = vi.fn()
vi.mock('@/lib/api-adapter', () => ({ creatorInsightsAdapter: { get: (period: string) => get(period) } }))
const signIn = (pk: number) => useAuthStore.getState().setAuth({ pk, username: '', email: '', first_name: '', last_name: '' }, `token-${pk}`)
beforeEach(() => { get.mockReset(); useAuthStore.getState().logout() })
afterEach(() => { cleanup(); useAuthStore.getState().logout() })
it('never displays one creator cached insights for another signed-in account', async () => {
  get.mockResolvedValueOnce({ ownerLabel: 'Creator A private insights' }).mockImplementationOnce(() => new Promise(() => {}))
  signIn(1)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  const { result } = renderHook(() => useCreatorInsights('month'), { wrapper })
  await waitFor(() => expect(result.current.data).toEqual({ ownerLabel: 'Creator A private insights' }))
  act(() => signIn(2))
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
  expect(result.current.data).toBeUndefined()
})
