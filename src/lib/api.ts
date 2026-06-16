import { api } from './axios'

// Auth types
export interface User {
  pk: number
  username: string
  email: string
  first_name: string
  last_name: string
  /** ISO 'YYYY-MM-DD' date of birth — populated by the backend /auth/user/ endpoint (Work-Stream B). Null/absent until then. */
  date_of_birth?: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password1: string
  password2: string
  date_of_birth: string // ISO 'YYYY-MM-DD' — backend enforces the under-13 block
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

/** Gated-mode registration response (EMAIL_VERIFICATION_REQUIRED on): no session yet. */
export interface EmailVerificationPending {
  detail: string
  email: string
}

export interface VerifyEmailRequest {
  email: string
  code: string
}

export interface VerifyEmailResponse {
  user: User
}

export interface GoogleAuthRequest {
  code: string
  /** Optional — backend may use this to override its env var (django-allauth's
   * SocialLoginSerializer accepts it). Send it from the frontend so origin-aware
   * OAuth works on localhost without backend changes. */
  redirect_uri?: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  uid: string
  token: string
  new_password1: string
  new_password2: string
}

export interface PasswordChangeRequest {
  old_password: string
  new_password1: string
  new_password2: string
}

export interface UpdateUserRequest {
  username?: string
  first_name?: string
  last_name?: string
}

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login/', credentials),

  register: (credentials: RegisterCredentials) =>
    api.post<AuthResponse | EmailVerificationPending>('/auth/registration/', credentials),

  logout: () =>
    api.post('/auth/logout/'),

  googleAuth: (payload: GoogleAuthRequest) =>
    api.post<AuthResponse>('/auth/google/', payload),

  getUser: () =>
    api.get<User>('/auth/user/'),

  updateUser: (patch: UpdateUserRequest) =>
    api.patch<User>('/auth/user/', patch),

  refreshToken: () =>
    api.post<{ access: string }>('/auth/token/refresh/'),

  verifyToken: (token: string) =>
    api.post<Record<string, never>>('/auth/token/verify/', { token }),

  passwordChange: (payload: PasswordChangeRequest) =>
    api.post<{ detail: string }>('/auth/password/change/', payload),

  passwordReset: (payload: PasswordResetRequest) =>
    api.post<{ detail: string }>('/auth/password/reset/', payload),

  passwordResetConfirm: (payload: PasswordResetConfirmRequest) =>
    api.post<{ detail: string }>('/auth/password/reset/confirm/', payload),

  verifyEmail: (payload: VerifyEmailRequest) =>
    api.post<VerifyEmailResponse>('/auth/verify-email/', payload),

  resendVerification: (email: string) =>
    api.post<{ detail: string }>('/auth/resend-verification/', { email }),
}

// Joke types (from backend models)
//
// VOCABULARY: per the Pivot Plan P1 (2026-05-09 backend handout), every
// joke response includes BOTH legacy (`tones`, `context_tags`) AND new
// (`categories`, `themes`) field names. They're synonyms — backend
// guarantees both are present indefinitely. Existing consumers can keep
// using legacy names; new consumers should prefer new names.
//
// P10 polish: knock-knock format jokes now include `lines: string[]`
// for alternating-bubble UI.
export interface JokeTaxon {
  id: number
  name: string
  slug: string
}

export interface Joke {
  id: number
  text: string
  setup: string | null
  punchline: string | null
  /** P10: array of dialogue lines for `format=knock-knock` jokes; null otherwise.
   * Optional in the type since legacy mock fixtures pre-date this field. */
  lines?: string[] | null
  format: { id: number; name: string; slug: string }
  age_rating: { id: number; name: string; slug: string; min_age: number }
  /** Legacy: "how the joke feels" */
  tones: JokeTaxon[]
  /** P1 synonym for `tones`. Optional in type for legacy fixtures; backend always returns it. */
  categories?: JokeTaxon[]
  /** Legacy: "what the joke is about" */
  context_tags: JokeTaxon[]
  /** P1 synonym for `context_tags`. Optional in type for legacy fixtures. */
  themes?: JokeTaxon[]
  culture_tags: JokeTaxon[]
  language: { id: number; name: string; code: string }
  source: string
  share_image_url: string | null
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface JokeSearchParams {
  q?: string
  joke_format?: string  // Note: joke_format not format (DRF conflict)
  age_rating?: string
  tones?: string
  context_tags?: string
  /** P1 synonyms — backend accepts either name. */
  categories?: string
  themes?: string
  culture_tags?: string
  language?: string
  page?: number
  page_size?: number
  /** P2 — filter by vibe slug; resolves to format/theme/category constraints server-side. */
  vibe?: string
  /** Default ordering is relevance when q is set; otherwise -created_at. */
  ordering?: string
}

// Jokes API
export const jokesApi = {
  search: (params: JokeSearchParams) =>
    api.get<PaginatedResponse<Joke>>('/jokes/', { params }),

  getById: (id: number) =>
    api.get<Joke>(`/jokes/${id}/`),

  getRandom: () =>
    api.get<Joke>('/jokes/random/'),

  rate: (jokeId: number, rating: 1 | -1) =>
    api.post(`/jokes/${jokeId}/rate/`, { rating }),

  getMyRating: (jokeId: number) =>
    api.get<{ rating: number | null; joke_score: number }>(`/jokes/${jokeId}/my-rating/`),
}

// Daily joke API
export const dailyJokeApi = {
  getToday: () =>
    api.get<{ joke: Joke; date: string }>('/daily-jokes/today/'),

  getHistory: () =>
    api.get<PaginatedResponse<{ joke: Joke; date: string }>>('/daily-jokes/history/'),
}

// Collections API
export interface Collection {
  id: number
  name: string
  is_default: boolean
  joke_count: number
  created_at: string
}

export interface SavedJoke {
  id: number
  joke: Joke
  collection: number
  note: string | null
  saved_at: string
}

export const collectionsApi = {
  list: () =>
    api.get<PaginatedResponse<Collection>>('/collections/'),

  create: (name: string) =>
    api.post<Collection>('/collections/', { name }),

  update: (id: number, name: string) =>
    api.patch<Collection>(`/collections/${id}/`, { name }),

  delete: (id: number) =>
    api.delete(`/collections/${id}/`),

  getJokes: (collectionId: number) =>
    api.get<PaginatedResponse<SavedJoke>>(`/collections/${collectionId}/jokes/`),
}

export const savedJokesApi = {
  list: () =>
    api.get<PaginatedResponse<SavedJoke>>('/saved-jokes/'),

  save: (jokeId: number, collectionId: number, note?: string) =>
    api.post<SavedJoke>('/saved-jokes/', { joke: jokeId, collection: collectionId, note }),

  unsave: (savedJokeId: number) =>
    api.delete(`/saved-jokes/${savedJokeId}/`),

  search: (params: JokeSearchParams) =>
    api.get<PaginatedResponse<SavedJoke>>('/saved-jokes/search/', { params }),
}

// ─────────────────────────────────────────────────────────────────────────
// Endpoint methods below are wired to real backend per the API handoff,
// but the corresponding adapters in src/lib/api-adapter.ts default to mocks
// until each feature's response shape is confirmed in production.
//
// To opt a feature into real-API mode at build time, set the corresponding
// VITE_USE_REAL_* env var in the workflow + .env.example. The adapter
// reads it and routes through these methods instead of the mock.
//
// TODO when shapes confirmed:
//   - Replace the broad `unknown` return types below with proper interfaces.
//   - Update mock-data.ts shapes to match where they diverge.
//   - Flip the relevant adapter to real-API by default.
// ─────────────────────────────────────────────────────────────────────────

// Favorites — backend POST/GET/DELETE under /favorites/, plus stats.
export interface FavoriteJokeDTO {
  id: number
  joke: Joke
  favorited_at: string
}

export const favoritesApi = {
  list: (params?: { tones?: string; page?: number }) =>
    api.get<PaginatedResponse<FavoriteJokeDTO>>('/favorites/', { params }),

  add: (jokeId: number) => api.post<FavoriteJokeDTO>('/favorites/', { joke: jokeId }),

  remove: (favoriteId: number) => api.delete(`/favorites/${favoriteId}/`),

  // Backend returns snake_case; adapter maps to camelCase.
  stats: () =>
    api.get<{ total_count: number; top_tone: string | null; this_week_count: number }>('/favorites/stats/'),
}

// Drafts — user's in-progress submissions.
export interface DraftJokeDTO {
  id: number
  text: string
  setup: string | null
  punchline: string | null
  format: { id: number; name: string; slug: string } | null
  age_rating: { id: number; name: string; slug: string } | null
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export const draftsApi = {
  list: () => api.get<PaginatedResponse<DraftJokeDTO>>('/jokes/my-drafts/'),

  get: (id: number) => api.get<DraftJokeDTO>(`/jokes/my-drafts/${id}/`),

  // POST /jokes/submit/ creates a new draft (per handoff). Adjust if backend
  // adds a separate POST /jokes/my-drafts/ endpoint later.
  create: (data: Partial<DraftJokeDTO>) => api.post<DraftJokeDTO>('/jokes/submit/', data),

  update: (id: number, data: Partial<DraftJokeDTO>) =>
    api.patch<DraftJokeDTO>(`/jokes/my-drafts/${id}/`, data),

  submit: (id: number) => api.post<DraftJokeDTO>(`/jokes/my-drafts/${id}/submit/`),

  delete: (id: number) => api.delete(`/jokes/my-drafts/${id}/`),
}

// User profile — extends the basic User from /auth/user/ with profile fields.
// TODO: confirm exact shape from /users/me/profile/ — listed activity/achievements
// shapes are speculative.
export interface UserProfileDTO {
  pk: number
  username: string
  email: string
  first_name: string
  last_name: string
  bio?: string | null
  avatar_url?: string | null
  joined_at?: string
  streak_days?: number
}

export interface ActivityItemDTO {
  id: number
  type: 'save' | 'submit' | 'rate' | 'share' | 'achievement'
  description: string
  created_at: string
}

export interface AchievementDTO {
  id: number
  name: string
  description: string
  icon: string | null
  earned_at: string | null
}

export const profileApi = {
  get: () => api.get<UserProfileDTO>('/users/me/profile/'),

  update: (patch: Partial<UserProfileDTO>) =>
    api.patch<UserProfileDTO>('/users/me/profile/', patch),

  activity: (limit?: number) =>
    api.get<PaginatedResponse<ActivityItemDTO>>('/users/me/activity/', { params: { limit } }),

  achievements: () => api.get<PaginatedResponse<AchievementDTO>>('/users/me/achievements/'),
}

// Preferences — separate from /auth/user/ profile fields.
// Two endpoint paths exist in the handoff: /users/me/preferences/ and
// /preferences/me/. Both wired here; pick one per backend convention.
export interface PreferencesDTO {
  tones?: string[]
  /** P1 synonym for `tones`. Both write paths accepted; new wins on conflict. */
  categories?: string[]
  age_rating?: string
  languages?: string[]
  humor_types?: string[]
  /** P1 synonyms */
  preferred_themes?: string[]
  preferred_categories?: string[]
  notifications?: {
    daily_joke?: boolean
    trending_alerts?: boolean
    collection_updates?: boolean
    email_digest?: boolean
  }
  privacy?: {
    public_profile?: boolean
    show_activity?: boolean
    share_analytics?: boolean
  }
  theme?: 'light' | 'dark' | 'system'
  /** P8: scheduling for the daily-joke ritual. */
  notification_enabled?: boolean
  notification_time?: string
  notification_days?: string[]
  streak_saver_enabled?: boolean
  /** Set true when /preferences/complete-onboarding/ is called (or directly here). */
  onboarding_completed?: boolean
}

export const preferencesApi = {
  get: () => api.get<PreferencesDTO>('/users/me/preferences/'),

  update: (patch: Partial<PreferencesDTO>) =>
    api.patch<PreferencesDTO>('/users/me/preferences/', patch),

  // /preferences/complete-onboarding/ is a one-shot flag; idempotent.
  completeOnboarding: () => api.post<{ detail: string }>('/preferences/complete-onboarding/'),
}

// Trending — verified backend shapes (jokes/views.py + serializers.py).
export interface TrendingJokeDTO {
  rank: number
  joke: Joke
  likes: number
  shares: number
  comments: number
  trending_since: string
}

export interface TrendingTagDTO {
  name: string
  slug: string
  count: number
  growth_percent: number
}

export interface RisingTagDTO {
  name: string
  slug: string
  growth_percent: number
}

export const trendingApi = {
  jokes: (period?: string) =>
    api.get<PaginatedResponse<TrendingJokeDTO>>('/jokes/trending/', { params: { period } }),

  tags: () => api.get<{ results: TrendingTagDTO[] }>('/tags/trending/'),

  risingTags: () => api.get<{ results: RisingTagDTO[] }>('/tags/rising/'),

  themes: () => api.get<{ results: string[] }>('/themes/popular/'),

  jokesters: (limit?: number) =>
    api.get<{ results: TopJokesterDTO[] }>('/users/top-jokesters/', { params: { limit } }),
}

// P10: top-jokester rows include 2 vibe pills.
export interface TopJokesterDTO {
  id: number
  name: string
  username: string
  avatar_url?: string | null
  punchline_count: number
  rank: number
  top_vibes: { slug: string; label: string; icon: string }[]
}

// ─────────────────────────────────────────────────────────────────────────
// P2 — Vibes (humor fingerprint)
// 12 catalog vibes; user picks 3-12 during onboarding.
// ─────────────────────────────────────────────────────────────────────────

export interface Vibe {
  slug: string
  label: string
  subtitle: string
  icon: string
  swatch_bg: string
  swatch_fg: string
  order: number
}

export interface UserVibe {
  vibe: Vibe
  weight: number
  created_at: string
}

export const vibesApi = {
  /** Catalog of all active vibes — no pagination. Cache for the session. */
  list: () => api.get<Vibe[]>('/vibes/'),

  /** Single vibe lookup. */
  get: (slug: string) => api.get<Vibe>(`/vibes/${slug}/`),

  /** Current user's selected vibes. */
  myVibes: () => api.get<UserVibe[]>('/users/me/vibes/'),

  /** Replace user's vibe selection atomically. Min 3, max 12. */
  setMyVibes: (slugs: string[]) =>
    api.put<UserVibe[]>('/users/me/vibes/', { slugs }),
}

// ─────────────────────────────────────────────────────────────────────────
// P3 — Mystery Box (variable reward, daily-capped)
// ─────────────────────────────────────────────────────────────────────────

export interface MysteryBoxStatus {
  rolls_used_today: number
  rolls_remaining_today: number
  max_per_day: number
}

export interface MysteryBoxRollResponse {
  joke: Joke
  rolls_remaining_today: number
  /** Optional: which vibe the joke was pulled from (null if global pool fallback). */
  source_vibe: { slug: string; label: string } | null
}

export const mysteryBoxApi = {
  status: () => api.get<MysteryBoxStatus>('/mystery-box/status/'),

  /** 200 with joke OR 429 (cap reached) OR 404 (pool exhausted). */
  roll: () => api.post<MysteryBoxRollResponse>('/mystery-box/roll/'),
}

// ─────────────────────────────────────────────────────────────────────────
// P4 — Reactions (4-emoji)
// ─────────────────────────────────────────────────────────────────────────

export type ReactionSlug = 'lol' | 'crying' | 'hmm' | 'eyeroll'

export interface ReactionCounts {
  lol: number
  crying: number
  hmm: number
  eyeroll: number
}

export interface ReactionResponse {
  my_reaction: ReactionSlug | null
  counts: ReactionCounts
}

export const reactionsApi = {
  /** Toggle off if same, switch if different. Returns updated state. */
  react: (jokeId: number, reaction: ReactionSlug) =>
    api.post<ReactionResponse>(`/jokes/${jokeId}/react/`, { reaction }),

  /** Get current reaction state — useful for hydrating the joke detail. */
  get: (jokeId: number) =>
    api.get<ReactionResponse>(`/jokes/${jokeId}/reactions/`),
}

// ─────────────────────────────────────────────────────────────────────────
// P5 — Activity log + recently-viewed
// Every authenticated GET /jokes/{id}/ logs a JokeView automatically.
// Pass ?source= so the backend knows the surface for analytics.
// ─────────────────────────────────────────────────────────────────────────

export type JokeSource = 'daily' | 'search' | 'explore' | 'mystery' | 'pack' | 'saved' | 'share' | 'other'

export interface RecentlyViewedItem {
  joke: Joke
  viewed_at: string
  source: JokeSource | null
}

export const activityApi = {
  recentlyViewed: (limit?: number) =>
    api.get<RecentlyViewedItem[]>('/users/me/recently-viewed/', { params: { limit } }),
}

// ─────────────────────────────────────────────────────────────────────────
// P6 — Streak (daily commitment with forgiveness)
// ─────────────────────────────────────────────────────────────────────────

export type StreakDayStatus = 'read' | 'frozen' | 'missed' | 'pending'

export interface StreakDay {
  date: string
  status: StreakDayStatus
}

export interface StreakState {
  current_count: number
  longest_count: number
  last_active_date: string | null
  freeze_days_available: number
  freezes_used_total: number
  started_at: string | null
  /** Last 14 days of activity for the streak rail visualization. */
  last_14_days: StreakDay[]
  /** True when the user hasn't read today and it's past 8 PM UTC. */
  streak_at_risk_today: boolean
}

export const streakApi = {
  get: () => api.get<StreakState>('/users/me/streak/'),

  /** Manually use a freeze day (vacation mode). 400 if none available. */
  freeze: () => api.post<StreakState>('/users/me/streak/freeze/'),

  /** Undo today's accidental freeze. 400 if today wasn't frozen. */
  unfreeze: () => api.post<StreakState>('/users/me/streak/freeze/remove/'),
}

// ─────────────────────────────────────────────────────────────────────────
// P7 — Joke Packs (editorial bundles)
// ─────────────────────────────────────────────────────────────────────────

export interface PackProgress {
  last_read_entry: number
  total_entries: number
  completed_at: string | null
  started_at: string
}

export interface JokePack {
  slug: string
  title: string
  subtitle: string
  description: string
  cover_color: string
  is_featured: boolean
  joke_count: number
  publish_at: string
  expires_at: string | null
  /** Null for anonymous or new-to-pack users. */
  user_progress: PackProgress | null
}

export interface JokePackEntry {
  order: number
  joke: Joke
}

export interface JokePackDetail extends JokePack {
  jokes: JokePackEntry[]
}

export const packsApi = {
  list: () => api.get<PaginatedResponse<JokePack>>('/packs/'),

  get: (slug: string) => api.get<JokePackDetail>(`/packs/${slug}/`),

  /** Single featured pack for Today's Weekly Special. 404 if none. */
  featured: () => api.get<JokePackDetail>('/packs/featured/'),

  /** Record progress at entry N. Last entry sets completed_at. */
  recordProgress: (slug: string, entryOrder: number) =>
    api.post<PackProgress>(`/packs/${slug}/progress/`, { entry_order: entryOrder }),

  /** Packs the user has started but not completed (Continue mid-sip surface). */
  inProgress: () => api.get<JokePack[]>('/users/me/packs/in-progress/'),
}

// ─────────────────────────────────────────────────────────────────────────
// P8 — Today Status (replaces 9 AM cron — no scheduled tasks in CR setup)
// ─────────────────────────────────────────────────────────────────────────

export interface TodayStatus {
  daily_joke_due: boolean
  has_read_today: boolean
  today_is_a_notification_day: boolean
  now_past_notification_time: boolean
}

export const todayStatusApi = {
  get: () => api.get<TodayStatus>('/users/me/today-status/'),
}

// ─────────────────────────────────────────────────────────────────────────
// P9 — Insights (taste profile + tomorrow teaser)
// ─────────────────────────────────────────────────────────────────────────

export type TastePeriod = 'month' | 'week' | 'all'

export interface TasteAggregate {
  label: string
  count: number
  slug?: string
}

export interface TasteProfile {
  period: TastePeriod
  jokes_read: number
  jokes_saved: number
  /** Hour of day 0-23, null if no reads yet. */
  peak_read_hour: number | null
  top_vibe: { slug: string; label: string; icon: string } | null
  top_themes: TasteAggregate[]
  top_categories: TasteAggregate[]
  top_formats: TasteAggregate[]
  /** 28 ints — daily reads count for the sparkline. */
  daily_reads_28d: number[]
}

export interface DailyJokeToday {
  id: number
  joke: Joke
  date: string
  /** P9: "Vol. I · No. 042" newspaper-style label. */
  issue_label: string
  delivered_at: string
}

export interface TomorrowTeaser {
  /** 12-word truncated text for the blurred teaser. */
  preview: string
  /** Format slug only — backend returns a plain string (e.g. "anti", "story"). */
  format: string
  issue_label: string
  date: string
}

export const insightsApi = {
  tasteProfile: (period: TastePeriod = 'month') =>
    api.get<TasteProfile>('/users/me/taste-profile/', { params: { period } }),

  /** Replaces existing daily-jokes/today/ shape with the augmented one. */
  todayAugmented: () => api.get<DailyJokeToday>('/daily-jokes/today/'),

  /** Lazy-generates tomorrow's row inline if it doesn't exist yet. */
  tomorrow: () => api.get<TomorrowTeaser>('/daily-jokes/tomorrow/'),
}

// ─────────────────────────────────────────────────────────────────────────
// Joke retrieval with `?source=` for activity logging.
// ─────────────────────────────────────────────────────────────────────────

export const jokeDetailApi = {
  /** Always pass `source` when retrieving a joke from any surface. */
  get: (id: number, source?: JokeSource) =>
    api.get<Joke>(`/jokes/${id}/`, { params: source ? { source } : undefined }),
}
