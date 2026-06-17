import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const realApi = {
  trendingApi: {
    jokes: vi.fn(),
    tags: vi.fn(),
    risingTags: vi.fn(),
    jokesters: vi.fn(),
    themes: vi.fn(),
  },
  // other api objects stubbed minimally so the module imports cleanly
  jokesApi: {},
  dailyJokeApi: {},
  collectionsApi: {},
  savedJokesApi: {},
  favoritesApi: { list: vi.fn(), add: vi.fn(), remove: vi.fn(), stats: vi.fn() },
  preferencesApi: { get: vi.fn(), update: vi.fn() },
  creatorInsightsApi: { get: vi.fn() },
}
vi.mock('@/lib/api', () => realApi)

async function loadAdapterReal() {
  vi.resetModules()
  vi.stubEnv('VITE_API_URL', 'http://x/api/v1')
  vi.stubEnv('VITE_USE_MOCKS', 'false')
  return await import('@/lib/api-adapter')
}

async function loadAdapterMock() {
  vi.resetModules()
  vi.stubEnv('VITE_API_URL', '')
  vi.stubEnv('VITE_USE_MOCKS', 'true')
  return await import('@/lib/api-adapter')
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.unstubAllEnvs())

describe('trendingAdapter (real path)', () => {
  it('getJokes calls trendingApi.jokes and maps trending_since->trendingSince', async () => {
    realApi.trendingApi.jokes.mockResolvedValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [
          { rank: 1, joke: { id: 9 }, likes: 5, shares: 2, comments: 0, trending_since: '2026-06-01T00:00:00Z' },
        ],
      },
    })
    const { trendingAdapter } = await loadAdapterReal()
    const out = await trendingAdapter.getJokes('week')
    expect(realApi.trendingApi.jokes).toHaveBeenCalledWith('week')
    expect(out[0]).toMatchObject({ rank: 1, likes: 5, shares: 2, trendingSince: '2026-06-01T00:00:00Z' })
  })

  it('getTags maps growth_percent->growth from {results}', async () => {
    realApi.trendingApi.tags.mockResolvedValue({
      data: { results: [{ name: 'Dad', slug: 'dad', count: 3, growth_percent: 42 }] },
    })
    const { trendingAdapter } = await loadAdapterReal()
    const out = await trendingAdapter.getTags()
    expect(out[0]).toEqual({ name: 'Dad', count: 3, growth: 42 })
  })

  it('getRisingTopics maps {name, growth_percent}->{name, growth}', async () => {
    realApi.trendingApi.risingTags.mockResolvedValue({
      data: { results: [{ name: 'AI', slug: 'ai', growth_percent: 120 }] },
    })
    const { trendingAdapter } = await loadAdapterReal()
    expect(await trendingAdapter.getRisingTopics()).toEqual([{ name: 'AI', growth: 120 }])
  })

  it('getTopJokesters maps punchline_count->punchlineCount, avatar_url null->undefined', async () => {
    realApi.trendingApi.jokesters.mockResolvedValue({
      data: {
        results: [
          { id: 1, name: 'Jerry', username: '@j', avatar_url: null, punchline_count: 12, rank: 1, top_vibes: [] },
        ],
      },
    })
    const { trendingAdapter } = await loadAdapterReal()
    const out = await trendingAdapter.getTopJokesters(5)
    expect(realApi.trendingApi.jokesters).toHaveBeenCalledWith(5)
    expect(out[0]).toMatchObject({ id: 1, name: 'Jerry', punchlineCount: 12, rank: 1 })
    expect(out[0].avatarUrl).toBeUndefined()
  })

  it('getTopJokesters maps a real avatar_url string through to avatarUrl', async () => {
    realApi.trendingApi.jokesters.mockResolvedValue({
      data: {
        results: [
          { id: 2, name: 'Pun Queen', username: '@pq', avatar_url: 'https://cdn.example.com/pq.png', punchline_count: 7, rank: 2, top_vibes: [] },
        ],
      },
    })
    const { trendingAdapter } = await loadAdapterReal()
    const out = await trendingAdapter.getTopJokesters()
    expect(out[0].avatarUrl).toBe('https://cdn.example.com/pq.png')
  })

  it('getPopularThemes returns the results string array', async () => {
    realApi.trendingApi.themes.mockResolvedValue({ data: { results: ['Coding', 'Coffee'] } })
    const { trendingAdapter } = await loadAdapterReal()
    expect(await trendingAdapter.getPopularThemes()).toEqual(['Coding', 'Coffee'])
  })
})

describe('favoritesAdapter (real path)', () => {
  it('list maps favorited_at->favoritedAt and preserves pagination', async () => {
    realApi.favoritesApi.list.mockResolvedValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 7, joke: { id: 3 }, favorited_at: '2026-06-01T00:00:00Z' }],
      },
    })
    const { favoritesAdapter } = await loadAdapterReal()
    const out = await favoritesAdapter.list({ page: 1 })
    expect(realApi.favoritesApi.list).toHaveBeenCalledWith({ page: 1 })
    expect(out.results[0]).toMatchObject({ favoritedAt: '2026-06-01T00:00:00Z' })
  })

  it('stats maps total_count/top_tone/this_week_count -> camelCase', async () => {
    realApi.favoritesApi.stats.mockResolvedValue({
      data: { total_count: 9, top_tone: 'Dad', this_week_count: 2 },
    })
    const { favoritesAdapter } = await loadAdapterReal()
    expect(await favoritesAdapter.stats()).toEqual({ totalCount: 9, topTone: 'Dad', thisWeekCount: 2 })
  })

  it('add maps the created DTO to FavoriteJoke', async () => {
    realApi.favoritesApi.add.mockResolvedValue({
      data: { id: 5, joke: { id: 3 }, favorited_at: '2026-06-02T00:00:00Z' },
    })
    const { favoritesAdapter } = await loadAdapterReal()
    const out = await favoritesAdapter.add(3)
    expect(realApi.favoritesApi.add).toHaveBeenCalledWith(3)
    expect(out).toMatchObject({ favoritedAt: '2026-06-02T00:00:00Z' })
  })

  it('remove(jokeId) resolves favorite id from list then DELETEs that favorite id', async () => {
    realApi.favoritesApi.list.mockResolvedValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 42, joke: { id: 3 }, favorited_at: 'x' }],
      },
    })
    realApi.favoritesApi.remove.mockResolvedValue({})
    const { favoritesAdapter } = await loadAdapterReal()
    await favoritesAdapter.remove(3)
    expect(realApi.favoritesApi.remove).toHaveBeenCalledWith(42)
  })

  it('remove(jokeId) resolves without calling DELETE when jokeId is not in favorites list', async () => {
    realApi.favoritesApi.list.mockResolvedValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 99, joke: { id: 7 }, favorited_at: 'x' }],
      },
    })
    const { favoritesAdapter } = await loadAdapterReal()
    await expect(favoritesAdapter.remove(999)).resolves.toBeUndefined()
    expect(realApi.favoritesApi.remove).not.toHaveBeenCalled()
  })
})

describe('preferencesAdapter (real path via USE_MOCKS=false)', () => {
  it('get() calls preferencesApi.get and maps fromDTO when mocks are off', async () => {
    realApi.preferencesApi.get.mockResolvedValue({ data: { humor_types: ['dad'], theme: 'dark' } })
    const { preferencesAdapter } = await loadAdapterReal()
    const out = await preferencesAdapter.get()
    expect(realApi.preferencesApi.get).toHaveBeenCalled()
    expect(out.humorTypes).toEqual(['dad'])
    expect(out.theme).toBe('dark')
  })
})

describe('default mock path', () => {
  it('trendingAdapter.getTags does NOT call the real api when mocks on', async () => {
    const { trendingAdapter } = await loadAdapterMock()
    await trendingAdapter.getTags()
    expect(realApi.trendingApi.tags).not.toHaveBeenCalled()
  })

  it('favoritesAdapter.stats does NOT call the real api when mocks on', async () => {
    const { favoritesAdapter } = await loadAdapterMock()
    await favoritesAdapter.stats()
    expect(realApi.favoritesApi.stats).not.toHaveBeenCalled()
  })

  it('creatorInsightsAdapter.get does NOT call the real api when mocks on', async () => {
    const { creatorInsightsAdapter } = await loadAdapterMock()
    const result = await creatorInsightsAdapter.get('week')
    expect(realApi.creatorInsightsApi.get).not.toHaveBeenCalled()
    // Returns the mock fixture with the requested period
    expect(result.period).toBe('week')
    expect(result.is_creator).toBe(true)
    expect(result.overview.published_jokes).toBeGreaterThan(0)
    expect(result.overview.daily_reach_28d).toBeDefined()
  })
})

describe('creatorInsightsAdapter (real path)', () => {
  it('get() calls creatorInsightsApi.get with the period and returns data', async () => {
    realApi.creatorInsightsApi.get.mockResolvedValue({
      data: {
        period: 'month',
        is_creator: true,
        overview: {
          published_jokes: 5,
          reach: 1000,
          views: 4000,
          payoff_rate: 0.55,
          reactions: 500,
          favorites: 120,
          saves: 80,
          shares: 40,
          peak_read_hour: 20,
          daily_reach_28d: Array(28).fill(10),
        },
        reactions_breakdown: [],
        shares_breakdown: [],
        source_mix: [],
        top_jokes: [],
        audience: { top_themes: [], top_categories: [], top_formats: [] },
        suggestions: [],
      },
    })
    const { creatorInsightsAdapter } = await loadAdapterReal()
    const out = await creatorInsightsAdapter.get('month')
    expect(realApi.creatorInsightsApi.get).toHaveBeenCalledWith('month')
    expect(out.period).toBe('month')
    expect(out.overview.published_jokes).toBe(5)
  })
})
