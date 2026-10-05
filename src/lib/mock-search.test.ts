import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockJokesApi } from './mock-api'
import { mockJokes } from './mock-data'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })
async function search(params: Parameters<typeof mockJokesApi.search>[0]) {
  const response = mockJokesApi.search(params)
  await vi.runAllTimersAsync()
  return response
}

describe('mock joke search', () => {
  it('returns no unrelated filler for an absent query', async () => {
    expect((await search({ q: 'unfindablexyzzy' })).results).toEqual([])
  })
  it('finds category and theme labels, including terms across fields', async () => {
    const joke = mockJokes.find((item) => item.tones.length && item.context_tags.length)!
    const result = await search({ q: `${joke.tones[0].name} ${joke.context_tags[0].name}`, page_size: 100 })
    expect(result.results.map((item) => item.id)).toContain(joke.id)
  })
  it('honors comma-separated aliases, formats and page size', async () => {
    const joke = mockJokes.find((item) => item.tones.length)!
    const params = { categories: `${joke.tones[0].slug},not-a-category`, joke_format: joke.format.slug, page_size: 1 }
    const result = await search(params)
    expect(result.results).toHaveLength(1)
    expect(result.results[0].format.slug).toBe(joke.format.slug)
    expect(result.results[0].tones.some((tone) => tone.slug === joke.tones[0].slug)).toBe(true)
    if (result.next) {
      const next = await search({ ...params, page: 2 })
      expect(next.results[0].id).not.toBe(result.results[0].id)
    }
  })
  it('aborts superseded requests instead of waiting out the mock delay', async () => {
    const controller = new AbortController()
    const response = mockJokesApi.search({ q: 'coffee' }, controller.signal)
    const rejection = expect(response).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await rejection
    expect(vi.getTimerCount()).toBe(0)
  })
})
