import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Joke, JokeSearchParams } from '@/lib/api'

const search = vi.fn()
vi.mock('@/features/jokes', () => ({ useJokeSearch: (params: JokeSearchParams) => search(params) }))
import { usePagedJokes } from './usePagedJokes'

describe('discovery pagination isolation', () => {
  it('drops earlier-language pages immediately and restarts at page one', async () => {
    const spanishFirst = { data: { count: 3, results: [{ id: 1 }, { id: 2 }] as Joke[] } }
    const spanishSecond = { data: { count: 3, results: [{ id: 3 }] as Joke[] } }
    const french = { data: { count: 1, results: [{ id: 4 }] as Joke[] } }
    const loading = { data: undefined, isLoading: true }
    let frenchReady = false
    search.mockImplementation((params: JokeSearchParams) => params.language === 'fr' ? frenchReady ? french : loading : params.page === 2 ? spanishSecond : spanishFirst)
    const { result, rerender } = renderHook(({ language }) => usePagedJokes({ language }), { initialProps: { language: 'es' } })
    await waitFor(() => expect(result.current.jokes.map((joke) => joke.id)).toEqual([1, 2]))
    act(() => result.current.loadMore())
    await waitFor(() => expect(result.current.jokes.map((joke) => joke.id)).toEqual([1, 2, 3]))
    rerender({ language: 'fr' })
    expect(result.current.page).toBe(1)
    expect(result.current.jokes).toEqual([])
    frenchReady = true
    rerender({ language: 'fr' })
    await waitFor(() => expect(result.current.jokes.map((joke) => joke.id)).toEqual([4]))
    rerender({ language: 'es' })
    expect(result.current.page).toBe(1)
    await waitFor(() => expect(result.current.jokes.map((joke) => joke.id)).toEqual([1, 2]))
  })
})
