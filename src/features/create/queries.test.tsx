import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useFormats, useDrafts } from './queries'
import { resetMockStore } from './mock'
import { beforeEach } from 'vitest'
import { useAuthStore } from '@/features/auth/store'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return Wrapper
}

beforeEach(() => {
  resetMockStore()
})

test('useFormats eventually returns 9 formats', async () => {
  const { result } = renderHook(() => useFormats(), { wrapper: makeWrapper() })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toHaveLength(9)
})

// useDrafts is gated on authentication (an anonymous visitor must not fire
// authenticated-only requests), so sign in for these hook tests.
beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: true })
})

test('useDrafts eventually returns an array of ContentDraft', async () => {
  const { result } = renderHook(() => useDrafts(), { wrapper: makeWrapper() })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(Array.isArray(result.current.data)).toBe(true)
  expect((result.current.data ?? []).length).toBeGreaterThan(0)
  const first = result.current.data![0]
  expect(first).toHaveProperty('themes')
  expect(first).toHaveProperty('categories')
  expect(first).toHaveProperty('lastEditedAt')
})
