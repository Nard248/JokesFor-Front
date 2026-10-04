import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/store'

const entitlements = vi.fn()
vi.mock('@/lib/api-adapter', () => ({ billingAdapter: { entitlements: () => entitlements() } }))

import { useCreatorPlan } from './useCreatorPlan'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
)

beforeEach(() => {
  entitlements.mockReset()
  useAuthStore.getState().setAuth({ pk: 7, username: 'creator', email: '', first_name: '', last_name: '' }, 'token')
})
afterEach(() => { useAuthStore.getState().logout() })

it('reports Creator Pro from the entitlement feature keys', async () => {
  entitlements.mockResolvedValue({
    plan: 'creator_pro',
    features: { creator_analytics: true, creator_content_explorer: true, creator_exports: true, creator_community_insights: true },
    limits: {},
  })
  const { result } = renderHook(() => useCreatorPlan(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.isPro).toBe(true)
  expect(result.current.features.creator_community_insights).toBe(true)
})

it('treats missing or false creator keys as the Free plan', async () => {
  entitlements.mockResolvedValue({ plan: 'free', features: { creator_analytics: true }, limits: {} })
  const { result } = renderHook(() => useCreatorPlan(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.isPro).toBe(false)
  expect(result.current.features).toEqual({ creator_content_explorer: false, creator_exports: false, creator_community_insights: false })
})

it('does not fetch entitlements for a signed-out visitor', () => {
  useAuthStore.getState().logout()
  const { result } = renderHook(() => useCreatorPlan(), { wrapper })
  expect(entitlements).not.toHaveBeenCalled()
  expect(result.current.isPro).toBe(false)
})
