import type { Joke, JokeSearchParams, PaginatedResponse, Collection, SavedJoke, TrendingJokeDTO, TrendingTagDTO, RisingTagDTO, TopJokesterDTO, FavoriteJokeDTO } from './api'
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
import { jokesApi, dailyJokeApi, collectionsApi, savedJokesApi, trendingApi, favoritesApi, creatorInsightsApi } from './api'
import type { InsightsPeriod, CreatorInsights } from './api'
import {
  mockJokesApi,
  mockDailyJokeApi,
  mockCollectionsApi,
  mockSavedJokesApi,
  mockTrendingApi,
  mockFavoritesApi,
  mockDraftsApi,
  mockProfileApi,
  mockPreferencesApi,
  mockCreatorInsightsApi,
} from './mock-api'

const USE_MOCKS =
  !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCKS === 'true'

// ── Jokes Adapter ──
export const jokesAdapter = {
  search: (params: JokeSearchParams): Promise<PaginatedResponse<Joke>> =>
    USE_MOCKS
      ? mockJokesApi.search(params)
      : jokesApi.search(params).then((r) => r.data),

  getById: (id: number): Promise<Joke> =>
    USE_MOCKS
      ? mockJokesApi.getById(id)
      : jokesApi.getById(id).then((r) => r.data),

  getRandom: (): Promise<Joke> =>
    USE_MOCKS
      ? mockJokesApi.getRandom()
      : jokesApi.getRandom().then((r) => r.data),

  rate: (jokeId: number, rating: 1 | -1): Promise<void> =>
    USE_MOCKS
      ? mockJokesApi.rate(jokeId, rating)
      : jokesApi.rate(jokeId, rating).then(() => undefined),

  getMyRating: (jokeId: number): Promise<{ rating: number | null; joke_score: number }> =>
    USE_MOCKS
      ? mockJokesApi.getMyRating(jokeId)
      : jokesApi.getMyRating(jokeId).then((r) => r.data),
}

// ── Daily Joke Adapter ──
export const dailyJokeAdapter = {
  getToday: (): Promise<{ joke: Joke; date: string }> =>
    USE_MOCKS
      ? mockDailyJokeApi.getToday()
      : dailyJokeApi.getToday().then((r) => r.data),

  getHistory: (): Promise<PaginatedResponse<{ joke: Joke; date: string }>> =>
    USE_MOCKS
      ? mockDailyJokeApi.getHistory()
      : dailyJokeApi.getHistory().then((r) => r.data),
}

// ── Collections Adapter ──
export const collectionsAdapter = {
  list: (): Promise<PaginatedResponse<Collection>> =>
    USE_MOCKS
      ? mockCollectionsApi.list()
      : collectionsApi.list().then((r) => r.data),

  create: (name: string): Promise<Collection> =>
    USE_MOCKS
      ? mockCollectionsApi.create(name)
      : collectionsApi.create(name).then((r) => r.data),

  update: (id: number, name: string): Promise<Collection> =>
    USE_MOCKS
      ? mockCollectionsApi.update(id, name)
      : collectionsApi.update(id, name).then((r) => r.data),

  delete: (id: number): Promise<void> =>
    USE_MOCKS
      ? mockCollectionsApi.delete(id)
      : collectionsApi.delete(id).then(() => undefined),

  getJokes: (collectionId: number): Promise<PaginatedResponse<SavedJoke>> =>
    USE_MOCKS
      ? mockCollectionsApi.getJokes(collectionId)
      : collectionsApi.getJokes(collectionId).then((r) => r.data),
}

// ── Saved Jokes Adapter ──
export const savedJokesAdapter = {
  list: (): Promise<PaginatedResponse<SavedJoke>> =>
    USE_MOCKS
      ? mockSavedJokesApi.list()
      : savedJokesApi.list().then((r) => r.data),

  save: (jokeId: number, collectionId: number, note?: string): Promise<SavedJoke> =>
    USE_MOCKS
      ? mockSavedJokesApi.save(jokeId, collectionId, note)
      : savedJokesApi.save(jokeId, collectionId, note).then((r) => r.data),

  unsave: (savedJokeId: number): Promise<void> =>
    USE_MOCKS
      ? mockSavedJokesApi.unsave(savedJokeId)
      : savedJokesApi.unsave(savedJokeId).then(() => undefined),

  search: (params: JokeSearchParams): Promise<PaginatedResponse<SavedJoke>> =>
    USE_MOCKS
      ? mockSavedJokesApi.search(params)
      : savedJokesApi.search(params).then((r) => r.data),
}

// ── Trending mappers ──
const trendingJokeFromDTO = (d: TrendingJokeDTO): TrendingJoke => ({
  joke: d.joke,
  rank: d.rank,
  likes: d.likes,
  shares: d.shares,
  comments: d.comments,
  trendingSince: d.trending_since,
})
const trendingTagFromDTO = (d: TrendingTagDTO): TrendingTag => ({
  name: d.name,
  count: d.count,
  growth: d.growth_percent,
})
const risingFromDTO = (d: RisingTagDTO) => ({ name: d.name, growth: d.growth_percent })
const topJokesterFromDTO = (d: TopJokesterDTO): TopJokester => ({
  id: d.id,
  name: d.name,
  punchlineCount: d.punchline_count,
  rank: d.rank,
  avatarUrl: d.avatar_url ?? undefined,
})

// ── Trending Adapter ──
export const trendingAdapter = {
  getJokes: (period?: string): Promise<TrendingJoke[]> =>
    USE_MOCKS
      ? mockTrendingApi.getJokes(period)
      : trendingApi.jokes(period).then((r) => r.data.results.map(trendingJokeFromDTO)),

  getTags: (): Promise<TrendingTag[]> =>
    USE_MOCKS
      ? mockTrendingApi.getTags()
      : trendingApi.tags().then((r) => r.data.results.map(trendingTagFromDTO)),

  getRisingTopics: (): Promise<{ name: string; growth: number }[]> =>
    USE_MOCKS
      ? mockTrendingApi.getRisingTopics()
      : trendingApi.risingTags().then((r) => r.data.results.map(risingFromDTO)),

  getTopJokesters: (limit?: number): Promise<TopJokester[]> =>
    USE_MOCKS
      ? mockTrendingApi.getTopJokesters(limit)
      : trendingApi.jokesters(limit).then((r) => r.data.results.map(topJokesterFromDTO)),

  getPopularThemes: (): Promise<string[]> =>
    USE_MOCKS
      ? mockTrendingApi.getPopularThemes()
      : trendingApi.themes().then((r) => r.data.results),
}

// ── Favorites mappers ──
const favoriteFromDTO = (d: FavoriteJokeDTO): FavoriteJoke => ({
  joke: d.joke,
  favoritedAt: d.favorited_at,
})

// ── Favorites Adapter ──
export const favoritesAdapter = {
  list: (params?: { tones?: string; page?: number }): Promise<PaginatedResponse<FavoriteJoke>> =>
    USE_MOCKS
      ? mockFavoritesApi.list(params)
      : favoritesApi.list(params).then((r) => ({ ...r.data, results: r.data.results.map(favoriteFromDTO) })),

  add: (jokeId: number): Promise<FavoriteJoke> =>
    USE_MOCKS
      ? mockFavoritesApi.add(jokeId)
      : favoritesApi.add(jokeId).then((r) => favoriteFromDTO(r.data)),

  remove: (jokeId: number): Promise<void> =>
    USE_MOCKS
      ? mockFavoritesApi.remove(jokeId)
      : favoritesApi.list().then((r) => {
          const fav = r.data.results.find((f) => f.joke.id === jokeId)
          if (!fav) return undefined
          return favoritesApi.remove(fav.id).then(() => undefined)
        }),

  stats: (): Promise<{ totalCount: number; topTone: string; thisWeekCount: number }> =>
    USE_MOCKS
      ? mockFavoritesApi.stats()
      : favoritesApi.stats().then((r) => ({
          totalCount: r.data.total_count,
          topTone: r.data.top_tone ?? '',
          thisWeekCount: r.data.this_week_count,
        })),
}

// ── Drafts Adapter ──
export const draftsAdapter = {
  list: (): Promise<PaginatedResponse<DraftJoke>> =>
    mockDraftsApi.list(),

  create: (data: Partial<DraftJoke>): Promise<DraftJoke> =>
    mockDraftsApi.create(data),

  update: (id: number, data: Partial<DraftJoke>): Promise<DraftJoke> =>
    mockDraftsApi.update(id, data),

  submit: (id: number): Promise<DraftJoke> =>
    mockDraftsApi.submit(id),

  delete: (id: number): Promise<void> =>
    mockDraftsApi.delete(id),
}

// ── Profile Adapter ──
export const profileAdapter = {
  get: (): Promise<UserProfile> =>
    mockProfileApi.get(),

  update: (data: Partial<UserProfile>): Promise<UserProfile> =>
    mockProfileApi.update(data),

  getActivity: (limit?: number): Promise<ActivityItem[]> =>
    mockProfileApi.getActivity(limit),

  getAchievements: (): Promise<Achievement[]> =>
    mockProfileApi.getAchievements(),
}

// ── Creator Insights Adapter ──
export const creatorInsightsAdapter = {
  get: (period: InsightsPeriod = 'month'): Promise<CreatorInsights> =>
    USE_MOCKS
      ? mockCreatorInsightsApi.get(period)
      : creatorInsightsApi.get(period).then((r) => r.data),
}

// ── Preferences Adapter ──
//
// Iteration 4: optionally route through the real /users/me/preferences/
// endpoint when VITE_USE_REAL_PREFERENCES === 'true'. Mock stays the default
// until the backend's response shape is confirmed in production.
//
// The shape mismatch handled here:
//   UserPreferences (mock-data.ts, camelCase): { humorTypes, ageRating, tones, languages, ... }
//   PreferencesDTO  (api.ts, snake_case):      { humor_types, age_rating, tones, languages, ... }
import { preferencesApi, type PreferencesDTO } from './api'

const USE_REAL_PREFERENCES =
  import.meta.env.VITE_USE_REAL_PREFERENCES === 'true' || !USE_MOCKS

function toDTO(prefs: Partial<UserPreferences>): Partial<PreferencesDTO> {
  return {
    tones: prefs.tones,
    age_rating: prefs.ageRating,
    languages: prefs.languages,
    humor_types: prefs.humorTypes,
    notifications: prefs.notifications && {
      daily_joke: prefs.notifications.dailyJoke,
      trending_alerts: prefs.notifications.trendingAlerts,
      collection_updates: prefs.notifications.collectionUpdates,
      email_digest: prefs.notifications.emailDigest,
    },
    privacy: prefs.privacy && {
      public_profile: prefs.privacy.publicProfile,
      show_activity: prefs.privacy.showActivity,
      share_analytics: prefs.privacy.shareAnalytics,
    },
    theme: prefs.theme,
    // P8: daily-ritual fields
    notification_enabled: prefs.notificationEnabled,
    notification_time: prefs.notificationTime,
    notification_days: prefs.notificationDays,
    streak_saver_enabled: prefs.streakSaverEnabled,
    onboarding_completed: prefs.onboardingCompleted,
  }
}

function fromDTO(dto: PreferencesDTO): UserPreferences {
  return {
    humorTypes: dto.humor_types ?? [],
    notifications: {
      dailyJoke: dto.notifications?.daily_joke ?? true,
      trendingAlerts: dto.notifications?.trending_alerts ?? false,
      collectionUpdates: dto.notifications?.collection_updates ?? true,
      emailDigest: dto.notifications?.email_digest ?? false,
    },
    privacy: {
      publicProfile: dto.privacy?.public_profile ?? true,
      showActivity: dto.privacy?.show_activity ?? true,
      shareAnalytics: dto.privacy?.share_analytics ?? false,
    },
    theme: dto.theme ?? 'light',
    tones: dto.tones,
    ageRating: dto.age_rating,
    languages: dto.languages,
  }
}

export const preferencesAdapter = {
  get: (): Promise<UserPreferences> =>
    USE_REAL_PREFERENCES
      ? preferencesApi.get().then((r) => fromDTO(r.data))
      : mockPreferencesApi.get(),

  update: (data: Partial<UserPreferences>): Promise<UserPreferences> =>
    USE_REAL_PREFERENCES
      ? preferencesApi.update(toDTO(data)).then((r) => fromDTO(r.data))
      : mockPreferencesApi.update(data),
}
