/**
 * CreatorHubPage tests.
 *
 * FlowAppShell is mocked to a passthrough so tests focus on page content.
 * useDrafts is mocked via vi.mock so we can control the returned data per test.
 */
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Passthrough mock for FlowAppShell (avoids auth/streak context coupling) ──
vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

// ── Mock useDrafts so we can control data per test ───────────────────────────
const mockUseDrafts = vi.fn()

vi.mock('@/features/create', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/create')>()
  return {
    ...original,
    useDrafts: () => mockUseDrafts(),
  }
})

// ── Mock useMyAppeals so we can control the appeals-strip data per test ─────
const mockUseMyAppeals = vi.fn()

vi.mock('@/features/appeals', () => ({
  useMyAppeals: () => mockUseMyAppeals(),
}))

import { CreatorHubPage } from './CreatorHubPage'
import type { ContentDraft } from '@/features/create'

// ── Seed draft helpers ───────────────────────────────────────────────────────

function makeDraft(overrides: Partial<ContentDraft>): ContentDraft {
  return {
    id: 1,
    format: 'oneliner',
    status: 'draft',
    text: 'A funny oneliner',
    setup: '',
    punchline: '',
    lines: null,
    themes: [],
    categories: [],
    cultures: [],
    ageRating: null,
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

const SEED_DRAFTS: ContentDraft[] = [
  makeDraft({ id: 1, status: 'draft', text: "Why don't scientists trust atoms?", format: 'setup', setup: "Why don't scientists trust atoms?", lastEditedAt: '2026-05-20T10:00:00Z' }),
  makeDraft({ id: 2, status: 'published', text: 'I told my wife she should embrace her mistakes.', format: 'oneliner', lastEditedAt: '2026-05-18T14:00:00Z', stats: { saves: 15, reactions: 38, reports: 0 }, likes: 42 }),
  makeDraft({ id: 3, status: 'rejected', text: '', format: 'knock', lines: ['Knock, knock.', "Who's there?", 'Interrupting cow.', 'Moo!'], lastEditedAt: '2026-05-15T11:00:00Z', rejectionReason: 'Timing off.' }),
]

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  // Default: resolved with seed drafts
  mockUseDrafts.mockReturnValue({
    data: SEED_DRAFTS,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
  // Default: no appeals — strip hidden
  mockUseMyAppeals.mockReturnValue({ data: [] })
})

describe('CreatorHubPage', () => {
  it('renders all 5 status tab labels', () => {
    const Wrapper = makeWrapper()
    render(<CreatorHubPage />, { wrapper: Wrapper })

    expect(screen.getByRole('tab', { name: /all/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /drafts/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /pending/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /published/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /rejected/i })).toBeDefined()
  })

  it('renders "Your jokes" heading and a "+ New" button', () => {
    const Wrapper = makeWrapper()
    render(<CreatorHubPage />, { wrapper: Wrapper })

    expect(screen.getByText('Your jokes')).toBeDefined()
    expect(screen.getByRole('button', { name: /new/i })).toBeDefined()
  })

  it('renders DraftCards for all seed drafts (3 status badges visible)', () => {
    const Wrapper = makeWrapper()
    render(<CreatorHubPage />, { wrapper: Wrapper })

    // StatusBadge renders aria-label="Status: <status>" for each card
    const badges = screen.getAllByRole('generic').filter((el) =>
      el.getAttribute('aria-label')?.startsWith('Status:')
    )
    expect(badges.length).toBe(3)
  })

  it('shows "Submit your first joke" empty state when data is empty', () => {
    mockUseDrafts.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    const Wrapper = makeWrapper()
    render(<CreatorHubPage />, { wrapper: Wrapper })

    expect(screen.getByText(/submit your first joke/i)).toBeDefined()
  })

  it('shows loading skeletons when isLoading is true', () => {
    mockUseDrafts.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })

    const Wrapper = makeWrapper()
    render(<CreatorHubPage />, { wrapper: Wrapper })

    // Skeleton renders data-slot="skeleton"
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })

  it('shows error message and retry button on isError', () => {
    const refetch = vi.fn()
    mockUseDrafts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    })

    const Wrapper = makeWrapper()
    render(<CreatorHubPage />, { wrapper: Wrapper })

    expect(screen.getByText(/failed to load/i)).toBeDefined()
    const retryBtn = screen.getByRole('button', { name: /retry/i })
    expect(retryBtn).toBeDefined()
    retryBtn.click()
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('clicking a draft card navigates to /create/:id', async () => {
    // Render inside a MemoryRouter with a custom navigate capture
    const { MemoryRouter: MR, Route, Routes } = await import('react-router')
    const { render: r2, screen: s2 } = await import('@testing-library/react')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    r2(
      <QueryClientProvider client={qc}>
        <MR initialEntries={['/create']}>
          <Routes>
            <Route path="/create" element={<CreatorHubPage />} />
            <Route
              path="/create/:id"
              element={<div data-testid="editor-page">editor</div>}
            />
            <Route
              path="/create/:id/view"
              element={<div data-testid="view-page">view</div>}
            />
          </Routes>
        </MR>
      </QueryClientProvider>
    )

    // Click the first card (status: 'draft', id: 1 → /create/1)
    // The draft card has role="button" with tabIndex=0
    const draftCards = document.querySelectorAll('[role="button"][tabindex="0"]')
    expect(draftCards.length).toBeGreaterThan(0)
    ;(draftCards[0] as HTMLElement).click()

    await waitFor(() => {
      expect(s2.getByTestId('editor-page')).toBeDefined()
    })
  })

  it('clicking a published card navigates to /create/:id/view', async () => {
    // Show only the published draft
    mockUseDrafts.mockReturnValue({
      data: [makeDraft({ id: 2, status: 'published', text: 'Published joke', lastEditedAt: '2026-05-18T14:00:00Z' })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    const { MemoryRouter: MR, Route, Routes } = await import('react-router')
    const { render: r2, screen: s2 } = await import('@testing-library/react')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    r2(
      <QueryClientProvider client={qc}>
        <MR initialEntries={['/create']}>
          <Routes>
            <Route path="/create" element={<CreatorHubPage />} />
            <Route path="/create/:id/view" element={<div data-testid="view-page">view</div>} />
          </Routes>
        </MR>
      </QueryClientProvider>
    )

    const draftCards = document.querySelectorAll('[role="button"][tabindex="0"]')
    expect(draftCards.length).toBeGreaterThan(0)
    ;(draftCards[0] as HTMLElement).click()

    await waitFor(() => {
      expect(s2.getByTestId('view-page')).toBeDefined()
    })
  })

  it('clicking a rejected card navigates to /create/:id/view (SubmissionDetailPage — rejection reason + Appeal CTA live there, not the editor)', async () => {
    // Show only the rejected draft
    mockUseDrafts.mockReturnValue({
      data: [makeDraft({ id: 3, status: 'rejected', text: '', rejectionReason: 'Timing off.', lastEditedAt: '2026-05-15T11:00:00Z' })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    const { MemoryRouter: MR, Route, Routes } = await import('react-router')
    const { render: r2, screen: s2 } = await import('@testing-library/react')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    r2(
      <QueryClientProvider client={qc}>
        <MR initialEntries={['/create']}>
          <Routes>
            <Route path="/create" element={<CreatorHubPage />} />
            <Route path="/create/:id" element={<div data-testid="editor-page">editor</div>} />
            <Route path="/create/:id/view" element={<div data-testid="view-page">view</div>} />
          </Routes>
        </MR>
      </QueryClientProvider>
    )

    const draftCards = document.querySelectorAll('[role="button"][tabindex="0"]')
    expect(draftCards.length).toBeGreaterThan(0)
    ;(draftCards[0] as HTMLElement).click()

    await waitFor(() => {
      expect(s2.getByTestId('view-page')).toBeDefined()
    })
    expect(s2.queryByTestId('editor-page')).toBeNull()
  })

  describe('appeals status strip', () => {
    it('hides entirely when there are no appeals', () => {
      mockUseMyAppeals.mockReturnValue({ data: [] })
      const Wrapper = makeWrapper()
      render(<CreatorHubPage />, { wrapper: Wrapper })
      expect(screen.queryByTestId('appeals-strip')).toBeNull()
    })

    it('hides entirely when the endpoint is absent (data undefined)', () => {
      mockUseMyAppeals.mockReturnValue({ data: undefined })
      const Wrapper = makeWrapper()
      render(<CreatorHubPage />, { wrapper: Wrapper })
      expect(screen.queryByTestId('appeals-strip')).toBeNull()
    })

    it('renders a Pending chip when a pending appeal exists', () => {
      mockUseMyAppeals.mockReturnValue({
        data: [{ id: 1, action_type: 'takedown', status: 'pending', reason_text: 'x', target_type: 'joke', target_id: 1, target_preview: '', created_at: 'x', resolved_at: null, resolution_note: '' }],
      })
      const Wrapper = makeWrapper()
      render(<CreatorHubPage />, { wrapper: Wrapper })
      expect(screen.getByTestId('appeals-strip')).toBeDefined()
      expect(screen.getByText('Pending appeal: 1')).toBeDefined()
    })

    it('renders both Pending and Resolved chips with correct counts', () => {
      mockUseMyAppeals.mockReturnValue({
        data: [
          { id: 1, action_type: 'takedown', status: 'pending', reason_text: 'x', target_type: 'joke', target_id: 1, target_preview: '', created_at: 'x', resolved_at: null, resolution_note: '' },
          { id: 2, action_type: 'takedown', status: 'pending', reason_text: 'x', target_type: 'joke', target_id: 2, target_preview: '', created_at: 'x', resolved_at: null, resolution_note: '' },
          { id: 3, action_type: 'rejection', status: 'upheld', reason_text: 'x', target_type: 'submission', target_id: 3, target_preview: '', created_at: 'x', resolved_at: 'y', resolution_note: '' },
          { id: 4, action_type: 'rejection', status: 'reversed', reason_text: 'x', target_type: 'submission', target_id: 4, target_preview: '', created_at: 'x', resolved_at: 'y', resolution_note: '' },
        ],
      })
      const Wrapper = makeWrapper()
      render(<CreatorHubPage />, { wrapper: Wrapper })
      expect(screen.getByText('Pending appeals: 2')).toBeDefined()
      expect(screen.getByText('Resolved: 2')).toBeDefined()
    })
  })
})
