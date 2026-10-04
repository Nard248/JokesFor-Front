import type { ReactNode } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/features/auth/store'
import type { CreatorCommunityReach } from '@/features/communities'
import type { CreatorPlan } from '@/features/creator-studio'

vi.mock('@/components/FlowAppShell', () => ({ FlowAppShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }))

const FREE: CreatorPlan = {
  isPro: false,
  features: { creator_content_explorer: false, creator_exports: false, creator_community_insights: false },
  isLoading: false,
  isError: false,
}
const PRO: CreatorPlan = {
  isPro: true,
  features: { creator_content_explorer: true, creator_exports: true, creator_community_insights: true },
  isLoading: false,
  isError: false,
}
let plan: CreatorPlan = PRO
vi.mock('@/features/creator-studio/useCreatorPlan', () => ({ useCreatorPlan: () => plan }))

import { CreatorCommunitiesPage } from './CreatorCommunitiesPage'

const reach: CreatorCommunityReach = {
  window_days: 28,
  snapshot_date: '2026-10-04',
  audience: { size: null, minimum: 5 },
  communities: [
    { slug: 'office-life', name: 'Office life', emoji: '💼', color: '#6A1CF6', status: 'active', members: 120, joke_count: 40, reached_members: 30, reach_rate: 25, your_jokes: 6 },
    { slug: 'dad-jokes', name: 'Dad jokes', emoji: '👨', color: '#CAFD00', status: 'forming', members: null, joke_count: 9, reached_members: null, reach_rate: null, your_jokes: 0 },
  ],
  opportunities: [
    { kind: 'stronghold', slug: 'office-life', name: 'Office life', emoji: '💼', evidence: 'A quarter of Office life members read you.', action: 'Keep the series going.' },
    { kind: 'untapped', slug: 'dad-jokes', name: 'Dad jokes', emoji: '👨', evidence: 'Your readers overlap with a forming community.', action: 'Try a pun aimed at parents.' },
  ],
  measurement_notes: ['Membership is inferred from signed-in reading activity.', 'Counts under 5 are withheld.'],
}

let get: MockInstance<typeof api.get>
const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><CreatorCommunitiesPage /></MemoryRouter>
  </QueryClientProvider>,
)

beforeEach(() => {
  plan = PRO
  useAuthStore.getState().setAuth({ pk: 1, username: 'creator', email: '', first_name: '', last_name: '' }, 'token')
  get = vi.spyOn(api, 'get').mockResolvedValue({ data: reach })
})
afterEach(() => { cleanup(); useAuthStore.getState().logout(); vi.restoreAllMocks() })

describe('Creator Studio · Communities', () => {
  it('renders inside the Studio with the communities tab current', async () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Communities' })).toBeInTheDocument()
    expect(screen.getByText('Which self-forming communities your audience belongs to')).toBeInTheDocument()
    expect(screen.getByTestId('studio-tab-communities')).toHaveAttribute('aria-current', 'page')
    await screen.findByText('Opportunities')
    expect(get).toHaveBeenCalledWith('/creators/me/communities/')
  })

  it('renders opportunities with kind badges, community links and write prompts', async () => {
    renderPage()
    const stronghold = await screen.findByTestId('opportunity-office-life')
    expect(within(stronghold).getByText('Stronghold')).toBeInTheDocument()
    expect(within(stronghold).getByText('A quarter of Office life members read you.')).toBeInTheDocument()
    expect(within(stronghold).getByRole('link', { name: 'View community' })).toHaveAttribute('href', '/communities/office-life')
    expect(within(stronghold).queryByRole('link', { name: /Write a/ })).toBeNull()

    const untapped = screen.getByTestId('opportunity-dad-jokes')
    expect(within(untapped).getByText('Untapped')).toBeInTheDocument()
    expect(within(untapped).getByText('Try a pun aimed at parents.')).toBeInTheDocument()
    // Carries the community's theme so the editor preselects it.
    expect(within(untapped).getByRole('link', { name: 'Write a Dad jokes joke' })).toHaveAttribute('href', '/create/new?theme=dad-jokes')
  })

  it('says counts are approximate and privacy-protected, above the server notes', async () => {
    renderPage()
    const note = await screen.findByTestId('community-privacy-note')
    expect(note).toHaveTextContent('Counts are approximate (privacy-protected)')
    expect(note).toHaveTextContent('small amount of random noise')
    expect(note).toHaveTextContent('only established accounts count')
    expect(screen.getByText('Membership is inferred from signed-in reading activity.')).toBeInTheDocument()
  })

  it('renders suppressed counts as "<5" and never as 0', async () => {
    renderPage()
    const suppressed = await screen.findByTestId('reach-row-dad-jokes')
    expect(within(suppressed).getAllByText('<5')).toHaveLength(2)
    expect(within(suppressed).getByText('Not enough data')).toBeInTheDocument()
    // Members + reached members are the nullable counts; neither may read as 0.
    expect(within(suppressed).getAllByRole('definition').map((dd) => dd.textContent)).toEqual(['<5', '<5'])
    expect(within(suppressed).queryByText(/^0%/)).toBeNull()

    const measured = screen.getByTestId('reach-row-office-life')
    expect(within(measured).getByText('120')).toBeInTheDocument()
    expect(within(measured).getByText('30')).toBeInTheDocument()
    expect(within(measured).getByText('25% reached')).toBeInTheDocument()

    const summary = screen.getByTestId('community-summary')
    expect(within(summary).getByText('Fewer than 5 readers yet')).toBeInTheDocument()
    expect(within(summary).getByText('Office life')).toBeInTheDocument()
    expect(screen.getByText('Counts under 5 are withheld.')).toBeInTheDocument()
  })

  it('shows the Creator Pro gate on 403 when the account lacks community insights', async () => {
    plan = FREE
    get.mockRejectedValue({ response: { status: 403 } })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Community audience is part of Creator Pro' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See Creator Pro' })).toHaveAttribute('href', '/settings/billing')
    expect(screen.queryByText('Opportunities')).toBeNull()
  })

  it('asks a Pro account with nothing published to publish first on 403', async () => {
    get.mockRejectedValue({ response: { status: 403 } })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Publish your first joke' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Write a joke' })).toHaveAttribute('href', '/create/new')
    expect(screen.queryByTestId('creator-pro-gate')).toBeNull()
  })

  it('shows a retryable error for other failures', async () => {
    get.mockRejectedValue({ response: { status: 500 } })
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your community audience')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('shows a loading skeleton without inventing numbers', () => {
    get.mockImplementation(() => new Promise(() => {}))
    renderPage()
    expect(screen.getByTestId('communities-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('community-summary')).toBeNull()
  })
})
