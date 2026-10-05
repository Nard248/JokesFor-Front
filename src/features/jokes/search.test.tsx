import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jokesAdapter } from '@/lib/api-adapter'
import { useAuthStore } from '@/features/auth/store'
import { useDiscoveryStore } from '@/features/discovery/store'
import { EMPTY_SELECTION } from '@/features/discovery/selection'
import type { Joke, PaginatedResponse, User } from '@/lib/api'
import { useInfiniteJokeSearch } from './api'

vi.mock('@/lib/api-adapter', () => ({ jokesAdapter: { search: vi.fn() } }))

function page(id: number, next: string | null = null): PaginatedResponse<Joke> {
  return { count: next ? 2 : 1, next, previous: null, results: [{ id } as Joke] }
}
function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.getState().logout()
  useDiscoveryStore.getState().setSelection(EMPTY_SELECTION)
})

describe('infinite joke search', () => {
  it('keeps pages together and follows server pagination', async () => {
    vi.mocked(jokesAdapter.search).mockResolvedValueOnce(page(1, '?page=2')).mockResolvedValueOnce(page(2))
    const { result } = renderHook(() => useInfiniteJokeSearch({ q: 'coffee' }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages).toHaveLength(1)
    await act(async () => { await result.current.fetchNextPage() })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    expect(result.current.data?.pages.flatMap((p) => p.results.map((j) => j.id))).toEqual([1, 2])
    expect(jokesAdapter.search).toHaveBeenLastCalledWith({ q: 'coffee', page: 2 }, expect.any(AbortSignal))
    expect(result.current.hasNextPage).toBe(false)
  })

  it('cancels a previous page and never mixes it into a changed search', async () => {
    let resolveOld!: (value: PaginatedResponse<Joke>) => void
    let oldSignal: AbortSignal | undefined
    vi.mocked(jokesAdapter.search).mockImplementation((params, signal) => {
      if (params.q === 'coffee' && params.page === 2) {
        oldSignal = signal
        return new Promise((resolve) => { resolveOld = resolve })
      }
      return Promise.resolve(params.q === 'coffee' ? page(1, '?page=2') : page(9))
    })
    const { result, rerender } = renderHook(({ q }) => useInfiniteJokeSearch({ q }), {
      wrapper: wrapper(), initialProps: { q: 'coffee' },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    act(() => { void result.current.fetchNextPage() })
    await waitFor(() => expect(oldSignal).toBeDefined())
    rerender({ q: 'cats' })
    await waitFor(() => expect(result.current.data?.pages[0].results[0].id).toBe(9))
    expect(oldSignal?.aborted).toBe(true)
    await act(async () => { resolveOld(page(2)) })
    expect(result.current.data?.pages.flatMap((p) => p.results.map((j) => j.id))).toEqual([9])
  })

  it('does not reuse another account’s cached search pages', async () => {
    vi.mocked(jokesAdapter.search).mockResolvedValueOnce(page(1)).mockResolvedValueOnce(page(2)).mockResolvedValueOnce(page(3))
    const { result } = renderHook(() => useInfiniteJokeSearch({ q: 'coffee' }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.pages[0].results[0].id).toBe(1))
    act(() => useAuthStore.getState().setAuth({ pk: 42, username: 'reader' } as User, 'test-token'))
    await waitFor(() => expect(result.current.data?.pages[0].results[0].id).toBe(2))
    act(() => useAuthStore.getState().logout())
    await waitFor(() => expect(result.current.data?.pages[0].results[0].id).toBe(3))
  })

  it('starts a fresh search when eligibility or the language selection changes', async () => {
    const user = { pk: 42, username: 'reader', date_of_birth: '2015-01-01' } as User
    useAuthStore.getState().setAuth(user, 'test-token')
    vi.mocked(jokesAdapter.search).mockResolvedValueOnce(page(1)).mockResolvedValueOnce(page(2)).mockResolvedValueOnce(page(3))
    const { result } = renderHook(() => useInfiniteJokeSearch({ q: 'coffee' }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.pages[0].results[0].id).toBe(1))
    act(() => useAuthStore.getState().setUser({ ...user, date_of_birth: '1990-01-01' }))
    await waitFor(() => expect(result.current.data?.pages[0].results[0].id).toBe(2))
    act(() => useDiscoveryStore.getState().setSelection({ ...EMPTY_SELECTION, language: 'hy', country: 'AM' }))
    await waitFor(() => expect(result.current.data?.pages[0].results[0].id).toBe(3))
    expect(jokesAdapter.search).toHaveBeenLastCalledWith({ q: 'coffee', language: 'hy', country: 'AM', page: 1 }, expect.any(AbortSignal))
  })

  it('does not retry invalid searches', async () => {
    vi.mocked(jokesAdapter.search).mockRejectedValue({ response: { status: 400, data: { q: ['Use fewer words.'] } } })
    const { result } = renderHook(() => useInfiniteJokeSearch({ q: 'a'.repeat(201) }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(jokesAdapter.search).toHaveBeenCalledTimes(1)
  })
})
