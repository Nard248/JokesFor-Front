/**
 * ProfileMenu tests.
 *
 * Strategy:
 *  - useAuth and useLogout are mocked (vi.mock) to avoid real auth context.
 *  - useNavigate is mocked so logout navigation doesn't fail.
 *  - Wrapped in MemoryRouter because ProfileMenu uses <Link>.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

// ── Mock useAuth + useLogout ──────────────────────────────────────────────────
vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { first_name: 'Jane', username: 'janedev', email: 'jane@example.com' },
    isAuthenticated: true,
    isLoading: false,
  }),
  useLogout: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

// ── Mock useNavigate ──────────────────────────────────────────────────────────
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

import { ProfileMenu } from './ProfileMenu'

function renderMenu() {
  return render(
    <MemoryRouter>
      <ProfileMenu onClose={vi.fn()} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProfileMenu', () => {
  it('renders a "My submissions" link pointing to /create', () => {
    renderMenu()
    const link = screen.getByRole('menuitem', { name: /my submissions/i })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/create')
  })

  it('renders the standard nav items: View profile, Your library, Settings', () => {
    renderMenu()
    expect(screen.getByRole('menuitem', { name: /view profile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /your library/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders Sign out button', () => {
    renderMenu()
    // The sign-out button contains an SVG + text node; query by text content
    expect(screen.getByText(/sign out/i)).toBeInTheDocument()
  })
})
