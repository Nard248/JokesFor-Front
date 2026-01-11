import { api } from './axios'

// Auth types
export interface User {
  pk: number
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
  refresh?: string // May not be returned if using httpOnly cookies
  user?: User
}

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login/', credentials),

  register: (credentials: RegisterCredentials) =>
    api.post<AuthResponse>('/auth/registration/', credentials),

  logout: () =>
    api.post('/auth/logout/'),

  getUser: () =>
    api.get<User>('/auth/user/'),

  refreshToken: () =>
    api.post<{ access: string }>('/auth/token/refresh/'),
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
