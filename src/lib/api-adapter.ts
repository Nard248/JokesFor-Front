import type { Joke, JokeSearchParams, PaginatedResponse, Collection, SavedJoke } from './api'
import { jokesApi, dailyJokeApi, collectionsApi, savedJokesApi } from './api'
import {
  mockJokesApi,
  mockDailyJokeApi,
  mockCollectionsApi,
  mockSavedJokesApi,
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
