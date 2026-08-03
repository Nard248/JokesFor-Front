/**
 * SubmissionDetailPage tests.
 *
 * FlowAppShell is mocked to a passthrough.
 * JokeRenderer is mocked to avoid SVG/canvas rendering complexity.
 * useDraft is mocked per-test to return specific ContentDraft shapes.
 */
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ContentDraft } from '@/features/create'

// ── Passthrough mocks ────────────────────────────────────────────────────────
vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

vi.mock('@/components/JokeRenderer', () => ({
  JokeRenderer: ({
    payload,
  }: {
    payload: { text?: string; setup?: string; media?: { url: string | null }[] | null }
  }) => (
    <div data-testid="joke-renderer" data-media-count={payload.media?.length ?? 0}>
      {payload.text || payload.setup || 'joke'}
    </div>
  ),
}))

// ── Mock useDraft ────────────────────────────────────────────────────────────
const mockUseDraft = vi.fn()

vi.mock('@/features/create', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/create')>()
  return {
    ...original,
    useDraft: (_id: number) => mockUseDraft(_id),
  }
})

import { SubmissionDetailPage } from './SubmissionDetailPage'

// ── Draft factories ──────────────────────────────────────────────────────────

function baseDraft(overrides: Partial<ContentDraft>): ContentDraft {
  return {
    id: 42,
    format: 'oneliner',
    status: 'pending',
    text: 'A funny oneliner',
    setup: '',
    punchline: '',
    lines: null,
    themes: ['tech'],
    categories: ['nerd'],
    cultures: ['universal'],
    ageRating: 'family',
    language: 'en',
    source: 'original',
    lastEditedAt: '2026-05-20T10:00:00Z',
    rejectionReason: '',
    likes: null,
    stats: null,
    media: [],
    ...overrides,
  }
}

const PENDING_DRAFT = baseDraft({ id: 42, status: 'pending' })
const PUBLISHED_DRAFT = baseDraft({
  id: 42,
  status: 'published',
  likes: 42,
  stats: { saves: 15, reactions: 38, reports: 0 },
})
const REJECTED_DRAFT = baseDraft({
  id: 42,
  status: 'rejected',
  rejectionReason: 'The punchline needs work.',
})

function makeWrapper(draftId = '42') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/create/${draftId}/view`]}>
        <Routes>
          <Route path="/create/:draftId/view" element={children as React.ReactElement} />
          <Route path="/create" element={<div data-testid="hub-page">hub</div>} />
          <Route path="/create/:draftId" element={<div data-testid="editor-page">editor</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mockUseDraft.mockReturnValue({
    data: PENDING_DRAFT,
    isLoading: false,
    isError: false,
  })
})

describe('SubmissionDetailPage', () => {
  it('renders a back link to /create', () => {
    const Wrapper = makeWrapper()
    render(<SubmissionDetailPage />, { wrapper: Wrapper })

    const backLinks = screen.getAllByRole('link')
    const backLink = backLinks.find((l) => l.getAttribute('href') === '/create')
    expect(backLink).toBeDefined()
  })

  it('shows loading skeletons while isLoading is true', () => {
    mockUseDraft.mockReturnValue({ data: undefined, isLoading: true, isError: false })

    const Wrapper = makeWrapper()
    render(<SubmissionDetailPage />, { wrapper: Wrapper })

    const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows error message when isError is true', () => {
    mockUseDraft.mockReturnValue({ data: undefined, isLoading: false, isError: true })

    const Wrapper = makeWrapper()
    render(<SubmissionDetailPage />, { wrapper: Wrapper })

    expect(screen.getByText(/not found|error|failed/i)).toBeDefined()
  })

  describe('pending draft', () => {
    beforeEach(() => {
      mockUseDraft.mockReturnValue({ data: PENDING_DRAFT, isLoading: false, isError: false })
    })

    it('shows the pending status banner', () => {
      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      // The pending banner contains the "Pending" status label
      const allPendingEls = screen.getAllByText(/pending/i)
      expect(allPendingEls.length).toBeGreaterThanOrEqual(1)
    })

    it('renders the joke content via JokeRenderer', () => {
      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      expect(screen.getByTestId('joke-renderer')).toBeDefined()
    })

    it('threads the submission media into the JokeRenderer payload (via toJokePayload)', () => {
      const MEDIA_DRAFT = baseDraft({
        id: 43,
        format: 'image',
        status: 'pending',
        setup: 'A cat wearing sunglasses',
        media: [
          {
            id: 'm1',
            kind: 'image',
            url: 'https://cdn.example.com/a.jpg',
            poster_url: null,
            width: 800,
            height: 600,
            duration_ms: null,
            is_gif: false,
          },
        ],
      })
      mockUseDraft.mockReturnValue({ data: MEDIA_DRAFT, isLoading: false, isError: false })

      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      expect(screen.getByTestId('joke-renderer')).toHaveAttribute('data-media-count', '1')
    })

    it('shows "With our reviewers since" copy', () => {
      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      // Multiple elements may contain "with our reviewers since" — check at least one exists
      const matches = screen.getAllByText(/with our reviewers since/i)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('published draft', () => {
    beforeEach(() => {
      mockUseDraft.mockReturnValue({ data: PUBLISHED_DRAFT, isLoading: false, isError: false })
    })

    it('shows the published status banner', () => {
      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      expect(screen.getByText(/published/i)).toBeDefined()
    })

    it('renders PublishedStats with saves, reactions, reports', () => {
      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      expect(screen.getByText(/15 saved/i)).toBeDefined()
      expect(screen.getByText(/38 reactions/i)).toBeDefined()
      expect(screen.getByText(/0 reports/i)).toBeDefined()
    })

    it('shows a "+ New joke" button navigating to /create/new', () => {
      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      const newJokeBtn = screen.getByRole('button', { name: /new joke/i })
      expect(newJokeBtn).toBeDefined()
    })
  })

  describe('rejected draft', () => {
    beforeEach(() => {
      mockUseDraft.mockReturnValue({ data: REJECTED_DRAFT, isLoading: false, isError: false })
    })

    it('shows the rejected status banner', () => {
      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      expect(screen.getByText(/rejected/i)).toBeDefined()
    })

    it('shows the rejection reason text', () => {
      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      expect(screen.getByText('The punchline needs work.')).toBeDefined()
    })

    it('shows "Edit and resubmit" link pointing to /create/:id', () => {
      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      const editLink = screen.getByRole('link', { name: /edit and resubmit/i })
      expect(editLink).toBeDefined()
      expect(editLink.getAttribute('href')).toBe('/create/42')
    })

    it('shows an "Appeal this decision" CTA', () => {
      const Wrapper = makeWrapper()
      render(<SubmissionDetailPage />, { wrapper: Wrapper })

      expect(screen.getByTestId('appeal-button')).toBeDefined()
      expect(screen.getByText('Appeal this decision')).toBeDefined()
    })
  })
})
