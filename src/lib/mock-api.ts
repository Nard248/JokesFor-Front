import type { ContentSelection } from '@/features/discovery/selection'
import { matchesContentSelection } from '@/features/discovery/matches'
import type { Joke, JokeSearchParams, PaginatedResponse, Collection, SavedJoke, CreatorInsights, InsightsPeriod, FollowStatus, CreatorProfile, BillingPlan, MySubscription, BillingEntitlements, CheckoutSessionResponse, PortalSessionResponse, TipCheckoutInput, TipCheckoutResponse, TipsSummary, Tip } from './api'
import { TIP_TIERS } from './api'
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
  mockCreatorProfile,
  mockBillingPlans,
  mockMySubscription,
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

function delay(ms = 400, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Search cancelled', 'AbortError'))
      return
    }
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('Search cancelled', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, ms + Math.random() * 400)
    signal?.addEventListener('abort', abort, { once: true })
  })
}

const searchSlugs = (value?: string) => (value ?? '').toLowerCase().split(',').map((slug) => slug.trim()).filter(Boolean)

/** Lightweight preview matching; production relevance is computed by PostgreSQL. */
function matchesSearchText(joke: Joke, query: string): boolean {
  const taxa = [...(joke.categories ?? joke.tones), ...(joke.themes ?? joke.context_tags), ...joke.culture_tags]
  const text = [
    joke.text, joke.setup, joke.punchline, ...(joke.lines ?? []),
    ...taxa.flatMap((taxon) => [taxon.name, taxon.slug.replace(/[-_]/g, ' ')]),
    joke.format.name, joke.format.slug.replace(/[-_]/g, ' '), joke.language.name, joke.language.code,
    joke.cultural_note, ...(joke.countries ?? []).flatMap((country) => [country.name, country.native_name, country.code]),
  ].filter(Boolean).join(' ').toLowerCase()
  // Respect plain words, quoted phrases, OR and excluded words in preview mode.
  // This intentionally does not attempt to reproduce PostgreSQL's stemming.
  const groups: string[][] = [[]]
  for (const token of query.match(/-?"[^"]+"|\S+/g) ?? []) {
    if (token === 'OR') groups.push([])
    else groups[groups.length - 1].push(token)
  }
  return groups.some((group) => group.length > 0 && group.every((token) => {
    const excluded = token.startsWith('-')
    const term = (excluded ? token.slice(1) : token).replace(/^"|"$/g, '').toLowerCase()
    return term ? excluded ? !text.includes(term) : text.includes(term) : true
  }))
}

export const mockJokesApi = {
  search: async (params: JokeSearchParams, signal?: AbortSignal): Promise<PaginatedResponse<Joke>> => {
    await delay(400, signal)
    let filtered = mockJokes.filter((joke) => matchesContentSelection(joke, params))

    if (params.q?.trim()) {
      filtered = filtered.filter((joke) => matchesSearchText(joke, params.q!.trim()))
    }
    const categories = searchSlugs(params.categories ?? params.tones)
    if (categories.length) {
      filtered = filtered.filter((joke) => (joke.categories ?? joke.tones).some((taxon) => categories.includes(taxon.slug)))
    }
    if (params.age_rating) {
      const arSlug = params.age_rating.toLowerCase()
      filtered = filtered.filter((j) => j.age_rating.slug === arSlug)
    }
    const themes = searchSlugs(params.themes ?? params.context_tags)
    if (themes.length) {
      filtered = filtered.filter((joke) => (joke.themes ?? joke.context_tags).some((taxon) => themes.includes(taxon.slug)))
    }
    const formats = searchSlugs(params.joke_format)
    if (formats.length) filtered = filtered.filter((joke) => formats.includes(joke.format.slug))
    if (params.ordering === '-created_at' || !params.q?.trim()) {
      filtered.sort((left, right) => right.created_at.localeCompare(left.created_at) || right.id - left.id)
    }
    return paginateMock(filtered, params.page || 1, params.page_size || 10)
  },

  getById: async (id: number): Promise<Joke> => {
    await delay(200)
    const joke = mockJokes.find((j) => j.id === id)
    if (!joke) throw new Error('Joke not found')
    return joke
  },

  getRandom: async (params?: Partial<ContentSelection>): Promise<Joke> => {
    await delay(200)
    const eligible = mockJokes.filter((joke) => matchesContentSelection(joke, params))
    if (!eligible.length) throw new Error('No jokes match this language, country and culture.')
    return eligible[Math.floor(Math.random() * eligible.length)]
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
  getToday: async (params?: Partial<ContentSelection>): Promise<{ joke: Joke; date: string }> => {
    await delay(300)
    if (!matchesContentSelection(mockDailyJoke.joke, params)) throw new Error('No daily joke matches this selection.')
    return mockDailyJoke
  },

  getHistory: async (params?: Partial<ContentSelection>): Promise<Array<{ joke: Joke; date: string }>> => {
    await delay()
    return mockDailyJokeHistory.filter((entry) => matchesContentSelection(entry.joke, params))
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

// ── Follows (stateful) ──
const followedCreators = new Set<number>()

export const mockFollowsApi = {
  follow: async (id: number): Promise<FollowStatus> => {
    await delay(300)
    followedCreators.add(id)
    return { is_following: true, follower_count: 43 }
  },
  unfollow: async (id: number): Promise<void> => {
    await delay(300)
    followedCreators.delete(id)
  },
  status: async (id: number): Promise<FollowStatus> => {
    await delay(200)
    return { is_following: followedCreators.has(id), follower_count: followedCreators.has(id) ? 43 : 42 }
  },
}

export const mockCreatorProfileApi = {
  get: async (id: number): Promise<CreatorProfile> => {
    await delay(400)
    const is_following = followedCreators.has(id)
    return {
      ...mockCreatorProfile,
      id,
      follower_count: is_following ? 43 : 42,
      is_following,
    }
  },
}

// ── Billing (stateful: tracks current plan for demo) ──
let mockCurrentPlanSlug = mockMySubscription.plan_slug

export const mockBillingApi = {
  listPlans: async (): Promise<BillingPlan[]> => {
    await delay(300)
    return [...mockBillingPlans]
  },

  mySubscription: async (): Promise<MySubscription> => {
    await delay(200)
    const plan = mockBillingPlans.find((p) => p.slug === mockCurrentPlanSlug) ?? mockBillingPlans[0]
    return {
      plan_slug: plan.slug,
      plan_name: plan.name,
      status: plan.slug === 'free' ? 'free' : 'active',
      current_period_end: plan.slug === 'free' ? null : '2026-07-19T00:00:00Z',
      cancel_at_period_end: false,
      stripe_customer_id: plan.slug === 'free' ? null : 'cus_mock123',
    }
  },

  entitlements: async (): Promise<BillingEntitlements> => {
    await delay(200)
    const plan = mockBillingPlans.find((p) => p.slug === mockCurrentPlanSlug) ?? mockBillingPlans[0]
    return {
      plan: plan.slug,
      features: {
        creator_analytics: plan.features.creator_analytics as boolean,
        daily_joke_preview: plan.features.daily_joke_preview as boolean,
        mature_content_addon: plan.features.mature_content_addon as boolean,
      },
      limits: {
        mystery_box_rolls_per_day: (plan.limits.mystery_box_rolls_per_day as number | null) ?? null,
        submissions_per_day: (plan.limits.submissions_per_day as number | null) ?? null,
        daily_jokes_per_day: (plan.limits.daily_jokes_per_day as number | null) ?? null,
        daily_joke_history_days: (plan.limits.daily_joke_history_days as number | null) ?? null,
      },
    }
  },

  createCheckoutSession: async (plan_slug: string): Promise<CheckoutSessionResponse> => {
    await delay(400)
    const plan = mockBillingPlans.find((p) => p.slug === plan_slug)
    if (!plan) throw Object.assign(new Error('Not found'), { response: { status: 404 } })
    // In mock mode, simulate a successful demo redirect URL
    return { url: `https://checkout.stripe.com/demo?plan=${plan_slug}` }
  },

  createPortalSession: async (): Promise<PortalSessionResponse> => {
    await delay(400)
    if (mockCurrentPlanSlug === 'free') {
      throw Object.assign(new Error('No billing account'), { response: { status: 404 } })
    }
    return { url: 'https://billing.stripe.com/demo/portal' }
  },
}

// Exported so tests can reset plan state
export function _resetMockBillingPlan(slug = 'free') {
  mockCurrentPlanSlug = slug
}

// ── Tips (stateful: tracks sent tips for the demo "my tips" history) ──
const mockSentTips: Tip[] = []
let mockTipIdSeq = 9000

export const mockTipsApi = {
  createCheckout: async (input: TipCheckoutInput): Promise<TipCheckoutResponse> => {
    await delay(400)
    if (!(TIP_TIERS as readonly number[]).includes(input.amount_cents)) {
      throw Object.assign(new Error('Invalid amount'), { response: { status: 400, data: { detail: 'Invalid tip amount' } } })
    }
    if (input.creator_id === mockUser.pk) {
      throw Object.assign(new Error('Cannot tip yourself'), { response: { status: 400, data: { detail: 'Cannot tip yourself' } } })
    }
    const tip_id = mockTipIdSeq++
    mockSentTips.push({
      id: tip_id,
      creator: input.creator_id,
      joke: input.joke_id ?? null,
      amount_cents: input.amount_cents,
      currency: 'usd',
      status: 'pending',
      created_at: new Date().toISOString(),
      completed_at: null,
    })
    return { checkout_url: `https://checkout.stripe.com/demo?tip=${input.amount_cents}`, tip_id }
  },

  // Public endpoint — {count:0,total_cents:0} for an unknown/zero creator
  // (graceful-absent). The demo creator profile (id 7) shows a nonzero
  // received summary so the panel is visible in the mock walkthrough.
  creatorSummary: async (creatorId: number): Promise<TipsSummary> => {
    await delay(250)
    if (creatorId === mockCreatorProfile.id) {
      return { count: 12, total_cents: 3400 }
    }
    return { count: 0, total_cents: 0 }
  },

  mySentTips: async (): Promise<PaginatedResponse<Tip>> => {
    await delay(250)
    return { count: mockSentTips.length, next: null, previous: null, results: [...mockSentTips].reverse() }
  },
}
