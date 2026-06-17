import type { Joke, JokeSearchParams, PaginatedResponse, Collection, SavedJoke, CreatorInsights, InsightsPeriod } from './api'
import {
  mockJokes,
  mockDailyJoke,
  mockDailyJokeHistory,
  mockCollections,
  mockSavedJokes,
  mockUser,
  mockTrendingJokes,
  mockTrendingTagsWithStats,
  mockRisingTopics,
  mockTopJokesters,
  mockPopularThemes,
  mockFavorites,
  mockDrafts,
  mockUserProfile,
  mockActivity,
  mockAchievements,
  mockPreferences,
  mockCreatorInsights,
  paginateMock,
} from './mock-data'
import type {
  TrendingJoke,
  TrendingTag,
  TopJokester,
  FavoriteJoke,
  DraftJoke,
  UserProfile,
  ActivityItem,
  Achievement,
  UserPreferences,
} from './mock-data'

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 400))
}

export const mockJokesApi = {
  search: async (params: JokeSearchParams): Promise<PaginatedResponse<Joke>> => {
    await delay()
    let filtered = [...mockJokes]

    if (params.q) {
      const q = params.q.toLowerCase()
      filtered = filtered.filter(
        (j) =>
          j.text.toLowerCase().includes(q) ||
          j.setup?.toLowerCase().includes(q) ||
          j.punchline?.toLowerCase().includes(q) ||
          j.tones.some((t) => t.name.toLowerCase().includes(q)) ||
          j.context_tags.some((t) => t.name.toLowerCase().includes(q))
      )
      // If text search returns too few results, pad with all jokes
      if (filtered.length < 3) {
        const filteredIds = new Set(filtered.map((j) => j.id))
        const remaining = mockJokes.filter((j) => !filteredIds.has(j.id))
        filtered = [...filtered, ...remaining]
      }
    }
    if (params.tones) {
      const toneSlug = params.tones.toLowerCase()
      filtered = filtered.filter((j) => j.tones.some((t) => t.slug === toneSlug))
    }
    if (params.age_rating) {
      const arSlug = params.age_rating.toLowerCase()
      filtered = filtered.filter((j) => j.age_rating.slug === arSlug)
    }
    if (params.context_tags) {
      const ctSlug = params.context_tags.toLowerCase()
      filtered = filtered.filter((j) => j.context_tags.some((t) => t.slug === ctSlug))
    }

    return paginateMock(filtered, params.page || 1)
  },

  getById: async (id: number): Promise<Joke> => {
    await delay(200)
    const joke = mockJokes.find((j) => j.id === id)
    if (!joke) throw new Error('Joke not found')
    return joke
  },

  getRandom: async (): Promise<Joke> => {
    await delay(200)
    return mockJokes[Math.floor(Math.random() * mockJokes.length)]
  },

  rate: async (_jokeId: number, _rating: 1 | -1): Promise<void> => {
    await delay(200)
  },

  getMyRating: async (_jokeId: number): Promise<{ rating: number | null; joke_score: number }> => {
    await delay(200)
    return { rating: null, joke_score: 4.2 }
  },
}

export const mockDailyJokeApi = {
  getToday: async (): Promise<{ joke: Joke; date: string }> => {
    await delay(300)
    return mockDailyJoke
  },

  getHistory: async (): Promise<PaginatedResponse<{ joke: Joke; date: string }>> => {
    await delay()
    return paginateMock(mockDailyJokeHistory)
  },
}

export const mockCollectionsApi = {
  list: async (): Promise<PaginatedResponse<Collection>> => {
    await delay()
    return paginateMock(mockCollections, 1, 20)
  },

  create: async (name: string): Promise<Collection> => {
    await delay(300)
    return {
      id: Date.now(),
      name,
      is_default: false,
      joke_count: 0,
      created_at: new Date().toISOString(),
    }
  },

  update: async (id: number, name: string): Promise<Collection> => {
    await delay(300)
    const col = mockCollections.find((c) => c.id === id)
    return { ...(col || mockCollections[0]), name }
  },

  delete: async (_id: number): Promise<void> => {
    await delay(200)
  },

  getJokes: async (collectionId: number): Promise<PaginatedResponse<SavedJoke>> => {
    await delay()
    const filtered = mockSavedJokes.filter((s) => s.collection === collectionId)
    return paginateMock(filtered)
  },
}

export const mockSavedJokesApi = {
  list: async (): Promise<PaginatedResponse<SavedJoke>> => {
    await delay()
    return paginateMock(mockSavedJokes)
  },

  save: async (jokeId: number, collectionId: number, note?: string): Promise<SavedJoke> => {
    await delay(300)
    const joke = mockJokes.find((j) => j.id === jokeId) || mockJokes[0]
    return {
      id: Date.now(),
      joke,
      collection: collectionId,
      note: note || null,
      saved_at: new Date().toISOString(),
    }
  },

  unsave: async (_savedJokeId: number): Promise<void> => {
    await delay(200)
  },

  search: async (params: JokeSearchParams): Promise<PaginatedResponse<SavedJoke>> => {
    await delay()
    let filtered = [...mockSavedJokes]
    if (params.q) {
      const q = params.q.toLowerCase()
      filtered = filtered.filter((s) => s.joke.text.toLowerCase().includes(q))
    }
    return paginateMock(filtered, params.page || 1)
  },
}

export const mockAuthApi = {
  getUser: async () => {
    await delay(200)
    return mockUser
  },
}

// ── Trending ──
export const mockTrendingApi = {
  getJokes: async (_period: string = 'week'): Promise<TrendingJoke[]> => {
    await delay()
    return mockTrendingJokes
  },

  getTags: async (): Promise<TrendingTag[]> => {
    await delay(200)
    return mockTrendingTagsWithStats
  },

  getRisingTopics: async (): Promise<typeof mockRisingTopics> => {
    await delay(200)
    return mockRisingTopics
  },

  getTopJokesters: async (_limit: number = 5): Promise<TopJokester[]> => {
    await delay(200)
    return mockTopJokesters
  },

  getPopularThemes: async (): Promise<string[]> => {
    await delay(200)
    return mockPopularThemes
  },
}

// ── Favorites ──
export const mockFavoritesApi = {
  list: async (params?: { tones?: string; page?: number }): Promise<PaginatedResponse<FavoriteJoke>> => {
    await delay()
    let filtered = [...mockFavorites]
    if (params?.tones) {
      const slug = params.tones.toLowerCase().replace(/ /g, '_')
      filtered = filtered.filter((f) => f.joke.tones.some((t) => t.slug === slug))
    }
    return paginateMock(filtered, params?.page || 1)
  },

  add: async (jokeId: number): Promise<FavoriteJoke> => {
    await delay(200)
    const joke = mockJokes.find((j) => j.id === jokeId) || mockJokes[0]
    return { joke, favoritedAt: new Date().toISOString() }
  },

  remove: async (_jokeId: number): Promise<void> => {
    await delay(200)
  },

  stats: async (): Promise<{ totalCount: number; topTone: string; thisWeekCount: number }> => {
    await delay(200)
    return { totalCount: mockFavorites.length, topTone: 'Dad Jokes', thisWeekCount: 5 }
  },
}

// ── Drafts ──
export const mockDraftsApi = {
  list: async (): Promise<PaginatedResponse<DraftJoke>> => {
    await delay()
    return paginateMock(mockDrafts, 1, 20)
  },

  create: async (data: Partial<DraftJoke>): Promise<DraftJoke> => {
    await delay(300)
    return {
      id: Date.now(),
      setup: data.setup || '',
      punchline: data.punchline || '',
      format: data.format || 'Setup & Punchline',
      status: 'draft',
      tones: data.tones || [],
      lastEditedAt: new Date().toISOString(),
    }
  },

  update: async (id: number, data: Partial<DraftJoke>): Promise<DraftJoke> => {
    await delay(300)
    const draft = mockDrafts.find((d) => d.id === id) || mockDrafts[0]
    return { ...draft, ...data, lastEditedAt: new Date().toISOString() }
  },

  submit: async (id: number): Promise<DraftJoke> => {
    await delay(300)
    const draft = mockDrafts.find((d) => d.id === id) || mockDrafts[0]
    return { ...draft, status: 'pending' }
  },

  delete: async (_id: number): Promise<void> => {
    await delay(200)
  },
}

// ── Profile ──
export const mockProfileApi = {
  get: async (): Promise<UserProfile> => {
    await delay(300)
    return mockUserProfile
  },

  update: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    await delay(300)
    return { ...mockUserProfile, ...data }
  },

  getActivity: async (limit: number = 10): Promise<ActivityItem[]> => {
    await delay(300)
    return mockActivity.slice(0, limit)
  },

  getAchievements: async (): Promise<Achievement[]> => {
    await delay(300)
    return mockAchievements
  },
}

// ── Preferences ──
export const mockPreferencesApi = {
  get: async (): Promise<UserPreferences> => {
    await delay(200)
    return mockPreferences
  },

  update: async (data: Partial<UserPreferences>): Promise<UserPreferences> => {
    await delay(300)
    return { ...mockPreferences, ...data }
  },
}

// ── Creator Insights ──
export const mockCreatorInsightsApi = {
  get: async (period: InsightsPeriod = 'month'): Promise<CreatorInsights> => {
    await delay(300)
    return { ...mockCreatorInsights, period }
  },
}
