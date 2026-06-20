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
  followsApi: { follow: vi.fn(), unfollow: vi.fn(), status: vi.fn() },
  creatorProfileApi: { get: vi.fn() },
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
          followers: 42,
          follower_growth_28d: Array(28).fill(0).map((_: unknown, i: number) => i),
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

describe('followsAdapter mock path', () => {
  it('routes to mock and follow toggles is_following', async () => {
    const { followsAdapter } = await loadAdapterMock()
    // Initially not following
    const statusBefore = await followsAdapter.status(99)
    expect(statusBefore.is_following).toBe(false)
    // Follow
    const followed = await followsAdapter.follow(99)
    expect(followed.is_following).toBe(true)
    // Status should now be true
    const statusAfter = await followsAdapter.status(99)
    expect(statusAfter.is_following).toBe(true)
    // Unfollow
    await followsAdapter.unfollow(99)
    const statusFinal = await followsAdapter.status(99)
    expect(statusFinal.is_following).toBe(false)
    // Ensure real API not called
    expect(realApi.followsApi.follow).not.toHaveBeenCalled()
    expect(realApi.followsApi.status).not.toHaveBeenCalled()
  })
})

describe('creatorProfileAdapter mock path', () => {
  it('routes to mock and returns correct shape', async () => {
    const { creatorProfileAdapter } = await loadAdapterMock()
    const profile = await creatorProfileAdapter.get(7)
    expect(profile.id).toBe(7)
    expect(typeof profile.display_name).toBe('string')
    expect(typeof profile.handle).toBe('string')
    expect(typeof profile.follower_count).toBe('number')
    expect(Array.isArray(profile.jokes)).toBe(true)
    expect(realApi.creatorProfileApi.get).not.toHaveBeenCalled()
  })
})

describe('followsAdapter real path', () => {
  it('status() calls followsApi.status and returns data', async () => {
    realApi.followsApi.status.mockResolvedValue({ data: { is_following: true, follower_count: 5 } })
    const { followsAdapter } = await loadAdapterReal()
    const out = await followsAdapter.status(42)
    expect(realApi.followsApi.status).toHaveBeenCalledWith(42)
    expect(out.is_following).toBe(true)
    expect(out.follower_count).toBe(5)
  })

  it('follow() calls followsApi.follow and returns data', async () => {
    realApi.followsApi.follow.mockResolvedValue({ data: { is_following: true, follower_count: 6 } })
    const { followsAdapter } = await loadAdapterReal()
    const out = await followsAdapter.follow(42)
    expect(realApi.followsApi.follow).toHaveBeenCalledWith(42)
    expect(out.is_following).toBe(true)
  })

  it('unfollow() calls followsApi.unfollow and resolves void', async () => {
    realApi.followsApi.unfollow.mockResolvedValue({})
    const { followsAdapter } = await loadAdapterReal()
    await expect(followsAdapter.unfollow(42)).resolves.toBeUndefined()
    expect(realApi.followsApi.unfollow).toHaveBeenCalledWith(42)
  })
})

describe('creatorProfileAdapter real path', () => {
  it('get() calls creatorProfileApi.get and returns data', async () => {
    realApi.creatorProfileApi.get.mockResolvedValue({
      data: {
        id: 7,
        display_name: 'user_7',
        handle: '@user7',
        avatar_url: null,
        published_jokes: 14,
        follower_count: 42,
        is_following: false,
        jokes: [],
        jokes_pagination: { count: 14, next: null, previous: null },
      },
    })
    const { creatorProfileAdapter } = await loadAdapterReal()
    const out = await creatorProfileAdapter.get(7)
    expect(realApi.creatorProfileApi.get).toHaveBeenCalledWith(7)
    expect(out.id).toBe(7)
    expect(out.display_name).toBe('user_7')
  })

  it('get() normalizes lean JokeListSerializer jokes (string tones/format/age_rating) into objects', async () => {
    realApi.creatorProfileApi.get.mockResolvedValue({
      data: {
        id: 7,
        display_name: 'Funny Jane',
        handle: '@janedoe',
        avatar_url: null,
        published_jokes: 1,
        follower_count: 3,
        is_following: false,
        jokes: [
          {
            id: 1,
            text: 'Why did the...',
            format: 'knock-knock',
            age_rating: 'pg',
            tones: ['witty', 'dry'],
            categories: ['witty', 'dry'],
          },
        ],
        jokes_pagination: { count: 1, next: null, previous: null },
      },
    })
    const { creatorProfileAdapter } = await loadAdapterReal()
    const out = await creatorProfileAdapter.get(7)
    const joke = out.jokes[0]
    // tones became objects JokeCard can render (tone.id / tone.slug / tone.name)
    expect(joke.tones).toEqual([
      { id: -1, name: 'Witty', slug: 'witty' },
      { id: -2, name: 'Dry', slug: 'dry' },
    ])
    expect(joke.format).toEqual({ id: 0, name: 'Knock Knock', slug: 'knock-knock' })
    expect(joke.age_rating).toMatchObject({ slug: 'pg', name: 'Pg' })
    expect(joke.categories).toEqual(joke.tones)
  })

  it('normalizeProfileJoke passes already-nested objects through unchanged', async () => {
    const { normalizeProfileJoke } = await loadAdapterReal()
    const nested = {
      id: 2,
      text: 't',
      format: { id: 5, name: 'One Liner', slug: 'one-liner' },
      age_rating: { id: 1, name: 'PG', slug: 'pg', min_age: 0 },
      tones: [{ id: 9, name: 'Dad', slug: 'dad' }],
      categories: [{ id: 9, name: 'Dad', slug: 'dad' }],
    } as unknown as Parameters<typeof normalizeProfileJoke>[0]
    const out = normalizeProfileJoke(nested)
    expect(out.tones).toEqual([{ id: 9, name: 'Dad', slug: 'dad' }])
    expect(out.format).toEqual({ id: 5, name: 'One Liner', slug: 'one-liner' })
  })
})
