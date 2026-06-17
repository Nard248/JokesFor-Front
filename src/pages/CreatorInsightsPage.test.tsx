import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    useCreatorInsights: () => mockUseCreatorInsights(),
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
  },
  reactions_breakdown: [{ reaction: 'lol', count: 120 }, { reaction: 'crying', count: 80 }],
  shares_breakdown: [{ platform: 'whatsapp', count: 14 }],
  source_mix: [{ source: 'daily', count: 700 }],
  top_jokes: [
    { id: 42, text: 'Why did the chicken cross the road?', views: 540, reactions: 80, saves: 22, shares: 9, payoff_rate: 0.7 },
    { id: 43, text: 'I told my wife she should embrace her mistakes.', views: 320, reactions: 60, saves: 15, shares: 5, payoff_rate: 0.55 },
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
})
