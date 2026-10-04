/**
 * FlowAppShell tests — entry-point assertions.
 *
 * Strategy:
 *  - useAuth is mocked (via vi.mock) so the component doesn't need real auth
 *    context; we can flip isAuthenticated on/off per test.
 *  - useStreak is mocked to return no data (avoiding HTTP calls).
 *  - useUnseenSubmissionChange is mocked to control dot visibility.
 *  - Wrapped in MemoryRouter because FlowAppShell uses <Link> and useLocation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

// ── Mock useAuth ─────────────────────────────────────────────────────────────
const mockUseAuth = vi.fn()
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}))

// ── Mock useStreak ────────────────────────────────────────────────────────────
vi.mock('@/features/streak', () => ({
  useStreak: () => ({ data: null }),
}))

// ── Mock useBreakpoint (default: desktop) so we can flip mobile/desktop per test ─
const mockUseBreakpoint = vi.fn(() => ({ isMobile: false, isTablet: false, isDesktop: true, width: 1280 }))
vi.mock('@/hooks/useBreakpoint', () => ({
  useBreakpoint: () => mockUseBreakpoint(),
  BREAKPOINTS: { mobile: 640, desktop: 1024 },
}))
const setDesktop = () => mockUseBreakpoint.mockReturnValue({ isMobile: false, isTablet: false, isDesktop: true, width: 1280 })
const setTablet = () => mockUseBreakpoint.mockReturnValue({ isMobile: false, isTablet: true, isDesktop: false, width: 768 })
const setMobile = () => mockUseBreakpoint.mockReturnValue({ isMobile: true, isTablet: false, isDesktop: false, width: 375 })

// ── Mock useUnreadCount (avoids needing a QueryClientProvider) ─────────────────
vi.mock('@/features/notifications', () => ({
  useUnreadCount: () => ({ data: 0 }),
}))

// ── Stub the freemium nudge (its useDailyReads/useQuery would need a provider) ──


// ── Mock useUnseenSubmissionChange ────────────────────────────────────────────
const mockUseUnseenSubmissionChange = vi.fn(() => false)
vi.mock('@/features/create/store', () => ({
  useCreatorStore: () => ({ lastSeenAt: 0, markSeen: vi.fn() }),
  useUnseenSubmissionChange: () => mockUseUnseenSubmissionChange(),
}))

// ── Mock ProfileMenu + NotificationsPanel to avoid their own deps ─────────────
vi.mock('./ProfileMenu', () => ({
  ProfileMenu: () => <div data-testid="profile-menu" />,
}))
vi.mock('./NotificationsPanel', () => ({
  NotificationsPanel: () => <div data-testid="notifications-panel" />,
}))

import { FlowAppShell, type FlowNavKey } from './FlowAppShell'

function renderShell(isAuthenticated: boolean) {
  mockUseAuth.mockReturnValue({
    user: isAuthenticated ? { first_name: 'Test', username: 'testuser', email: 'test@example.com' } : null,
    isAuthenticated,
    isLoading: false,
  })
  return render(
    <MemoryRouter>
      <FlowAppShell>
        <div>content</div>
      </FlowAppShell>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  setDesktop() // default; individual tests opt into tablet/mobile
})

describe('FlowAppShell', () => {
  it('renders the + link pointing to /create when authenticated', () => {
    renderShell(true)
    const link = screen.getByRole('link', { name: /submit a joke/i })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/create')
  })

  it('does NOT render the + link when unauthenticated', () => {
    renderShell(false)
    expect(screen.queryByRole('link', { name: /submit a joke/i })).toBeNull()
  })

  it('renders children content', () => {
    renderShell(true)
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('exposes nav links for Trending, Daily and Favorites (reachable from the canonical shell)', () => {
    renderShell(true)
    expect(screen.getByRole('link', { name: 'Trending' }).getAttribute('href')).toBe('/trending')
    expect(screen.getByRole('link', { name: 'Daily' }).getAttribute('href')).toBe('/daily')
    expect(screen.getByRole('link', { name: 'Favorites' }).getAttribute('href')).toBe('/favorites')
    // Existing entries still present.
    expect(screen.getByRole('link', { name: 'Explore' }).getAttribute('href')).toBe('/explore')
    expect(screen.getByRole('link', { name: 'Library' }).getAttribute('href')).toBe('/library')
  })

  it('active is optional — renders without active prop and no nav item is highlighted', () => {
    // Just checks it doesn't throw when active is undefined
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, isLoading: false })
    expect(() =>
      render(
        <MemoryRouter>
          <FlowAppShell>
            <span>ok</span>
          </FlowAppShell>
        </MemoryRouter>
      )
    ).not.toThrow()
  })
})

describe('FlowAppShell — creator dot', () => {
  it('renders creator-dot when authenticated and useUnseenSubmissionChange returns true', () => {
    mockUseUnseenSubmissionChange.mockReturnValue(true)
    mockUseAuth.mockReturnValue({
      user: { first_name: 'Test', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    })

    render(
      <MemoryRouter>
        <FlowAppShell>
          <div>content</div>
        </FlowAppShell>
      </MemoryRouter>
    )

    expect(screen.getByTestId('creator-dot')).toBeInTheDocument()
  })

  it('does NOT render creator-dot when useUnseenSubmissionChange returns false', () => {
    mockUseUnseenSubmissionChange.mockReturnValue(false)
    mockUseAuth.mockReturnValue({
      user: { first_name: 'Test', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    })

    render(
      <MemoryRouter>
        <FlowAppShell>
          <div>content</div>
        </FlowAppShell>
      </MemoryRouter>
    )

    expect(screen.queryByTestId('creator-dot')).toBeNull()
  })

  it('does NOT render creator-dot for unauthenticated users even if hook returns true', () => {
    mockUseUnseenSubmissionChange.mockReturnValue(true)
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })

    render(
      <MemoryRouter>
        <FlowAppShell>
          <div>content</div>
        </FlowAppShell>
      </MemoryRouter>
    )

    expect(screen.queryByTestId('creator-dot')).toBeNull()
  })
})

describe('FlowAppShell — responsive navigation', () => {
  function renderAt(isAuthenticated = true) {
    mockUseAuth.mockReturnValue({
      user: isAuthenticated ? { first_name: 'Test', username: 'testuser', email: 'test@example.com' } : null,
      isAuthenticated,
      isLoading: false,
    })
    return render(
      <MemoryRouter>
        <FlowAppShell active="today">
          <div>content</div>
        </FlowAppShell>
      </MemoryRouter>
    )
  }

  it('desktop: renders the top nav and NOT the mobile bottom tab bar', () => {
    setDesktop()
    renderAt(true)
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Primary' })).toBeNull()
    // Full destination set present in the top nav.
    expect(screen.getByRole('link', { name: 'Trending' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Daily' })).toBeInTheDocument()
  })

  it('mobile: renders the bottom tab bar and hides the top nav', () => {
    setMobile()
    renderAt(true)
    const bottom = screen.getByRole('navigation', { name: 'Primary' })
    expect(bottom).toBeInTheDocument()
    // Top nav (and its unique items like "Trending") is gone on mobile.
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Trending' })).toBeNull()
    // Primary destinations are present as bottom-tab links.
    for (const name of ['Today', 'Explore', 'Search', 'Library', 'Profile']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('mobile (anonymous): shows a "Sign in" tab instead of "Profile"', () => {
    setMobile()
    renderAt(false)
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Profile' })).toBeNull()
  })

  it('tablet: keeps the top nav (no bottom tab bar)', () => {
    setTablet()
    renderAt(true)
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Primary' })).toBeNull()
  })
})

describe('FlowAppShell — joke-language picker placement', () => {
  function renderActive(active: FlowNavKey | undefined, showContentSelection?: boolean) {
    mockUseAuth.mockReturnValue({
      user: { first_name: 'Test', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    })
    return render(
      <MemoryRouter>
        <FlowAppShell active={active} showContentSelection={showContentSelection}>
          <div>content</div>
        </FlowAppShell>
      </MemoryRouter>
    )
  }
  const picker = () => screen.queryByRole('button', { name: /joke languages/i })

  it.each<FlowNavKey>(['today', 'explore', 'search', 'trending', 'daily'])('shows the picker on the %s surface', (active) => {
    renderActive(active)
    expect(picker()).toBeInTheDocument()
  })

  it.each<FlowNavKey>(['studio', 'communities', 'library', 'favorites'])('hides the picker on the %s surface, whose content it does not scope', (active) => {
    renderActive(active)
    expect(picker()).toBeNull()
  })

  it('hides the picker when no surface is active (editor, format picker, submission view)', () => {
    renderActive(undefined)
    expect(picker()).toBeNull()
  })

  it('shows the picker on an unscoped surface that opts in (pack detail)', () => {
    renderActive('library', true)
    expect(picker()).toBeInTheDocument()
  })
})
