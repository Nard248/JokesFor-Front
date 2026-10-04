import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreatorPlan } from './useCreatorPlan'

const shellProps = vi.fn()
vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children, active }: { children: ReactNode; active?: string }) => {
    shellProps(active)
    return <main>{children}</main>
  },
}))

const FREE: CreatorPlan = {
  isPro: false,
  features: { creator_content_explorer: false, creator_exports: false, creator_community_insights: false },
  isLoading: false,
  isError: false,
}
let plan: CreatorPlan = FREE
vi.mock('./useCreatorPlan', () => ({ useCreatorPlan: () => plan }))

import { CreatorStudioLayout } from './CreatorStudioLayout'

function renderLayout(section: Parameters<typeof CreatorStudioLayout>[0]['section'] = 'insights', actions?: ReactNode) {
  return render(
    <MemoryRouter>
      <CreatorStudioLayout section={section} title="Insights" subtitle="How readers respond" actions={actions}>
        <p>page body</p>
      </CreatorStudioLayout>
    </MemoryRouter>,
  )
}

const studioNav = () => screen.getByRole('navigation', { name: 'Creator Studio sections' })

beforeEach(() => {
  plan = FREE
  shellProps.mockClear()
})

describe('CreatorStudioLayout', () => {
  it('renders the Studio header, body and all five section tabs with their routes', () => {
    renderLayout()
    expect(screen.getByText('Creator Studio')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Insights' })).toBeInTheDocument()
    expect(screen.getByText('How readers respond')).toBeInTheDocument()
    expect(screen.getByText('page body')).toBeInTheDocument()
    const links = within(studioNav()).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/create', '/create/content', '/create/insights', '/create/communities', '/create/library',
    ])
    expect(shellProps).toHaveBeenCalledWith('studio')
  })

  it('marks only the active section with aria-current="page"', () => {
    renderLayout('communities')
    const current = within(studioNav()).getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('href', '/create/communities')
  })

  it('shows Pro pills on Pro-only tabs and a Free plan badge when the creator lacks the entitlements', () => {
    renderLayout()
    expect(screen.getByTestId('studio-pro-pill-content')).toHaveTextContent('Pro')
    expect(screen.getByTestId('studio-pro-pill-communities')).toHaveTextContent('Pro')
    expect(screen.queryByTestId('studio-pro-pill-insights')).toBeNull()
    expect(screen.queryByTestId('studio-pro-pill-library')).toBeNull()
    expect(screen.queryByTestId('studio-pro-pill-overview')).toBeNull()
    // Locked tabs stay navigable so the page can explain the gate.
    expect(screen.getByTestId('studio-tab-content')).toHaveAttribute('href', '/create/content')
    expect(screen.getByTestId('studio-plan-badge')).toHaveTextContent('Free plan')
    expect(screen.getByRole('link', { name: 'Explore Creator Pro' })).toHaveAttribute('href', '/settings/billing')
  })

  it('pills only the tab whose specific entitlement is missing', () => {
    plan = { ...FREE, isPro: true, features: { ...FREE.features, creator_content_explorer: true } }
    renderLayout()
    expect(screen.queryByTestId('studio-pro-pill-content')).toBeNull()
    expect(screen.getByTestId('studio-pro-pill-communities')).toBeInTheDocument()
  })

  it('shows the Creator Pro badge and no pills for a full Creator Pro account', () => {
    plan = { ...FREE, isPro: true, features: { creator_content_explorer: true, creator_exports: true, creator_community_insights: true } }
    renderLayout()
    expect(screen.getByTestId('studio-plan-badge')).toHaveTextContent('Creator Pro')
    expect(screen.queryByText('Free plan')).toBeNull()
    expect(screen.queryByTestId('studio-pro-pill-content')).toBeNull()
    expect(screen.queryByTestId('studio-pro-pill-communities')).toBeNull()
  })

  it('does not guess a plan while entitlements are loading', () => {
    plan = { ...FREE, isLoading: true }
    renderLayout()
    expect(screen.queryByTestId('studio-plan-badge')).toBeNull()
    expect(screen.queryByTestId('studio-pro-pill-content')).toBeNull()
  })

  it('renders the actions slot in the header', () => {
    renderLayout('overview', <a href="/create/new">New joke</a>)
    expect(screen.getByRole('link', { name: 'New joke' })).toBeInTheDocument()
  })
})
