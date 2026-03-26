import type { Joke, JokeSearchParams, PaginatedResponse, Collection, SavedJoke } from './api'
import {
  mockJokes,
  mockDailyJoke,
  mockDailyJokeHistory,
  mockCollections,
  mockSavedJokes,
  mockUser,
  paginateMock,
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
          j.punchline?.toLowerCase().includes(q)
      )
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
