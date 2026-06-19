import type { User, Joke, Collection, SavedJoke, PaginatedResponse, CreatorInsights, CreatorProfile, PublicUser, BillingPlan, MySubscription, BillingEntitlements } from './api'

// ── Mock User ──
export const mockUser: User = {
  pk: 1,
  username: 'laughmaster',
  email: 'laughmaster@jokesfor.com',
  first_name: 'Laugh',
  last_name: 'Master',
}

// ── Helper to build Joke objects ──
function makeJoke(overrides: Partial<Joke> & { id: number; text: string }): Joke {
  return {
    setup: null,
    punchline: null,
    format: { id: 1, name: 'One-Liner', slug: 'one_liner' },
    age_rating: { id: 2, name: 'Family Friendly', slug: 'family_friendly', min_age: 0 },
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [{ id: 1, name: 'General', slug: 'general' }],
    culture_tags: [],
    language: { id: 1, name: 'English', code: 'en' },
    source: 'community',
    share_image_url: null,
    created_at: '2025-10-01T12:00:00Z',
    ...overrides,
  }
}

// ── Mock Jokes (matching Figma designs) ──
export const mockJokes: Joke[] = [
  makeJoke({
    id: 1,
    text: '"Why don\'t scientists trust atoms anymore?" "Because they make up everything!"',
    setup: 'Why don\'t scientists trust atoms anymore?',
    punchline: 'Because they make up everything!',
    tones: [{ id: 2, name: 'Dad Joke', slug: 'dad_joke' }],
    context_tags: [{ id: 2, name: 'School', slug: 'school' }],
  }),
  makeJoke({
    id: 2,
    text: 'What do you call a fish with no eyes? A fsh!',
    setup: 'What do you call a fish with no eyes?',
    punchline: 'A fsh!',
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [{ id: 3, name: 'Kids', slug: 'kids' }, { id: 4, name: 'Animal Humor', slug: 'animal_humor' }],
    age_rating: { id: 1, name: 'Kid Safe', slug: 'kid_safe', min_age: 6 },
  }),
  makeJoke({
    id: 3,
    text: 'My wife told me to stop impersonating a flamingo. I had to put my foot down.',
    setup: 'My wife told me to stop impersonating a flamingo.',
    punchline: 'I had to put my foot down.',
    tones: [{ id: 2, name: 'Dad Joke', slug: 'dad_joke' }],
    context_tags: [{ id: 5, name: 'Marriage', slug: 'marriage' }, { id: 6, name: 'Relationships', slug: 'relationships' }],
  }),
  makeJoke({
    id: 4,
    text: 'Why did the computer show up late to work? It had a hard drive!',
    setup: 'Why did the computer show up late to work?',
    punchline: 'It had a hard drive!',
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [{ id: 7, name: 'Work', slug: 'work' }],
  }),
  makeJoke({
    id: 5,
    text: 'I told my boss that three companies were after me and I needed a raise. He asked which ones. I said: "The electric company, the gas company, and the water company."',
    setup: 'I told my boss that three companies were after me and I needed a raise.',
    punchline: 'He asked which ones. I said: "The electric company, the gas company, and the water company."',
    tones: [{ id: 3, name: 'Sarcastic', slug: 'sarcastic' }],
    context_tags: [{ id: 7, name: 'Work', slug: 'work' }, { id: 8, name: 'Office', slug: 'office' }],
    format: { id: 2, name: 'Short Story', slug: 'short_story' },
  }),
  makeJoke({
    id: 6,
    text: 'My teacher told me to have a good day. So I went home!',
    setup: 'My teacher told me to have a good day.',
    punchline: 'So I went home!',
    tones: [{ id: 4, name: 'Classic', slug: 'classic' }],
    context_tags: [{ id: 9, name: 'School Life', slug: 'school_life' }],
    age_rating: { id: 1, name: 'Kid Safe', slug: 'kid_safe', min_age: 6 },
  }),
  makeJoke({
    id: 7,
    text: 'Team work is important; it helps to put the blame on someone else.',
    setup: null,
    punchline: null,
    tones: [{ id: 3, name: 'Sarcastic', slug: 'sarcastic' }],
    context_tags: [{ id: 7, name: 'Work', slug: 'work' }],
  }),
  makeJoke({
    id: 8,
    text: 'I\'m afraid for the calendar. Its days are numbered.',
    setup: 'I\'m afraid for the calendar.',
    punchline: 'Its days are numbered.',
    tones: [{ id: 2, name: 'Dad Joke', slug: 'dad_joke' }],
    context_tags: [{ id: 1, name: 'General', slug: 'general' }],
  }),
  makeJoke({
    id: 9,
    text: 'My boss told me to change the WiFi password to "Incorrect"...',
    setup: 'My boss told me to change the WiFi password to "Incorrect"...',
    punchline: 'So whenever someone asks, I can say "The password is Incorrect."',
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [{ id: 7, name: 'Work', slug: 'work' }],
  }),
  makeJoke({
    id: 10,
    text: 'I\'m terrified of the invisible man. I\'m not sure what he looks like...',
    setup: 'I\'m terrified of the invisible man.',
    punchline: 'I\'m not sure what he looks like...',
    tones: [{ id: 2, name: 'Dad Joke', slug: 'dad_joke' }],
  }),
  makeJoke({
    id: 11,
    text: 'Parallel lines have so much in common. It\'s a shame they\'ll never meet.',
    setup: 'Parallel lines have so much in common.',
    punchline: 'It\'s a shame they\'ll never meet.',
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [{ id: 2, name: 'School', slug: 'school' }],
  }),
  makeJoke({
    id: 12,
    text: 'Why do programmers always mix up Christmas and Halloween? Because Oct 31 = Dec 25.',
    setup: 'Why do programmers always mix up Christmas and Halloween?',
    punchline: 'Because Oct 31 = Dec 25.',
    tones: [{ id: 5, name: 'Geeky', slug: 'geeky' }],
    context_tags: [{ id: 10, name: 'Tech', slug: 'tech' }],
  }),
  makeJoke({
    id: 13,
    text: 'Why don\'t skeletons fight each other? They don\'t have the guts.',
    setup: 'Why don\'t skeletons fight each other?',
    punchline: 'They don\'t have the guts.',
    tones: [{ id: 2, name: 'Dad Joke', slug: 'dad_joke' }],
    age_rating: { id: 1, name: 'Kid Safe', slug: 'kid_safe', min_age: 8 },
  }),
  makeJoke({
    id: 14,
    text: 'I asked the computer programmer why he was so tired. He said he had too many bytes.',
    setup: 'I asked the computer programmer why he was so tired.',
    punchline: 'He said he had too many bytes.',
    tones: [{ id: 5, name: 'Geeky', slug: 'geeky' }],
    context_tags: [{ id: 10, name: 'Tech', slug: 'tech' }],
  }),
  makeJoke({
    id: 15,
    text: 'What do you call a dog that does magic tricks? A labracadabrador.',
    setup: 'What do you call a dog that does magic tricks?',
    punchline: 'A labracadabrador.',
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [{ id: 4, name: 'Animal Humor', slug: 'animal_humor' }],
    age_rating: { id: 1, name: 'Kid Safe', slug: 'kid_safe', min_age: 6 },
  }),
  makeJoke({
    id: 16,
    text: 'What do you call a dinosaur that is sleeping? A dino-snore.',
    setup: 'What do you call a dinosaur that is sleeping?',
    punchline: 'A dino-snore.',
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [{ id: 11, name: 'Educational', slug: 'educational' }],
    age_rating: { id: 1, name: 'Kid Safe', slug: 'kid_safe', min_age: 6 },
  }),
  makeJoke({
    id: 17,
    text: 'Why did the music teacher need a ladder? To reach the high notes!',
    setup: 'Why did the music teacher need a ladder?',
    punchline: 'To reach the high notes!',
    tones: [{ id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [{ id: 9, name: 'School Life', slug: 'school_life' }],
    age_rating: { id: 1, name: 'Kid Safe', slug: 'kid_safe', min_age: 6 },
  }),
  makeJoke({
    id: 18,
    text: 'How many programmers does it take to change a light bulb? None, that\'s a hardware problem.',
    setup: 'How many programmers does it take to change a light bulb?',
    punchline: 'None, that\'s a hardware problem.',
    tones: [{ id: 5, name: 'Geeky', slug: 'geeky' }],
    context_tags: [{ id: 10, name: 'Tech', slug: 'tech' }],
  }),
  makeJoke({
    id: 19,
    text: "I'm on a seafood diet. I see food and I eat it.",
    setup: "I'm on a seafood diet.",
    punchline: 'I see food and I eat it.',
    tones: [{ id: 4, name: 'Classic', slug: 'classic' }, { id: 1, name: 'Punny', slug: 'punny' }],
    context_tags: [{ id: 12, name: 'Fun', slug: 'fun' }],
  }),
  makeJoke({
    id: 20,
    text: 'My boss told me to have a good day. So I went home!',
    setup: 'My boss told me to have a good day.',
    punchline: 'So I went home!',
    tones: [{ id: 3, name: 'Sarcastic', slug: 'sarcastic' }],
    context_tags: [{ id: 8, name: 'Office', slug: 'office' }],
  }),
]

// ── Daily Joke ──
export const mockDailyJoke = {
  joke: mockJokes[0],
  date: new Date().toISOString().split('T')[0],
}

export const mockDailyJokeHistory = mockJokes.slice(0, 7).map((joke, i) => ({
  joke,
  date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
}))

// ── Collections ──
export const mockCollections: Collection[] = [
  { id: 1, name: 'Work Icebreakers', is_default: false, joke_count: 42, created_at: '2025-09-01T00:00:00Z' },
  { id: 2, name: 'Dad Jokes', is_default: false, joke_count: 128, created_at: '2025-09-05T00:00:00Z' },
  { id: 3, name: 'Quick Hits', is_default: false, joke_count: 24, created_at: '2025-09-10T00:00:00Z' },
  { id: 4, name: 'The All-Time Classics', is_default: true, joke_count: 42, created_at: '2025-08-01T00:00:00Z' },
  { id: 5, name: 'One-Liners', is_default: false, joke_count: 36, created_at: '2025-09-15T00:00:00Z' },
  { id: 6, name: 'Work Humor', is_default: false, joke_count: 18, created_at: '2025-09-20T00:00:00Z' },
  { id: 7, name: 'Archive', is_default: false, joke_count: 204, created_at: '2025-08-15T00:00:00Z' },
]

// ── Saved Jokes ──
export const mockSavedJokes: SavedJoke[] = [
  { id: 1, joke: mockJokes[8], collection: 1, note: null, saved_at: '2025-10-12T00:00:00Z' },
  { id: 2, joke: mockJokes[9], collection: 2, note: null, saved_at: '2025-10-09T00:00:00Z' },
  { id: 3, joke: mockJokes[10], collection: 3, note: null, saved_at: '2025-09-28T00:00:00Z' },
  { id: 4, joke: mockJokes[11], collection: 1, note: null, saved_at: '2025-09-15T00:00:00Z' },
  { id: 5, joke: mockJokes[0], collection: 2, note: null, saved_at: '2025-10-14T00:00:00Z' },
  { id: 6, joke: mockJokes[13], collection: 1, note: null, saved_at: '2025-10-08T00:00:00Z' },
  { id: 7, joke: mockJokes[14], collection: 4, note: null, saved_at: '2025-10-01T00:00:00Z' },
]

// ── Supplementary data for Home page ──

export interface VibeCardData {
  id: string
  title: string
  gradient: string
  icon: string
}

export const mockVibeCards: VibeCardData[] = [
  { id: 'wholesome', title: 'Wholesome & Pure', gradient: 'from-purple-400 to-purple-600', icon: '💜' },
  { id: 'quick-puns', title: 'Quick Puns', gradient: 'from-lime-300 to-lime-500', icon: '⚡' },
  { id: 'classic-dad', title: 'Classic Dad', gradient: 'from-amber-300 to-amber-500', icon: '👴' },
]

export interface TopJokester {
  id: number
  name: string
  punchlineCount: number
  rank: number
  avatarUrl?: string
}

export const mockTopJokesters: TopJokester[] = [
  { id: 1, name: 'Uncle Jerry', punchlineCount: 1240, rank: 1 },
  { id: 2, name: 'The Pun Queen', punchlineCount: 956, rank: 2 },
  { id: 3, name: 'DadBot 3000', punchlineCount: 821, rank: 3 },
]

export const mockPopularThemes = [
  'Coding Humor',
  'School Bus Jokes',
  'Space Puns',
  'Coffee Junkies',
  'Fitness Fails',
  'Pet Parents',
]

export const mockHotNowTags = ['Dad Jokes', 'Classroom Humor', 'Tech Puns']

export const mockTrendingTags = ['Classroom Fun', 'Office Icebreakers', 'Dad Jokes']

// ── Mock authors for display ──
export interface MockAuthor {
  username: string
  initials: string
  color: string
}

export const mockAuthors: Record<number, MockAuthor> = {
  1: { username: '@joke_master', initials: 'JD', color: '#6A1CF6' },
  2: { username: '@FunnyFinn', initials: 'FF', color: '#7C3AED' },
  3: { username: '@CorporateClown', initials: 'CC', color: '#AC8EFF' },
  4: { username: '@school_kid', initials: 'SK', color: '#CAFD00' },
  5: { username: '@office_legend', initials: 'OL', color: '#FFC965' },
  6: { username: '@HumorProf', initials: 'HP', color: '#6A1CF6' },
  7: { username: '@anonymous', initials: 'A', color: '#A3E635' },
  8: { username: '@StandingTall', initials: 'ST', color: '#7C3AED' },
  9: { username: '@Mike The Punner', initials: 'MP', color: '#6A1CF6' },
}

// ── Trending data ──
export interface TrendingTag {
  name: string
  count: number
  growth: number // percentage
}

export const mockTrendingTagsWithStats: TrendingTag[] = [
  { name: 'Dad Jokes', count: 2400, growth: 42 },
  { name: 'Office Humor', count: 1800, growth: 28 },
  { name: 'Tech Puns', count: 1200, growth: 65 },
  { name: 'Classroom Fun', count: 980, growth: 15 },
  { name: 'Animal Humor', count: 750, growth: 33 },
  { name: 'Marriage Jokes', count: 620, growth: 12 },
]

export const mockRisingTopics = [
  { name: 'AI Humor', growth: 120 },
  { name: 'Remote Work', growth: 85 },
  { name: 'Gen Z Slang', growth: 72 },
  { name: 'Coffee Addiction', growth: 58 },
  { name: 'Gym Fails', growth: 45 },
]

// Trending jokes = existing jokes reordered with engagement stats
export interface TrendingJoke {
  joke: Joke
  rank: number
  likes: number
  shares: number
  comments: number
  trendingSince: string
}

export const mockTrendingJokes: TrendingJoke[] = [
  { joke: mockJokes[0], rank: 1, likes: 4200, shares: 1800, comments: 342, trendingSince: '2 hours ago' },
  { joke: mockJokes[2], rank: 2, likes: 3100, shares: 1200, comments: 284, trendingSince: '5 hours ago' },
  { joke: mockJokes[4], rank: 3, likes: 2800, shares: 980, comments: 156, trendingSince: '8 hours ago' },
  { joke: mockJokes[7], rank: 4, likes: 2400, shares: 870, comments: 132, trendingSince: '12 hours ago' },
  { joke: mockJokes[12], rank: 5, likes: 2100, shares: 760, comments: 98, trendingSince: '1 day ago' },
  { joke: mockJokes[3], rank: 6, likes: 1900, shares: 650, comments: 87, trendingSince: '1 day ago' },
  { joke: mockJokes[10], rank: 7, likes: 1600, shares: 520, comments: 73, trendingSince: '2 days ago' },
  { joke: mockJokes[18], rank: 8, likes: 1400, shares: 480, comments: 61, trendingSince: '2 days ago' },
]

// ── Favorites ──
export interface FavoriteJoke {
  joke: Joke
  favoritedAt: string
}

export const mockFavorites: FavoriteJoke[] = [
  { joke: mockJokes[0], favoritedAt: '2025-10-14T10:30:00Z' },
  { joke: mockJokes[2], favoritedAt: '2025-10-13T15:20:00Z' },
  { joke: mockJokes[4], favoritedAt: '2025-10-12T09:00:00Z' },
  { joke: mockJokes[7], favoritedAt: '2025-10-11T18:45:00Z' },
  { joke: mockJokes[10], favoritedAt: '2025-10-10T11:30:00Z' },
  { joke: mockJokes[12], favoritedAt: '2025-10-09T14:15:00Z' },
  { joke: mockJokes[15], favoritedAt: '2025-10-08T08:00:00Z' },
  { joke: mockJokes[18], favoritedAt: '2025-10-07T20:30:00Z' },
  { joke: mockJokes[3], favoritedAt: '2025-10-06T12:00:00Z' },
  { joke: mockJokes[5], favoritedAt: '2025-10-05T16:45:00Z' },
]

// ── Drafts ──
export interface DraftJoke {
  id: number
  setup: string
  punchline: string
  format: string
  status: 'draft' | 'pending' | 'published' | 'rejected'
  tones: string[]
  lastEditedAt: string
  likes?: number
  rejectionReason?: string
}

export const mockDrafts: DraftJoke[] = [
  {
    id: 101,
    setup: "Why don't eggs tell jokes?",
    punchline: "They'd crack each other up!",
    format: 'Setup & Punchline',
    status: 'draft',
    tones: ['Dad Joke', 'Punny'],
    lastEditedAt: '2025-10-14T16:00:00Z',
  },
  {
    id: 102,
    setup: 'A programmer walks into a bar...',
    punchline: 'He orders 1 beer. Then 2 beers. Then 4. Then 8. Then 16. Then he crashes.',
    format: 'Short Story',
    status: 'pending',
    tones: ['Geeky', 'Sarcastic'],
    lastEditedAt: '2025-10-13T10:30:00Z',
  },
  {
    id: 103,
    setup: 'My dog ate my homework.',
    punchline: "He's a very literal Lab Retriever.",
    format: 'Setup & Punchline',
    status: 'published',
    tones: ['Dad Joke', 'Punny'],
    lastEditedAt: '2025-10-11T08:00:00Z',
    likes: 42,
  },
  {
    id: 104,
    setup: 'I tried to write a joke about paper.',
    punchline: "It was tearable.",
    format: 'One-Liner',
    status: 'rejected',
    tones: ['Punny'],
    lastEditedAt: '2025-10-10T14:00:00Z',
    rejectionReason: 'Too similar to an existing joke in our database.',
  },
]

// ── Profile & Activity ──
export interface UserProfile {
  name: string
  username: string
  email: string
  bio: string
  memberSince: string
  isPremium: boolean
  stats: {
    jokesSaved: number
    jokesShared: number
    collections: number
    daysActive: number
  }
  humorDNA: { type: string; percentage: number }[]
}

export const mockUserProfile: UserProfile = {
  name: 'Laugh Master',
  username: '@laugh_master',
  email: 'laughmaster@jokesfor.com',
  bio: 'Professional pun enthusiast. Dad joke certified. Making the world groan, one punchline at a time.',
  memberSince: '2025-08-15',
  isPremium: true,
  stats: {
    jokesSaved: 24,
    jokesShared: 12,
    collections: 7,
    daysActive: 42,
  },
  humorDNA: [
    { type: 'Dad Jokes', percentage: 40 },
    { type: 'Puns', percentage: 30 },
    { type: 'Sarcasm', percentage: 20 },
    { type: 'Geeky', percentage: 10 },
  ],
}

export interface ActivityItem {
  id: number
  type: 'save' | 'like' | 'share' | 'collection' | 'draft' | 'achievement'
  description: string
  timeAgo: string
  icon: string
}

export const mockActivity: ActivityItem[] = [
  { id: 1, type: 'save', description: "Saved 'Why don't scientists trust atoms'", timeAgo: '2 hours ago', icon: '🔖' },
  { id: 2, type: 'like', description: 'Liked a Dad Joke about flamingos', timeAgo: '5 hours ago', icon: '❤️' },
  { id: 3, type: 'collection', description: "Created 'Work Humor' collection", timeAgo: '1 day ago', icon: '📁' },
  { id: 4, type: 'share', description: 'Shared the atoms joke to group chat', timeAgo: '1 day ago', icon: '📤' },
  { id: 5, type: 'draft', description: "Started a new draft: 'Why don't eggs...'", timeAgo: '2 days ago', icon: '✏️' },
  { id: 6, type: 'achievement', description: 'Unlocked "7-Day Streak" badge!', timeAgo: '3 days ago', icon: '🏆' },
  { id: 7, type: 'save', description: "Saved 'Parallel lines have so much...'", timeAgo: '4 days ago', icon: '🔖' },
]

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
}

export const mockAchievements: Achievement[] = [
  { id: 'first_save', title: 'First Save', description: 'Saved your first joke', icon: '🔖', unlocked: true, unlockedAt: '2025-08-16' },
  { id: 'streak_7', title: '7-Day Streak', description: 'Visited 7 days in a row', icon: '🔥', unlocked: true, unlockedAt: '2025-10-12' },
  { id: 'collector', title: 'Collection Creator', description: 'Created 5+ collections', icon: '📚', unlocked: true, unlockedAt: '2025-09-20' },
  { id: 'pun_master', title: 'Pun Master', description: 'Saved 10 pun-type jokes', icon: '🎯', unlocked: true, unlockedAt: '2025-10-05' },
  { id: 'sharer', title: 'Social Butterfly', description: 'Shared 10+ jokes', icon: '🦋', unlocked: true, unlockedAt: '2025-10-10' },
  { id: 'streak_30', title: '30-Day Streak', description: 'Visited 30 days in a row', icon: '💎', unlocked: false },
  { id: 'centurion', title: 'The Centurion', description: 'Saved 100 jokes', icon: '💯', unlocked: false },
  { id: 'creator', title: 'Joke Creator', description: 'Published your first joke', icon: '✨', unlocked: false },
]

// ── Preferences ──
export interface UserPreferences {
  humorTypes: string[]
  notifications: {
    dailyJoke: boolean
    trendingAlerts: boolean
    collectionUpdates: boolean
    emailDigest: boolean
  }
  privacy: {
    publicProfile: boolean
    showActivity: boolean
    shareAnalytics: boolean
  }
  theme: 'light' | 'dark' | 'system'

  // Set by the onboarding flow; consumed for personalization in /flow-canvas.
  // Optional so existing consumers that only care about the older fields
  // remain compatible.
  tones?: string[]
  ageRating?: string
  languages?: string[]

  // P8 — daily-ritual scheduling (camelCase here; converted to snake_case by adapter)
  notificationEnabled?: boolean
  notificationTime?: string
  notificationDays?: string[]
  streakSaverEnabled?: boolean
  onboardingCompleted?: boolean
}

export const mockPreferences: UserPreferences = {
  humorTypes: ['dad_jokes', 'puns', 'sarcasm'],
  notifications: {
    dailyJoke: true,
    trendingAlerts: false,
    collectionUpdates: true,
    emailDigest: false,
  },
  privacy: {
    publicProfile: true,
    showActivity: true,
    shareAnalytics: false,
  },
  theme: 'light',
}

// ── Creator Insights ──
export const mockCreatorInsights: CreatorInsights = {
  period: 'month',
  is_creator: true,
  overview: {
    published_jokes: 12,
    reach: 4_820,
    views: 18_340,
    payoff_rate: 0.67,
    reactions: 2_410,
    favorites: 880,
    saves: 530,
    shares: 314,
    peak_read_hour: 21,
    daily_reach_28d: [
      120, 98, 210, 185, 340, 290, 410,
      380, 520, 490, 610, 580, 740, 700,
      820, 780, 900, 860, 1010, 970, 1120,
      1080, 1230, 1190, 1310, 1270, 1400, 1380,
    ],
    followers: 42,
    follower_growth_28d: Array(28).fill(0).map((_, i) => i),
  },
  reactions_breakdown: [
    { reaction: 'lol', count: 1_050 },
    { reaction: 'crying', count: 720 },
    { reaction: 'hmm', count: 390 },
    { reaction: 'eyeroll', count: 250 },
  ],
  shares_breakdown: [
    { platform: 'whatsapp', count: 142 },
    { platform: 'twitter', count: 98 },
    { platform: 'copy_link', count: 74 },
  ],
  source_mix: [
    { source: 'daily', count: 2_400 },
    { source: 'search', count: 1_100 },
    { source: 'trending', count: 820 },
    { source: 'explore', count: 500 },
  ],
  top_jokes: [
    {
      id: 101,
      text: 'Why did the programmer quit his job? Because he didn\'t get arrays.',
      views: 5_420,
      reactions: 810,
      saves: 224,
      shares: 92,
      payoff_rate: 0.78,
    },
    {
      id: 102,
      text: 'I told my boss I needed a raise because three companies were after me. He asked which ones. I said: "The gas, electric, and water companies."',
      views: 3_980,
      reactions: 640,
      saves: 178,
      shares: 61,
      payoff_rate: 0.71,
    },
    {
      id: 103,
      text: 'My wife told me to stop impersonating a flamingo. I had to put my foot down.',
      views: 3_210,
      reactions: 530,
      saves: 144,
      shares: 48,
      payoff_rate: 0.64,
    },
    {
      id: 104,
      text: 'Why don\'t scientists trust atoms? Because they make up everything!',
      views: 2_840,
      reactions: 430,
      saves: 112,
      shares: 39,
      payoff_rate: 0.59,
    },
  ],
  audience: {
    top_themes: [
      { label: 'Work', count: 2_100 },
      { label: 'Tech', count: 1_560 },
      { label: 'School', count: 980 },
      { label: 'Family', count: 720 },
    ],
    top_categories: [
      { label: 'Dad Joke', count: 1_840 },
      { label: 'Punny', count: 1_320 },
      { label: 'Geeky', count: 760 },
      { label: 'Sarcastic', count: 540 },
    ],
    top_formats: [
      { label: 'One-Liner', count: 3_010 },
      { label: 'Setup & Punchline', count: 1_780 },
      { label: 'Short Story', count: 490 },
    ],
  },
  suggestions: [
    {
      kind: 'peak_hour',
      title: 'Post at 9 PM',
      detail: 'Your audience is most active between 9–10 PM. Jokes published then get 2× the reach.',
      data: { hour: 21 },
    },
    {
      kind: 'what_resonates',
      title: 'Tech humor lands',
      detail: 'Your geeky jokes average 0.41 reactions per view — almost double your overall rate.',
      data: { top_tone: 'geeky', reactions_per_view: 0.41 },
    },
    {
      kind: 'consistency',
      title: 'Keep the streak going',
      detail: "You've published 3 jokes this week — your best week yet. One more to hit your record.",
      data: { days_since: 2 },
    },
  ],
}

// ── Creator Profile ──
export const mockCreatorProfile: CreatorProfile = {
  id: 7,
  display_name: 'user_7',
  handle: '@user7',
  avatar_url: null,
  published_jokes: 14,
  follower_count: 42,
  is_following: false,
  jokes: mockJokes.slice(0, 6),
  jokes_pagination: { count: 14, next: null, previous: null },
}

export const mockPublicUsers: PublicUser[] = [
  { id: 7, display_name: 'user_7', handle: '@user7', avatar_url: null },
  { id: 8, display_name: 'Alice', handle: '@alice', avatar_url: null },
]

// ── Billing Mock Data ──
export const mockBillingPlans: BillingPlan[] = [
  {
    slug: 'free',
    name: 'Free',
    description: 'The basics, forever free.',
    interval: null,
    amount_cents: 0,
    currency: 'usd',
    amount_display: 'Free',
    features: { creator_analytics: false, daily_joke_preview: false, mature_content_addon: false },
    limits: { mystery_box_rolls_per_day: 1, submissions_per_day: 2, daily_jokes_per_day: 3, daily_joke_history_days: 7 },
    sort_order: 0,
  },
  {
    slug: 'supporter',
    name: 'Supporter',
    description: 'More jokes, more laughs.',
    interval: 'month',
    amount_cents: 499,
    currency: 'usd',
    amount_display: '$4.99 / mo',
    features: { creator_analytics: false, daily_joke_preview: true, mature_content_addon: true },
    limits: { mystery_box_rolls_per_day: 5, submissions_per_day: 10, daily_jokes_per_day: 10, daily_joke_history_days: 30 },
    sort_order: 1,
  },
  {
    slug: 'creator_pro',
    name: 'Creator Pro',
    description: 'For comedians who mean business.',
    interval: 'month',
    amount_cents: 1299,
    currency: 'usd',
    amount_display: '$12.99 / mo',
    features: { creator_analytics: true, daily_joke_preview: true, mature_content_addon: true },
    limits: { mystery_box_rolls_per_day: null, submissions_per_day: null, daily_jokes_per_day: null, daily_joke_history_days: null },
    sort_order: 2,
  },
]

export const mockMySubscription: MySubscription = {
  plan_slug: 'free',
  plan_name: 'Free',
  status: 'free',
  current_period_end: null,
  cancel_at_period_end: false,
  stripe_customer_id: null,
}

export const mockBillingEntitlements: BillingEntitlements = {
  plan: 'free',
  features: {
    creator_analytics: false,
    daily_joke_preview: false,
    mature_content_addon: false,
  },
  limits: {
    mystery_box_rolls_per_day: 1,
    submissions_per_day: 2,
    daily_jokes_per_day: 3,
    daily_joke_history_days: 7,
  },
}

// Helper to paginate mock data
export function paginateMock<T>(items: T[], page = 1, pageSize = 10): PaginatedResponse<T> {
  const start = (page - 1) * pageSize
  const results = items.slice(start, start + pageSize)
  return {
    count: items.length,
    next: start + pageSize < items.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results,
  }
}
