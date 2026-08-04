import type { Joke, JokeTaxon, JokeSearchParams, PaginatedResponse, Collection, SavedJoke, TrendingJokeDTO, TrendingTagDTO, RisingTagDTO, TopJokesterDTO, FavoriteJokeDTO, FollowStatus, CreatorProfile } from './api'
import type {
  TrendingJoke,
  TrendingTag,
  TopJokester,
  FavoriteJoke,
  DraftJoke,
  UserProfile,
  Achievement,
  UserPreferences,
} from './mock-data'
import type { BlockedUser, ContentReportInput, NotificationDTO, AppealDTO, CreateAppealInput } from './api'
import { jokesApi, dailyJokeApi, collectionsApi, savedJokesApi, trendingApi, favoritesApi, creatorInsightsApi, followsApi, creatorProfileApi, billingApi, tipsApi, profileApi, moderationApi, notificationsApi, draftsApi, appealsApi } from './api'
import type { DraftJokeDTO } from './api'
import type { InsightsPeriod, CreatorInsights, BillingPlan, MySubscription, BillingEntitlements, CheckoutSessionResponse, PortalSessionResponse, TipCheckoutInput, TipCheckoutResponse, TipsSummary, Tip } from './api'
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
  mockFollowsApi,
  mockCreatorProfileApi,
  mockBillingApi,
  mockTipsApi,
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
  // `issue_label` is optional so the mock (which omits it) stays assignable; the
  // real backend response includes it and the daily hero renders it when present.
  getToday: (): Promise<{ joke: Joke; date: string; issue_label?: string }> =>
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

  save: (jokeId: number, collectionId?: number | null, note?: string): Promise<SavedJoke> =>
    USE_MOCKS
      ? mockSavedJokesApi.save(jokeId, collectionId ?? 0, note)
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

// ── Drafts mappers ──
// The real DraftJokeDTO (snake_case, nested format object, backend status enum)
// doesn't line up with the camelCase DraftJoke the legacy drafts UI renders, so
// map between them. Only the cleanly-mappable text fields cross the write
// boundary; the legacy display-label `format`/`tones` have no backend-id
// equivalent here, so they're dropped rather than sent as bogus values.
const draftStatusFromDTO: Record<DraftJokeDTO['status'], DraftJoke['status']> = {
  draft: 'draft',
  submitted: 'pending',
  approved: 'published',
  rejected: 'rejected',
}

function draftFromDTO(d: DraftJokeDTO): DraftJoke {
  return {
    id: d.id,
    setup: d.setup ?? d.text ?? '',
    punchline: d.punchline ?? '',
    format: d.format?.name ?? '',
    status: draftStatusFromDTO[d.status] ?? 'draft',
    tones: [],
    lastEditedAt: d.updated_at || d.created_at || '',
  }
}

function draftToDTO(data: Partial<DraftJoke>): Partial<DraftJokeDTO> {
  const dto: Partial<DraftJokeDTO> = {}
  if (data.setup !== undefined) dto.setup = data.setup || null
  if (data.punchline !== undefined) dto.punchline = data.punchline || null
  // SubmitJokePage forwards a `text` field (excess prop on Partial<DraftJoke>).
  const text = (data as { text?: string }).text
  if (text !== undefined) dto.text = text
  return dto
}

// ── Drafts Adapter ──
export const draftsAdapter = {
  list: (): Promise<PaginatedResponse<DraftJoke>> =>
    USE_MOCKS
      ? mockDraftsApi.list()
      : draftsApi.list().then((r) => ({ ...r.data, results: r.data.results.map(draftFromDTO) })),

  create: (data: Partial<DraftJoke>): Promise<DraftJoke> =>
    USE_MOCKS
      ? mockDraftsApi.create(data)
      : draftsApi.create(draftToDTO(data)).then((r) => draftFromDTO(r.data)),

  update: (id: number, data: Partial<DraftJoke>): Promise<DraftJoke> =>
    USE_MOCKS
      ? mockDraftsApi.update(id, data)
      : draftsApi.update(id, draftToDTO(data)).then((r) => draftFromDTO(r.data)),

  submit: (id: number): Promise<DraftJoke> =>
    USE_MOCKS
      ? mockDraftsApi.submit(id)
      : draftsApi.submit(id).then((r) => draftFromDTO(r.data)),

  delete: (id: number): Promise<void> =>
    USE_MOCKS
      ? mockDraftsApi.delete(id)
      : draftsApi.delete(id).then(() => undefined),
}

// ── Profile Adapter ──
//
// Real path hits the same GET /users/me/profile/ the Settings "Public identity"
// editor uses (via profileApi), plus /users/me/activity/ and
// /users/me/achievements/. The backend returns richer, snake_case data than the
// speculative UserProfileDTO in api.ts, so we map from the real runtime shape
// here into the camelCase types the UI renders.

/** Real GET /users/me/profile/ response (backend truth). */
interface RealUserProfile {
  name?: string
  username?: string
  display_name?: string
  handle?: string | null
  email?: string
  bio?: string | null
  avatar_url?: string | null
  member_since?: string
  is_premium?: boolean
  stats?: { jokes_saved?: number; jokes_shared?: number; collections?: number; days_active?: number }
  humor_dna?: { type: string; percentage: number }[]
}

/** UserProfile plus the real avatar URL the profile page renders. */
export interface ProfileView extends UserProfile {
  avatarUrl: string | null
}

function mapProfile(d: RealUserProfile): ProfileView {
  return {
    name: d.name ?? '',
    username: d.username ?? '',
    email: d.email ?? '',
    bio: d.bio ?? '',
    memberSince: d.member_since ?? '',
    isPremium: !!d.is_premium,
    stats: {
      jokesSaved: d.stats?.jokes_saved ?? 0,
      jokesShared: d.stats?.jokes_shared ?? 0,
      collections: d.stats?.collections ?? 0,
      daysActive: d.stats?.days_active ?? 0,
    },
    humorDNA: d.humor_dna ?? [],
    avatarUrl: d.avatar_url ?? null,
  }
}

/** Real GET /users/me/activity/ row. `id` is a string like "rating_5". */
interface RealActivityRow {
  id: string | number
  type: string
  description: string
  created_at: string
}

/** Activity as the UI renders it (icon + relative time derived client-side). */
export interface ActivityView {
  id: string | number
  type: string
  description: string
  timeAgo: string
  icon: string
}

function activityIcon(type: string): string {
  switch (type) {
    case 'save': return '🔖'
    case 'like': return '❤️'
    case 'dislike': return '👎'
    case 'share': return '📤'
    case 'achievement': return '🏆'
    case 'collection': return '📁'
    case 'draft': return '✏️'
    default: return '•'
  }
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const weeks = Math.floor(days / 7)
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`
}

/** Real GET /users/me/achievements/ row. */
interface RealAchievementRow {
  id: string
  title: string
  description: string
  icon: string | null
  unlocked: boolean
  unlocked_at: string | null
}

function mapAchievement(a: RealAchievementRow): Achievement {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon ?? '🏆',
    unlocked: a.unlocked,
    unlockedAt: a.unlocked_at ?? undefined,
  }
}

export const profileAdapter = {
  get: (): Promise<ProfileView> =>
    USE_MOCKS
      ? mockProfileApi.get().then((p) => ({ ...p, avatarUrl: null }))
      : profileApi.get().then((r) => mapProfile(r.data as unknown as RealUserProfile)),

  update: (data: Partial<UserProfile>): Promise<ProfileView> =>
    USE_MOCKS
      ? mockProfileApi.update(data).then((p) => ({ ...p, avatarUrl: null }))
      : profileApi.update({ bio: data.bio }).then((r) => mapProfile(r.data as unknown as RealUserProfile)),

  getActivity: (limit?: number): Promise<ActivityView[]> =>
    USE_MOCKS
      ? mockProfileApi.getActivity(limit)
      : profileApi
          .activity(limit)
          .then((r) => ((r.data as unknown as { results: RealActivityRow[] }).results ?? []).map((row) => ({
            id: row.id,
            type: row.type,
            description: row.description,
            timeAgo: relativeTime(row.created_at),
            icon: activityIcon(row.type),
          }))),

  getAchievements: (): Promise<Achievement[]> =>
    USE_MOCKS
      ? mockProfileApi.getAchievements()
      : profileApi
          .achievements()
          .then((r) => ((r.data as unknown as { results: RealAchievementRow[] }).results ?? []).map(mapAchievement)),
}

// ── Public Identity Adapter ──
// Editing a creator's public handle/display name. This has a REAL path (the rest
// of profileAdapter is still mock-only because its DTO is unverified): the
// backend PATCH /users/me/profile/ is implemented and validates the handle.
export interface PublicIdentity {
  display_name: string
  handle: string | null
  /** Resolved public-facing values (name falls back to user_<id>, etc.). */
  name: string
  username: string
}

const mapIdentity = (d: {
  display_name?: string
  handle?: string | null
  name?: string
  username?: string
}): PublicIdentity => ({
  display_name: d.display_name ?? '',
  handle: d.handle ?? null,
  name: d.name ?? '',
  username: d.username ?? '',
})

// In-memory identity for the offline/mock demo so edits round-trip.
let mockIdentity: PublicIdentity = { display_name: '', handle: null, name: 'You', username: '@you' }

// ── Notifications (inbox) Adapter ──
// In-app notifications. Mock keeps a small seeded inbox so the offline demo
// shows the panel populated and "mark all read" round-trips.
// Appeals & Notices wave: seed one of each moderation-notice verb so the
// richer copy + Appeal CTAs (see NotificationsPanel) actually show up when
// developing against mocks, not just against the real backend.
let mockNotifications: NotificationDTO[] = [
  {
    id: 1, verb: 'followed_you', read: false, created_at: '2026-06-19T12:00:00Z',
    actor: { id: 7, name: 'Pun Queen', username: '@punqueen' }, joke: null,
  },
  {
    id: 2, verb: 'joke_published', read: false, created_at: '2026-06-18T09:30:00Z',
    actor: null, joke: { id: 42, preview: 'Why did the scarecrow win an award? ...' },
  },
  {
    id: 3, verb: 'joke_removed', read: false, created_at: '2026-06-17T15:00:00Z',
    actor: null, joke: { id: 43, preview: 'A removed joke about...' },
    data: { reason: 'harassment', appeal_deadline: '2026-07-01T00:00:00Z' },
  },
  {
    id: 4, verb: 'joke_rejected', read: false, created_at: '2026-06-16T11:00:00Z',
    actor: null, joke: null,
    data: { submission_id: 501, rejection_reason: 'Too similar to an existing joke.' },
  },
  {
    id: 5, verb: 'appeal_resolved', read: false, created_at: '2026-06-15T09:00:00Z',
    actor: null, joke: { id: 43, preview: 'A removed joke about...' },
    data: { outcome: 'reversed' },
  },
]

export const notificationsAdapter = {
  list: (): Promise<NotificationDTO[]> =>
    USE_MOCKS ? Promise.resolve(mockNotifications) : notificationsApi.list().then((r) => r.data.results),

  unreadCount: (): Promise<number> =>
    USE_MOCKS
      ? Promise.resolve(mockNotifications.filter((n) => !n.read).length)
      : notificationsApi.unreadCount().then((r) => r.data.count),

  markAllRead: (): Promise<void> => {
    if (USE_MOCKS) {
      mockNotifications = mockNotifications.map((n) => ({ ...n, read: true }))
      return Promise.resolve()
    }
    return notificationsApi.markRead().then(() => undefined)
  },
}

// ── Moderation Adapter ──
// Real path hits the Wave 2 endpoints; mock keeps an in-memory blocked list so
// the offline demo round-trips block/unblock and report is a no-op success.
let mockBlocked: BlockedUser[] = []

export const moderationAdapter = {
  report: (data: ContentReportInput): Promise<void> =>
    USE_MOCKS ? Promise.resolve() : moderationApi.report(data).then(() => undefined),

  block: (user: BlockedUser): Promise<void> => {
    if (USE_MOCKS) {
      if (!mockBlocked.some((u) => u.id === user.id)) mockBlocked = [...mockBlocked, user]
      return Promise.resolve()
    }
    return moderationApi.block(user.id).then(() => undefined)
  },

  unblock: (userId: number): Promise<void> => {
    if (USE_MOCKS) {
      mockBlocked = mockBlocked.filter((u) => u.id !== userId)
      return Promise.resolve()
    }
    return moderationApi.unblock(userId).then(() => undefined)
  },

  myBlocks: (): Promise<BlockedUser[]> =>
    USE_MOCKS ? Promise.resolve(mockBlocked) : moderationApi.myBlocks().then((r) => r.data.results),
}

// ── Appeals Adapter ──
// Real path hits the Appeals & Notices endpoints. Mock keeps an in-memory list
// (seeded empty, like mockBlocked) so the offline demo lets a creator file an
// appeal and immediately see it show up as pending.
let mockAppealId = 1
let mockAppeals: AppealDTO[] = []

export const appealsAdapter = {
  create: (data: CreateAppealInput): Promise<AppealDTO> => {
    if (USE_MOCKS) {
      const appeal: AppealDTO = {
        id: mockAppealId++,
        action_type: data.joke_id ? 'takedown' : 'rejection',
        status: 'pending',
        reason_text: data.reason_text,
        target_type: data.joke_id ? 'joke' : 'submission',
        target_id: (data.joke_id ?? data.submission_id ?? 0),
        target_preview: '',
        created_at: new Date().toISOString(),
        resolved_at: null,
        resolution_note: '',
      }
      mockAppeals = [appeal, ...mockAppeals]
      return Promise.resolve(appeal)
    }
    return appealsApi.create(data).then((r) => r.data)
  },

  // Graceful-absent: the endpoint may not exist yet on some deploys — treat a
  // 404 as "no appeals" rather than surfacing an error to the UI.
  myAppeals: (): Promise<AppealDTO[]> => {
    if (USE_MOCKS) return Promise.resolve(mockAppeals)
    return appealsApi
      .myAppeals()
      .then((r) => r.data.results)
      .catch((err) => {
        if ((err as { response?: { status?: number } })?.response?.status === 404) return []
        throw err
      })
  },
}

export const accountIdentityAdapter = {
  get: (): Promise<PublicIdentity> =>
    USE_MOCKS
      ? Promise.resolve(mockIdentity)
      : profileApi.get().then((r) => mapIdentity(r.data)),

  update: (data: { display_name?: string; handle?: string | null }): Promise<PublicIdentity> => {
    if (USE_MOCKS) {
      mockIdentity = {
        ...mockIdentity,
        ...data,
        name: data.display_name || mockIdentity.name,
        username: data.handle ? `@${data.handle}` : mockIdentity.username,
      }
      return Promise.resolve(mockIdentity)
    }
    return profileApi.update(data).then((r) => mapIdentity(r.data))
  },
}

// ── Creator Insights Adapter ──
export const creatorInsightsAdapter = {
  get: (period: InsightsPeriod = 'month'): Promise<CreatorInsights> =>
    USE_MOCKS
      ? mockCreatorInsightsApi.get(period)
      : creatorInsightsApi.get(period).then((r) => r.data),
}

// ── Follows Adapter ──
export const followsAdapter = {
  follow: (id: number): Promise<FollowStatus> =>
    USE_MOCKS
      ? mockFollowsApi.follow(id)
      : followsApi.follow(id).then((r) => r.data),

  unfollow: (id: number): Promise<void> =>
    USE_MOCKS
      ? mockFollowsApi.unfollow(id)
      : followsApi.unfollow(id).then(() => undefined),

  status: (id: number): Promise<FollowStatus> =>
    USE_MOCKS
      ? mockFollowsApi.status(id)
      : followsApi.status(id).then((r) => r.data),
}

// ── Creator Profile Adapter ──
// The real API serializes a profile's jokes via JokeListSerializer, which emits
// tones/categories as slug *strings* and format/age_rating as slug strings.
// JokeCard renders tones as objects (tone.id/slug/name), so the lean DTO must be
// normalized to the Joke shape. Defensive: objects pass through unchanged, so
// this is safe if the backend serializer ever switches to nested objects.
function prettifySlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function toTaxon(value: string | JokeTaxon, index: number): JokeTaxon {
  return typeof value === 'string'
    ? { id: -(index + 1), name: prettifySlug(value), slug: value }
    : value
}

function toTaxonObject(value: unknown, extra: Record<string, unknown> = {}): unknown {
  return typeof value === 'string'
    ? { id: 0, name: prettifySlug(value), slug: value, ...extra }
    : value
}

export function normalizeProfileJoke(raw: Joke): Joke {
  const tones = Array.isArray(raw.tones) ? raw.tones.map(toTaxon) : []
  return {
    ...raw,
    tones,
    categories: Array.isArray(raw.categories) ? raw.categories.map(toTaxon) : tones,
    format: toTaxonObject(raw.format) as Joke['format'],
    age_rating: toTaxonObject(raw.age_rating, { min_age: 0 }) as Joke['age_rating'],
  }
}

export const creatorProfileAdapter = {
  get: (id: number): Promise<CreatorProfile> =>
    USE_MOCKS
      ? mockCreatorProfileApi.get(id)
      : creatorProfileApi.get(id).then((r) => ({
          ...r.data,
          jokes: (r.data.jokes ?? []).map(normalizeProfileJoke),
        })),
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

// ── Billing Adapter ──
export const billingAdapter = {
  listPlans: (): Promise<BillingPlan[]> =>
    USE_MOCKS
      ? mockBillingApi.listPlans()
      : billingApi.listPlans().then((r) => r.data),

  mySubscription: (): Promise<MySubscription> =>
    USE_MOCKS
      ? mockBillingApi.mySubscription()
      : billingApi.mySubscription().then((r) => r.data),

  entitlements: (): Promise<BillingEntitlements> =>
    USE_MOCKS
      ? mockBillingApi.entitlements()
      : billingApi.entitlements().then((r) => r.data),

  createCheckoutSession: (plan_slug: string): Promise<CheckoutSessionResponse> =>
    USE_MOCKS
      ? mockBillingApi.createCheckoutSession(plan_slug)
      : billingApi.createCheckoutSession(plan_slug).then((r) => r.data),

  createPortalSession: (): Promise<PortalSessionResponse> =>
    USE_MOCKS
      ? mockBillingApi.createPortalSession()
      : billingApi.createPortalSession().then((r) => r.data),
}

// ── Tips Adapter ──
export const tipsAdapter = {
  createCheckout: (input: TipCheckoutInput): Promise<TipCheckoutResponse> =>
    USE_MOCKS
      ? mockTipsApi.createCheckout(input)
      : tipsApi.createCheckout(input).then((r) => r.data),

  creatorSummary: (creatorId: number): Promise<TipsSummary> =>
    USE_MOCKS
      ? mockTipsApi.creatorSummary(creatorId)
      : tipsApi.creatorSummary(creatorId).then((r) => r.data),

  mySentTips: (): Promise<PaginatedResponse<Tip>> =>
    USE_MOCKS
      ? mockTipsApi.mySentTips()
      : tipsApi.mySentTips().then((r) => r.data),
}
