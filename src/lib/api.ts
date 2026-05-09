import { api } from './axios'

// Auth types
export interface User {
  pk: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password1: string
  password2: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface GoogleAuthRequest {
  code: string
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
    api.post<AuthResponse>('/auth/registration/', credentials),

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

  verifyEmail: (key: string) =>
    api.post<{ detail: string }>('/auth/registration/verify-email/', { key }),

  resendVerification: (email: string) =>
    api.post<{ detail: string }>('/auth/registration/resend-email/', { email }),
}

// Joke types (from backend models)
export interface Joke {
  id: number
  text: string
  setup: string | null
  punchline: string | null
  format: { id: number; name: string; slug: string }
  age_rating: { id: number; name: string; slug: string; min_age: number }
  tones: Array<{ id: number; name: string; slug: string }>
  context_tags: Array<{ id: number; name: string; slug: string }>
  culture_tags: Array<{ id: number; name: string; slug: string }>
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
  culture_tags?: string
  language?: string
  page?: number
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
  added_at: string
}

export const favoritesApi = {
  list: (params?: { tones?: string; page?: number }) =>
    api.get<PaginatedResponse<FavoriteJokeDTO>>('/favorites/', { params }),

  add: (jokeId: number) => api.post<FavoriteJokeDTO>('/favorites/', { joke: jokeId }),

  remove: (favoriteId: number) => api.delete(`/favorites/${favoriteId}/`),

  // Per backend handoff: { totalCount, topTone, thisWeekCount } — confirm shape.
  stats: () =>
    api.get<{ totalCount: number; topTone: string; thisWeekCount: number }>('/favorites/stats/'),
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
  age_rating?: string
  languages?: string[]
  humor_types?: string[]
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
}

export const preferencesApi = {
  get: () => api.get<PreferencesDTO>('/users/me/preferences/'),

  update: (patch: Partial<PreferencesDTO>) =>
    api.patch<PreferencesDTO>('/users/me/preferences/', patch),

  // /preferences/complete-onboarding/ is a one-shot flag; idempotent.
  completeOnboarding: () => api.post<{ detail: string }>('/preferences/complete-onboarding/'),
}

// Trending — multiple endpoints per handoff. Shapes are speculative; each
// returns a list of items. Adapters stay mock-only until backend confirms.
export const trendingApi = {
  jokes: (period?: string) =>
    api.get<unknown>('/jokes/trending/', { params: { period } }),

  collections: () => api.get<unknown>('/collections/trending/'),

  tags: () => api.get<unknown>('/tags/trending/'),

  risingTags: () => api.get<unknown>('/tags/rising/'),

  themes: () => api.get<unknown>('/themes/popular/'),

  jokesters: (limit?: number) =>
    api.get<unknown>('/users/top-jokesters/', { params: { limit } }),
}
