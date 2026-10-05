import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./axios', () => ({ api: { get: vi.fn() } }))

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

describe('joke search transport', () => {
  it('carries the cancellation signal and filters through the adapter into Axios', async () => {
    vi.stubEnv('VITE_API_URL', 'https://example.test/api/v1')
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    const { api } = await import('./axios')
    const { jokesAdapter } = await import('./api-adapter')
    const controller = new AbortController()
    const params = { q: 'coffee', categories: 'dad', page: 2 }
    const response = { count: 0, next: null, previous: null, results: [] }
    vi.mocked(api.get).mockResolvedValueOnce({ data: response })
    expect(await jokesAdapter.search(params, controller.signal)).toEqual(response)
    expect(api.get).toHaveBeenCalledWith('/jokes/', { params, signal: controller.signal })
  })
})
