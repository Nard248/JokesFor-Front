import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { mysteryBoxApi } from '@/lib/api'
import { mysteryBoxKeys, useRollMysteryBox } from './api'

describe('unlimited mystery rolls', () => {
  it('keeps an unlimited status after a successful roll instead of restoring a three-roll quota', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(mysteryBoxKeys.status(), {
      rolls_used_today: 9, rolls_remaining_today: null, max_per_day: null,
    })
    vi.spyOn(mysteryBoxApi, 'roll').mockResolvedValue({
      data: { joke: { id: 42 }, rolls_remaining_today: null, source_vibe: null },
    } as Awaited<ReturnType<typeof mysteryBoxApi.roll>>)
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result } = renderHook(() => useRollMysteryBox(), { wrapper })
    await act(async () => { await result.current.mutateAsync() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(mysteryBoxKeys.status())).toEqual({
      rolls_used_today: 10, rolls_remaining_today: null, max_per_day: null,
    })
    vi.restoreAllMocks()
  })
})
