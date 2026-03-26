import type { User, Joke, Collection, SavedJoke, PaginatedResponse } from './api'

// ── Mock User ──
export const mockUser: User = {
  pk: 1,
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
