import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { HelmetProvider } from 'react-helmet-async'

// useAuth is mocked per-test so we can flip anonymous ↔ authenticated.
const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: mockUseAuth }))

import { LandingPage } from './LandingPage'

function renderLanding() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* Redirect target for the authenticated-user test */}
          <Route path="/flow-canvas" element={<div data-testid="app-home" />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

/** Collect href values for all rendered links. */
function hrefs() {
  return screen.getAllByRole('link').map((a) => a.getAttribute('href'))
}

describe('LandingPage — anonymous visitor', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, user: null })
  })

  it('renders the hero headline', () => {
    renderLanding()
    expect(
      screen.getByRole('heading', { level: 1, name: /favorite joke/i }),
    ).toBeInTheDocument()
  })

  it('primary and creator CTAs link to /register', () => {
    renderLanding()
    // "Start reading free" appears in both the hero and the final CTA — every
    // instance must point at /register.
    const startCtas = screen.getAllByRole('link', { name: /start reading free/i })
    expect(startCtas.length).toBeGreaterThan(0)
    startCtas.forEach((el) => expect(el).toHaveAttribute('href', '/register'))
    expect(screen.getByRole('link', { name: /become a creator/i })).toHaveAttribute('href', '/register')
    // The header "Start free" CTA also points at /register.
    expect(hrefs()).toContain('/register')
  })

  it('"Sign in" links to /login', () => {
    renderLanding()
    // Present in both the header and the footer.
    const signIn = screen.getAllByRole('link', { name: /sign in/i })
    expect(signIn.length).toBeGreaterThan(0)
    signIn.forEach((el) => expect(el).toHaveAttribute('href', '/login'))
  })

  it('footer links to /privacy, /terms and /cookie-policy', () => {
    renderLanding()
    const links = hrefs()
    expect(links).toContain('/privacy')
    expect(links).toContain('/terms')
    expect(links).toContain('/cookie-policy')
  })

  it('the try-it card reveal works: tap shows the sign-up nudge, no crash', async () => {
    const user = userEvent.setup()
    renderLanding()

    // The punchline text is always in the DOM (blurred via CSS), so we assert the
    // reveal by the post-reveal sign-up nudge, which only appears after the tap.
    expect(screen.queryByTestId('try-it-signup')).toBeNull()

    const reveal = screen.getByTestId('try-it-reveal')
    expect(reveal).toHaveAccessibleName(/reveal the punchline/i)
    await user.click(reveal)

    const signup = screen.getByTestId('try-it-signup')
    expect(signup).toBeInTheDocument()
    expect(signup).toHaveAttribute('href', '/register')
    // Punchline is still rendered (reveal didn't blow up the card).
    expect(screen.getByText(/we'll see about that/i)).toBeInTheDocument()
    // The reveal control is now inert.
    expect(reveal).toBeDisabled()
  })
})

describe('LandingPage — authenticated visitor', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { username: 'x' } })
  })

  it('redirects into the app instead of showing the pitch', () => {
    renderLanding()
    expect(screen.getByTestId('app-home')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: /favorite joke/i })).toBeNull()
  })
})
