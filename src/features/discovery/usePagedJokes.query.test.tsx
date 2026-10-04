import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { Joke, JokeSearchParams, PaginatedResponse } from '@/lib/api'

// Real useJokeSearch + real TanStack Query; only the transport is stubbed.
const search = vi.fn<(params: JokeSearchParams) => Promise<PaginatedResponse<Joke>>>()
vi.mock('@/lib/api-adapter', () => ({ jokesAdapter: { search: (params: JokeSearchParams) => search(params) } }))
import { usePagedJokes } from './usePagedJokes'

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('usePagedJokes with the real query layer', () => {
  it('keeps page one and its count on screen while page two is in flight', async () => {
    let resolvePageTwo: (value: PaginatedResponse<Joke>) => void = () => {}
    search.mockImplementation((params) => params.page === 2
      ? new Promise((resolve) => { resolvePageTwo = resolve })
      : Promise.resolve({ count: 3, next: 'x', previous: null, results: [{ id: 1 }, { id: 2 }] as Joke[] }))
    const { result } = renderHook(() => usePagedJokes({ language: 'es' }), { wrapper })
    await waitFor(() => expect(result.current.jokes).toHaveLength(2))

    act(() => result.current.loadMore())
    await waitFor(() => expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 2 })))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(true)
    expect(result.current.data?.count).toBe(3)
    expect(result.current.jokes.map((joke) => joke.id)).toEqual([1, 2])

    act(() => resolvePageTwo({ count: 3, next: null, previous: 'x', results: [{ id: 3 }] as Joke[] }))
    await waitFor(() => expect(result.current.jokes.map((joke) => joke.id)).toEqual([1, 2, 3]))
    expect(result.current.isFetching).toBe(false)
  })
})
