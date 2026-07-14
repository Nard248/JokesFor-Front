import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { DailyReadsStatus } from '@/lib/api'

// Controllable GET /jokes/daily-reads/. Partial mock keeps the rest of the API.
const getMock = vi.fn<() => Promise<{ data: DailyReadsStatus }>>()
vi.mock('@/lib/api', async (orig) => ({
  ...(await orig<typeof import('@/lib/api')>()),
  dailyReadsApi: { get: () => getMock() },
}))

import { useDailyReads } from './api'
import { __resetDailyReadsStore } from './store'

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  __resetDailyReadsStore()
  vi.clearAllMocks()
  // Force real-API mode so the hook actually calls dailyReadsApi.get.
  vi.stubEnv('VITE_API_URL', 'http://test.local/api/v1')
  vi.stubEnv('VITE_USE_MOCKS', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('useDailyReads — graceful degradation', () => {
  it('treats a 404 / error as NO CAP (paywall inactive)', async () => {
    getMock.mockRejectedValue({ response: { status: 404 } })
    const { result } = renderHook(() => useDailyReads(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.active).toBe(false))
    expect(result.current.over).toBe(false)
    expect(result.current.remaining).toBeNull()
    expect(result.current.canReveal(999)).toBe(true)
  })

  it('treats a paid/unlimited response (limit: null) as no cap', async () => {
    getMock.mockResolvedValue({
      data: { limit: null, used: null, remaining: null, over: false, reset_at: '2026-07-15T00:00:00Z' },
    })
    const { result } = renderHook(() => useDailyReads(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.resetAt).toBe('2026-07-15T00:00:00Z'))
    expect(result.current.active).toBe(false)
    expect(result.current.over).toBe(false)
    expect(result.current.canReveal(1)).toBe(true)
  })
})

describe('useDailyReads — active free cap', () => {
  it('exposes remaining and allows reveals while under the cap', async () => {
    getMock.mockResolvedValue({
      data: { limit: 10, used: 3, remaining: 7, over: false, reset_at: '2026-07-15T00:00:00Z' },
    })
    const { result } = renderHook(() => useDailyReads(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.active).toBe(true))
    expect(result.current.remaining).toBe(7)
    expect(result.current.over).toBe(false)
    expect(result.current.canReveal(1)).toBe(true)
  })

  it('optimistically decrements on reveal and blocks fresh reveals once over', async () => {
    getMock.mockResolvedValue({
      data: { limit: 10, used: 9, remaining: 1, over: false, reset_at: '2026-07-15T00:00:00Z' },
    })
    const { result } = renderHook(() => useDailyReads(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.remaining).toBe(1))

    act(() => result.current.registerReveal(5))

    expect(result.current.remaining).toBe(0)
    expect(result.current.over).toBe(true)
    // The just-revealed joke stays open; a fresh one is blocked.
    expect(result.current.hasRevealed(5)).toBe(true)
    expect(result.current.canReveal(5)).toBe(true)
    expect(result.current.canReveal(6)).toBe(false)
  })
})
