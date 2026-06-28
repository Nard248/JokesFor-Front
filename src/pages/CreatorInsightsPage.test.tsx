import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { CreatorInsights } from '@/lib/api'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

const mockUseCreatorInsights = vi.fn()

vi.mock('@/features/creator-insights', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/creator-insights')>()
  return {
    ...original,
    useCreatorInsights: (period?: string) => mockUseCreatorInsights(period),
  }
})

import { CreatorInsightsPage } from './CreatorInsightsPage'

const MOCK_DATA: CreatorInsights = {
  period: 'month',
  is_creator: true,
  overview: {
    published_jokes: 7,
    reach: 412,
    views: 1830,
    payoff_rate: 0.61,
    reactions: 240,
    favorites: 88,
    saves: 53,
    shares: 31,
    peak_read_hour: 21,
    daily_reach_28d: Array(28).fill(0).map((_, i) => i * 2),
    followers: 42,
    follower_growth_28d: Array(28).fill(0).map((_, i) => i * 2),
    avg_read_seconds: 14,
    read_rate: 0.58,
    completion_rate: 0.41,
  },
  reactions_breakdown: [{ reaction: 'lol', count: 120 }, { reaction: 'crying', count: 80 }],
  shares_breakdown: [{ platform: 'whatsapp', count: 14 }],
  source_mix: [{ source: 'daily', count: 700 }],
  top_jokes: [
    { id: 42, text: 'Why did the chicken cross the road?', views: 540, reactions: 80, saves: 22, shares: 9, payoff_rate: 0.7, avg_read_seconds: 18, read_rate: 0.64 },
    { id: 43, text: 'I told my wife she should embrace her mistakes.', views: 320, reactions: 60, saves: 15, shares: 5, payoff_rate: 0.55, avg_read_seconds: 22, read_rate: 0.6 },
  ],
  audience: {
    top_themes: [{ label: 'Work', count: 210 }],
    top_categories: [{ label: 'Dark', count: 180 }],
    top_formats: [{ label: 'One-liner', count: 300 }],
  },
  suggestions: [
    { kind: 'peak_hour', title: 'Post at 9 PM', detail: 'Your audience is most active at 9 PM.', data: { hour: 21 } },
    { kind: 'what_resonates', title: 'Dark humor lands', detail: 'Dark tone gets 0.35 reactions per view.', data: { top_tone: 'dark', reactions_per_view: 0.35 } },
    { kind: 'consistency', title: 'Time to post again', detail: "You haven't posted in 12 days.", data: { days_since: 12 } },
  ],
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mockUseCreatorInsights.mockReturnValue({
    data: MOCK_DATA,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })
})

describe('CreatorInsightsPage', () => {
  it('renders "Creator Insights" heading', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByText(/creator insights/i)).toBeDefined()
  })

  it('renders KPI values: reach, views, payoff rate', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByText('412')).toBeDefined()
    expect(screen.getByText('1,830')).toBeDefined()
    expect(screen.getByText(/61%/)).toBeDefined()
  })

  it('renders top jokes with their text', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByText(/why did the chicken/i)).toBeDefined()
    expect(screen.getByText(/embrace her mistakes/i)).toBeDefined()
  })

  it('renders suggestion card titles', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByText(/post at 9 pm/i)).toBeDefined()
    expect(screen.getByText(/dark humor lands/i)).toBeDefined()
    expect(screen.getByText(/time to post again/i)).toBeDefined()
  })

  it('renders period selector buttons', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByRole('button', { name: /month/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /week/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /all time/i })).toBeDefined()
  })

  it('shows loading skeletons when isLoading', () => {
    mockUseCreatorInsights.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows not-creator empty state on 403 error', () => {
    mockUseCreatorInsights.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 403 } },
      refetch: vi.fn(),
    })
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getAllByText(/publish a joke/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders audience taste labels', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByText('Work')).toBeDefined()
    expect(screen.getByText('Dark')).toBeDefined()
    expect(screen.getByText('One-liner')).toBeDefined()
  })

  it('zero-state shows only "No data" message and NOT the KPI row when published_jokes === 0', () => {
    mockUseCreatorInsights.mockReturnValue({
      data: {
        ...MOCK_DATA,
        overview: { ...MOCK_DATA.overview, published_jokes: 0 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    // Zero-state message should appear
    expect(screen.getByText(/no data yet for this period/i)).toBeDefined()
    // KPI values (reach/views) should NOT appear
    expect(screen.queryByText('412')).toBeNull()
    expect(screen.queryByText('1,830')).toBeNull()
  })

  it('clicking "Week" pill calls useCreatorInsights with "week"', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    const weekButton = screen.getByRole('button', { name: /week/i })
    fireEvent.click(weekButton)
    // The hook should have been called with 'week' after the click
    const calls = mockUseCreatorInsights.mock.calls
    const calledWithWeek = calls.some((args) => args[0] === 'week')
    expect(calledWithWeek).toBe(true)
  })

  it('renders followers KPI', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByText('42')).toBeDefined()
    // Verify the "Followers" label is also present
    expect(screen.getByText('Followers')).toBeDefined()
  })

  it('renders the reactions & shares breakdown section with friendly labels', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByText(/reactions & shares/i)).toBeDefined()
    // 'lol' -> '😂 LOL', 'whatsapp' -> 'WhatsApp'
    expect(screen.getByText(/LOL/)).toBeDefined()
    expect(screen.getByText('WhatsApp')).toBeDefined()
  })

  it('hides the audience taste section when all taste lists are empty', () => {
    mockUseCreatorInsights.mockReturnValue({
      data: {
        ...MOCK_DATA,
        audience: { top_themes: [], top_categories: [], top_formats: [] },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.queryByText(/audience taste/i)).toBeNull()
  })

  it('renders the Attention read-time metrics (avg read time, read-through, completion)', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByText('Attention')).toBeDefined()
    expect(screen.getByText('Avg read time')).toBeDefined()
    expect(screen.getByText('Read-through rate')).toBeDefined()
    expect(screen.getByText(/completion \(story\)/i)).toBeDefined()
    // avg_read_seconds: 14 → "14s"; read_rate 0.58 → "58%"; completion 0.41 → "41%"
    expect(screen.getByText('14s')).toBeDefined()
    expect(screen.getByText('58%')).toBeDefined()
    expect(screen.getByText('41%')).toBeDefined()
  })

  it('formats avg read time over a minute as "Nm Ns"', () => {
    mockUseCreatorInsights.mockReturnValue({
      data: {
        ...MOCK_DATA,
        overview: { ...MOCK_DATA.overview, avg_read_seconds: 95 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByText('1m 35s')).toBeDefined()
  })

  it('degrades the Attention metrics to "—" when read-time fields are null', () => {
    mockUseCreatorInsights.mockReturnValue({
      data: {
        ...MOCK_DATA,
        overview: {
          ...MOCK_DATA.overview,
          avg_read_seconds: null,
          read_rate: null,
          completion_rate: null,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    // The Attention section still renders, with em-dashes for the null stats.
    expect(screen.getByText('Avg read time')).toBeDefined()
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3)
  })

  it('renders per-joke avg read + read rate in the top-jokes rows', () => {
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    // First top joke: avg_read_seconds 18 → "18s", read_rate 0.64 → "64%"
    expect(screen.getByText('18s')).toBeDefined()
    expect(screen.getByText('64%')).toBeDefined()
    expect(screen.getAllByText('Avg read').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Read rate').length).toBeGreaterThanOrEqual(1)
  })

  it('renders an em-dash for a null payoff_rate instead of crashing', () => {
    mockUseCreatorInsights.mockReturnValue({
      data: {
        ...MOCK_DATA,
        overview: { ...MOCK_DATA.overview, payoff_rate: null },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<CreatorInsightsPage />, { wrapper: makeWrapper() })
    expect(screen.getByText('Payoff Rate')).toBeDefined()
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })
})
