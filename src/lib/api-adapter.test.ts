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
  profileApi: { get: vi.fn(), update: vi.fn(), activity: vi.fn(), achievements: vi.fn() },
  moderationApi: { report: vi.fn(), block: vi.fn(), unblock: vi.fn(), myBlocks: vi.fn() },
  notificationsApi: { list: vi.fn(), unreadCount: vi.fn(), markRead: vi.fn() },
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

describe('profileAdapter (real path)', () => {
  it('get() maps the real backend profile (snake_case + stats) into the camelCase UI shape', async () => {
    realApi.profileApi.get.mockResolvedValue({
      data: {
        name: 'Pun Queen',
        username: '@punqueen',
        display_name: 'Pun Queen',
        handle: 'punqueen',
        email: 'pq@example.com',
        bio: 'Certified groan-maker.',
        avatar_url: 'https://cdn.example.com/pq.png',
        member_since: '2026-01-15',
        is_premium: true,
        stats: { jokes_saved: 9, jokes_shared: 4, collections: 2, days_active: 30 },
        humor_dna: [{ type: 'Witty', percentage: 60 }],
      },
    })
    const { profileAdapter } = await loadAdapterReal()
    const out = await profileAdapter.get()
    expect(realApi.profileApi.get).toHaveBeenCalled()
    expect(out).toMatchObject({
      name: 'Pun Queen',
      username: '@punqueen',
      bio: 'Certified groan-maker.',
      memberSince: '2026-01-15',
      isPremium: true,
      avatarUrl: 'https://cdn.example.com/pq.png',
      stats: { jokesSaved: 9, jokesShared: 4, collections: 2, daysActive: 30 },
    })
  })

  it('get() defaults missing avatar/stats to null/0 (no fabricated numbers)', async () => {
    realApi.profileApi.get.mockResolvedValue({
      data: { name: 'user_5', username: '@user5', avatar_url: null },
    })
    const { profileAdapter } = await loadAdapterReal()
    const out = await profileAdapter.get()
    expect(out.avatarUrl).toBeNull()
    expect(out.stats).toEqual({ jokesSaved: 0, jokesShared: 0, collections: 0, daysActive: 0 })
  })

  it('getActivity() unwraps results and derives icon + timeAgo from the real rows', async () => {
    realApi.profileApi.activity.mockResolvedValue({
      data: {
        results: [
          { id: 'save_3', type: 'save', description: "Saved '...'", created_at: new Date().toISOString() },
          { id: 'rating_7', type: 'like', description: "Liked '...'", created_at: new Date().toISOString() },
        ],
      },
    })
    const { profileAdapter } = await loadAdapterReal()
    const out = await profileAdapter.getActivity(8)
    expect(realApi.profileApi.activity).toHaveBeenCalledWith(8)
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ id: 'save_3', type: 'save', icon: '🔖' })
    expect(out[1].icon).toBe('❤️')
    expect(out[0].timeAgo).toBeTruthy()
  })

  it('getAchievements() maps unlocked_at -> unlockedAt and falls back icon null -> 🏆', async () => {
    realApi.profileApi.achievements.mockResolvedValue({
      data: {
        results: [
          { id: 'first_save', title: 'First Save', description: 'Saved one', icon: '🔖', unlocked: true, unlocked_at: '2026-02-01T00:00:00Z' },
          { id: 'streak_7', title: '7-Day Streak', description: 'A week', icon: null, unlocked: false, unlocked_at: null },
        ],
      },
    })
    const { profileAdapter } = await loadAdapterReal()
    const out = await profileAdapter.getAchievements()
    expect(out[0]).toMatchObject({ id: 'first_save', unlocked: true, unlockedAt: '2026-02-01T00:00:00Z' })
    expect(out[1]).toMatchObject({ id: 'streak_7', unlocked: false, icon: '🏆' })
    expect(out[1].unlockedAt).toBeUndefined()
  })
})

describe('profileAdapter (mock path)', () => {
  it('get/getActivity/getAchievements do NOT hit the real api when mocks are on', async () => {
    const { profileAdapter } = await loadAdapterMock()
    const profile = await profileAdapter.get()
    await profileAdapter.getActivity(5)
    await profileAdapter.getAchievements()
    expect(realApi.profileApi.get).not.toHaveBeenCalled()
    expect(realApi.profileApi.activity).not.toHaveBeenCalled()
    expect(realApi.profileApi.achievements).not.toHaveBeenCalled()
    // Mock profile is still shaped for the UI (with the added avatarUrl field).
    expect(profile).toHaveProperty('avatarUrl')
    expect(typeof profile.name).toBe('string')
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

describe('notificationsAdapter', () => {
  it('list (real) unwraps paginated results', async () => {
    realApi.notificationsApi.list.mockResolvedValue({
      data: {
        count: 1, next: null, previous: null,
        results: [{ id: 1, verb: 'followed_you', read: false, created_at: 'x', actor: { id: 7, name: 'Q', username: '@q' }, joke: null }],
      },
    })
    const { notificationsAdapter } = await loadAdapterReal()
    const out = await notificationsAdapter.list()
    expect(out).toHaveLength(1)
    expect(out[0].verb).toBe('followed_you')
  })

  it('unreadCount (real) returns the count', async () => {
    realApi.notificationsApi.unreadCount.mockResolvedValue({ data: { count: 3 } })
    const { notificationsAdapter } = await loadAdapterReal()
    expect(await notificationsAdapter.unreadCount()).toBe(3)
  })

  it('markAllRead (real) calls the endpoint', async () => {
    realApi.notificationsApi.markRead.mockResolvedValue({ data: { marked: 3 } })
    const { notificationsAdapter } = await loadAdapterReal()
    await notificationsAdapter.markAllRead()
    expect(realApi.notificationsApi.markRead).toHaveBeenCalled()
  })

  it('mock path: markAllRead clears unread without hitting the api', async () => {
    const { notificationsAdapter } = await loadAdapterMock()
    expect(await notificationsAdapter.unreadCount()).toBeGreaterThan(0)
    await notificationsAdapter.markAllRead()
    expect(await notificationsAdapter.unreadCount()).toBe(0)
    expect(realApi.notificationsApi.markRead).not.toHaveBeenCalled()
  })
})

describe('moderationAdapter', () => {
  it('report (real) POSTs the payload and resolves void', async () => {
    realApi.moderationApi.report.mockResolvedValue({})
    const { moderationAdapter } = await loadAdapterReal()
    await expect(moderationAdapter.report({ joke: 5, reason: 'spam' })).resolves.toBeUndefined()
    expect(realApi.moderationApi.report).toHaveBeenCalledWith({ joke: 5, reason: 'spam' })
  })

  it('block/unblock (real) call the api with the user id', async () => {
    realApi.moderationApi.block.mockResolvedValue({})
    realApi.moderationApi.unblock.mockResolvedValue({})
    const { moderationAdapter } = await loadAdapterReal()
    await moderationAdapter.block({ id: 9, name: 'X', username: '@x' })
    expect(realApi.moderationApi.block).toHaveBeenCalledWith(9)
    await moderationAdapter.unblock(9)
    expect(realApi.moderationApi.unblock).toHaveBeenCalledWith(9)
  })

  it('myBlocks (real) unwraps results', async () => {
    realApi.moderationApi.myBlocks.mockResolvedValue({ data: { results: [{ id: 9, name: 'X', username: '@x' }] } })
    const { moderationAdapter } = await loadAdapterReal()
    expect(await moderationAdapter.myBlocks()).toEqual([{ id: 9, name: 'X', username: '@x' }])
  })

  it('mock path round-trips block/unblock without hitting the real api', async () => {
    const { moderationAdapter } = await loadAdapterMock()
    await moderationAdapter.block({ id: 1, name: 'A', username: '@a' })
    expect(await moderationAdapter.myBlocks()).toEqual([{ id: 1, name: 'A', username: '@a' }])
    await moderationAdapter.unblock(1)
    expect(await moderationAdapter.myBlocks()).toEqual([])
    expect(realApi.moderationApi.block).not.toHaveBeenCalled()
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

  it('accountIdentityAdapter.update (real) PATCHes display_name/handle and maps the response', async () => {
    realApi.profileApi.update.mockResolvedValue({
      data: { display_name: 'Pun Queen', handle: 'punqueen', name: 'Pun Queen', username: '@punqueen' },
    })
    const { accountIdentityAdapter } = await loadAdapterReal()
    const out = await accountIdentityAdapter.update({ display_name: 'Pun Queen', handle: 'punqueen' })
    expect(realApi.profileApi.update).toHaveBeenCalledWith({ display_name: 'Pun Queen', handle: 'punqueen' })
    expect(out).toEqual({ display_name: 'Pun Queen', handle: 'punqueen', name: 'Pun Queen', username: '@punqueen' })
  })

  it('accountIdentityAdapter.get (real) maps the profile DTO to PublicIdentity', async () => {
    realApi.profileApi.get.mockResolvedValue({
      data: { display_name: 'user_5', handle: null, name: 'user_5', username: '@user5' },
    })
    const { accountIdentityAdapter } = await loadAdapterReal()
    const out = await accountIdentityAdapter.get()
    expect(out).toEqual({ display_name: 'user_5', handle: null, name: 'user_5', username: '@user5' })
  })

  it('accountIdentityAdapter.update (mock) round-trips without hitting the real api', async () => {
    const { accountIdentityAdapter } = await loadAdapterMock()
    const out = await accountIdentityAdapter.update({ display_name: 'Demo', handle: 'demo' })
    expect(realApi.profileApi.update).not.toHaveBeenCalled()
    expect(out.name).toBe('Demo')
    expect(out.username).toBe('@demo')
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
