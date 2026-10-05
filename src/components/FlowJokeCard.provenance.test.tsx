import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FlowJokeData } from './FlowJokeCard'

vi.mock('@/features/auth', () => ({ useAuth: () => ({ isAuthenticated: false, user: null }) }))
vi.mock('@/lib/telemetry', () => ({ trackReveal: vi.fn() }))

// ── Peripheral hooks (no-op; avoid QueryClient/network) ───────────────────────
vi.mock('@/features/reactions', () => ({
  useReactions: () => ({ data: undefined }),
  useReactToJoke: () => ({ mutate: vi.fn() }),
}))
const saveMutate = vi.fn()
vi.mock('@/features/saved-jokes', () => ({ useSaveJoke: () => ({ mutate: saveMutate }) }))
vi.mock('@/features/telemetry', () => ({
  useImpression: () => ({ current: null }),
  useDwell: () => ({ current: null }),
  recordShare: vi.fn(),
}))

import { FlowJokeCard } from './FlowJokeCard'
import { jokeToFlowData } from './flowJokeData'
import type { Joke } from '@/lib/api'

function renderCard(joke: FlowJokeData) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <FlowJokeCard joke={joke} />
    </QueryClientProvider>,
  )
}

const spanish = {
  id: 7,
  text: '',
  setup: '¿Qué le dijo una pared a otra?',
  punchline: 'Nos vemos en la esquina.',
  format: 'setup',
  tones: [],
  context_tags: [],
  culture_tags: [],
  language: { id: 2, name: 'Spanish', code: 'es', native_name: 'Español' },
  origin_country: { code: 'MX', name: 'Mexico', native_name: 'México' },
  editorial_status: 'ai_screened',
} as unknown as Joke

beforeEach(() => vi.clearAllMocks())

describe('FlowJokeCard — provenance badges', () => {
  it('renders language, origin and AI-generated badges for a mapped joke', () => {
    renderCard(jokeToFlowData(spanish)!)
    expect(screen.getByText('Español')).toHaveAttribute('lang', 'es')
    expect(screen.getByTestId('joke-origin-badge')).toHaveTextContent('Mexico')
    expect(screen.getByTestId('joke-ai-badge')).toHaveAttribute(
      'title',
      'Written with AI and screened; not yet reviewed by a native speaker',
    )
  })

  it('sets lang on the joke text and keeps the English chrome English', () => {
    const { container } = renderCard(jokeToFlowData(spanish)!)
    const article = container.querySelector('article')!
    expect(article).toHaveAttribute('lang', 'es')
    expect(screen.getByText('¿Qué le dijo una pared a otra?').closest('[lang]')).toBe(article)
    expect(screen.getByText('Tap to reveal punchline →')).toHaveAttribute('lang', 'en')
    expect(screen.getByTestId('joke-provenance')).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('button', { name: 'LOL' }).closest('[lang]')).toHaveAttribute('lang', 'en')
  })

  it('keeps an English card free of badges', () => {
    renderCard(jokeToFlowData({ ...spanish, language: { id: 1, name: 'English', code: 'en' }, origin_country: null, editorial_status: 'legacy' } as Joke)!)
    expect(screen.queryByTestId('joke-provenance')).toBeNull()
  })

  it('renders without the new fields (older payloads)', () => {
    renderCard({ id: 1, fmt: 'oneliner', text: 'Plain.' })
    expect(screen.getByText('Plain.')).toBeInTheDocument()
    expect(screen.queryByTestId('joke-provenance')).toBeNull()
  })
})

describe('FlowJokeCard — save needs a real joke id', () => {
  it('saves with the numeric joke id', () => {
    renderCard({ id: 42, fmt: 'oneliner', text: 'Real.' })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(saveMutate).toHaveBeenCalledWith({ jokeId: 42 }, expect.anything())
  })

  it('does not call the API for a preview/mock card with a string id', () => {
    renderCard({ id: 'home-1', fmt: 'oneliner', text: 'Mock.' })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(saveMutate).not.toHaveBeenCalled()
  })
})
