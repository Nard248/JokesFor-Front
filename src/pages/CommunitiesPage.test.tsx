import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { Community, CommunityDetail, CommunityDirectory } from '@/features/communities'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))
vi.mock('@/components/FlowJokeCard', () => ({
  FlowJokeCard: ({ joke }: { joke: { id: number } }) => <div data-testid="joke-card">joke-{joke.id}</div>,
  jokeToFlowData: (j: unknown) => j,
}))

const auth = { isAuthenticated: true }
vi.mock('@/features/auth', () => ({ useAuth: () => auth }))
const breakpoint = { isMobile: false, isTablet: false, isDesktop: true }
vi.mock('@/hooks/useBreakpoint', () => ({ useBreakpoint: () => breakpoint }))

const mutate = vi.fn()
const directoryState: { data: CommunityDirectory | undefined } = { data: undefined }
const detailSlugs: Array<string | undefined> = []
vi.mock('@/features/communities', () => ({
  useCommunityDirectory: () => ({ data: directoryState.data, isLoading: false, isError: false, refetch: vi.fn() }),
  useCommunityDetail: (slug: string | undefined) => {
    detailSlugs.push(slug)
    const community = directoryState.data?.communities.find((c) => c.slug === slug)
    return { data: community ? detail(community) : undefined, isLoading: false, isError: false }
  },
  useCommunityMembership: () => ({ mutate, isPending: false, isError: false }),
}))

import { CommunitiesPage } from './CommunitiesPage'

function community(overrides: Partial<Community>): Community {
  return {
    slug: 'work', name: 'Work', description: 'Office life', emoji: '💼', color: '#6A1CF6', status: 'active',
    members: 44, engaged_members: 40, growth: 3, score: 120, joke_count: 24, activity: [1, 2, 3, 4, 5, 6, 7],
    explanation: '44 people each enjoyed at least 2 Work jokes recently.',
    viewer: { affinity: 0, content_count: 0, inferred: false, member: false, explicit: null, progress: 0 },
    ...overrides,
  }
}

function detail(c: Community): CommunityDetail {
  return {
    community: c,
    trending: [{ id: 1 }, { id: 2 }] as unknown as CommunityDetail['trending'],
    newest: [{ id: 2 }, { id: 3 }] as unknown as CommunityDetail['newest'],
    creators: [{ id: 9, display_name: 'Maya Okafor', handle: 'mayaokafor', joke_count: 5 }],
    bridges: [{ slug: 'tech', name: 'Tech', emoji: '💻', color: '#2F7DF6', members: 12 }],
  }
}

function directory(communities: Community[], counted = true): CommunityDirectory {
  return {
    generated_at: '2026-10-04T00:00:00Z',
    stats: { active_communities: 1, forming_communities: 1, members: 44, multi_community_members: null, signals_7d: 28 },
    viewer: auth.isAuthenticated ? { counted, communities: communities.filter((c) => c.viewer?.member).map((c) => c.slug) } : null,
    communities,
    bridges: [],
    methodology: {
      half_life_days: 7, membership_threshold: 6, minimum_content: 2, minimum_members: 5, content_cap: 4,
      weights: { like: 3, favorite: 4, save: 4, share: 2 }, window_days: 90, minimum_display: 5,
      description: 'How it works.',
    },
  }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/communities/:slug" element={<CommunitiesPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const space = community({
  slug: 'space', name: 'Space', emoji: '🚀', status: 'forming', members: null, engaged_members: null, growth: null,
  explanation: 'Forming. You’ve enjoyed 1 so far.',
  viewer: { affinity: 3.95, content_count: 1, inferred: false, member: false, explicit: null, progress: 0.66 },
})

describe('CommunitiesPage', () => {
  beforeEach(() => {
    auth.isAuthenticated = true
    breakpoint.isMobile = false
    breakpoint.isDesktop = true
    mutate.mockReset()
    detailSlugs.length = 0
    directoryState.data = directory([community({}), space])
  })

  it('renders suppressed counts as "fewer than 5", never as zero', () => {
    renderAt('/communities')
    const spaceItem = screen.getAllByRole('listitem').find((li) => li.textContent?.includes('Space'))
    expect(within(spaceItem as HTMLElement).getByText(/Fewer than 5 members/)).toBeInTheDocument()
    expect(screen.queryByText(/^0 members/)).not.toBeInTheDocument()
    expect(screen.getByText('<5')).toBeInTheDocument() // multi-community stat withheld
  })

  it('selects the URL community and shows its explanation and personal progress', () => {
    renderAt('/communities/space')
    expect(detailSlugs).toContain('space')
    expect(screen.getByTestId('community-explanation')).toHaveTextContent('You’ve enjoyed 1 so far')
    expect(screen.getByRole('progressbar', { name: /progress toward membership/i })).toHaveAttribute('aria-valuenow', '66')
  })

  it('deduplicates jokes that are both trending and newest', () => {
    renderAt('/communities/work')
    expect(screen.getAllByTestId('joke-card').map((el) => el.textContent)).toEqual(['joke-1', 'joke-2', 'joke-3'])
  })

  it('joins a community you are not in, and leaves one you are in', () => {
    renderAt('/communities/space')
    fireEvent.click(screen.getByRole('button', { name: 'Join community' }))
    expect(mutate).toHaveBeenCalledWith({ slug: 'space', action: 'join' })

    directoryState.data = directory([
      community({ viewer: { affinity: 8, content_count: 3, inferred: true, member: true, explicit: null, progress: 1 } }),
    ])
    renderAt('/communities/work')
    fireEvent.click(screen.getByRole('button', { name: 'Leave community' }))
    expect(mutate).toHaveBeenCalledWith({ slug: 'work', action: 'leave' })
  })

  it('selects a community from the map with the keyboard', () => {
    renderAt('/communities/work')
    const node = screen.getByRole('button', { name: /Space community, forming, fewer than 5 members/ })
    fireEvent.keyDown(node, { key: 'Enter' })
    expect(detailSlugs[detailSlugs.length - 1]).toBe('space')
  })

  it('filters to your communities', () => {
    directoryState.data = directory([
      community({ viewer: { affinity: 8, content_count: 3, inferred: true, member: true, explicit: null, progress: 1 } }),
      space,
    ])
    renderAt('/communities')
    fireEvent.click(screen.getByRole('button', { name: 'Yours' }))
    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '')
    expect(items.some((text) => text.includes('Work'))).toBe(true)
    expect(items.some((text) => text.includes('Space'))).toBe(false)
  })

  it('offers signed-in viewers a "Write a <Theme> joke" CTA that carries the theme', () => {
    renderAt('/communities/space')
    expect(screen.getByRole('link', { name: 'Write a Space joke' })).toHaveAttribute('href', '/create/new?theme=space')
  })

  it('explains in the methodology dialog that counts are approximate and privacy-protected', () => {
    renderAt('/communities')
    expect(screen.getByText('Counts are approximate (privacy-protected).')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /How communities form/ }))
    const note = screen.getByTestId('cm-privacy-note')
    expect(note).toHaveTextContent('Counts are approximate (privacy-protected).')
    // No claim the backend does not implement (no noise, no account-age rule).
    expect(note).not.toHaveTextContent(/noise|established/i)
  })

  it('asks anonymous visitors to sign in instead of offering membership', () => {
    auth.isAuthenticated = false
    directoryState.data = directory([community({ viewer: null })])
    renderAt('/communities/work')
    expect(screen.getByText(/Sign in to see which communities/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in to join' })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('link', { name: /Write a .* joke/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Yours' })).not.toBeInTheDocument()
  })

  it('tells sharing but not-yet-established accounts when they will count', () => {
    const data = directory([community({})], false)
    data.viewer = { counted: false, shares_analytics: true, communities: [] }
    data.methodology = { ...data.methodology, established_account_days: 7, established_min_jokes: 3 }
    directoryState.data = data
    renderAt('/communities')
    expect(screen.getByText(/once your account is 7 days old and you’ve laughed at 3 or more different jokes/)).toBeInTheDocument()
    expect(screen.queryByText(/Turn on audience analytics/)).not.toBeInTheDocument()
  })

  it('states the real count protections in the methodology dialog', () => {
    const data = directory([community({})])
    data.methodology = { ...data.methodology, noise_epsilon: 1, established_account_days: 7, established_min_jokes: 3 }
    directoryState.data = data
    renderAt('/communities')
    fireEvent.click(screen.getByRole('button', { name: /How communities form/ }))
    const note = screen.getByTestId('cm-privacy-note')
    expect(note).toHaveTextContent('small random adjustment that stays the same all day')
    expect(note).toHaveTextContent('at least 7 days old, with laughs on 3 or more different jokes')
  })

  it('explains that non-sharing accounts are not counted', () => {
    directoryState.data = directory([community({})], false)
    renderAt('/communities')
    expect(screen.getByText(/aren’t counted in community totals/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy settings' })).toHaveAttribute('href', '/settings')
  })

  it('shows the inspector alone on mobile detail routes', () => {
    breakpoint.isMobile = true
    breakpoint.isDesktop = false
    renderAt('/communities/space')
    expect(screen.getByRole('button', { name: /All communities/ })).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })
})
