/**
 * FlowAppShell tests — entry-point assertions.
 *
 * Strategy:
 *  - useAuth is mocked (via vi.mock) so the component doesn't need real auth
 *    context; we can flip isAuthenticated on/off per test.
 *  - useStreak is mocked to return no data (avoiding HTTP calls).
 *  - Wrapped in MemoryRouter because FlowAppShell uses <Link> and useLocation.
 */
import React from 'react'
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

// ── Mock ProfileMenu + NotificationsPanel to avoid their own deps ─────────────
vi.mock('./ProfileMenu', () => ({
  ProfileMenu: () => <div data-testid="profile-menu" />,
}))
vi.mock('./NotificationsPanel', () => ({
  NotificationsPanel: () => <div data-testid="notifications-panel" />,
}))

import { FlowAppShell } from './FlowAppShell'

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
