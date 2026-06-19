/**
 * Integration test: verifies that <App /> mounts without crashing even when
 * ConsentBanner is rendered outside the RouterProvider.
 *
 * History: ConsentBanner originally used react-router <Link>, which threw
 * "Cannot destructure property 'basename' of useContext(...) as it is null"
 * because <ConsentBanner /> is a sibling of <AppRoutes /> — outside the
 * RouterProvider that lives inside AppRoutes. This test catches that crash.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── Mock all page components so the router doesn't pull heavy deps ────────────
vi.mock('@/pages', () => ({
  PrivacyPage: () => <div data-testid="page-privacy" />,
  TermsPage: () => <div data-testid="page-terms" />,
  CookiePolicyPage: () => <div data-testid="page-cookie-policy" />,
  ChildrenPrivacyPage: () => <div data-testid="page-childrens-privacy" />,
  VerifyEmailPage: () => <div data-testid="page-verify-email" />,
  JokeDetailPage: () => <div data-testid="page-joke-detail" />,
  ForgotPasswordPage: () => <div data-testid="page-forgot-password" />,
  PackDetailPage: () => <div data-testid="page-pack-detail" />,
  CreatorHubPage: () => <div data-testid="page-creator-hub" />,
  CreatorInsightsPage: () => <div data-testid="page-creator-insights" />,
  FormatPickerPage: () => <div data-testid="page-format-picker" />,
  EditorPage: () => <div data-testid="page-editor" />,
  SubmissionDetailPage: () => <div data-testid="page-submission-detail" />,
  HomePage: () => <div data-testid="page-home" />,
  SearchPage: () => <div data-testid="page-search" />,
  DailyJokePage: () => <div data-testid="page-daily" />,
  LoginPage: () => <div data-testid="page-login" />,
  RegisterPage: () => <div data-testid="page-register" />,
  GoogleCallbackPage: () => <div data-testid="page-google-callback" />,
  FlowPage: () => <div data-testid="page-flow" />,
  FlowCanvasPage: () => <div data-testid="page-flow-canvas" />,
  ExplorePage: () => <div data-testid="page-explore" />,
  LibraryPage: () => <div data-testid="page-library" />,
  TrendingPage: () => <div data-testid="page-trending" />,
  FavoritesPage: () => <div data-testid="page-favorites" />,
  DraftsPage: () => <div data-testid="page-drafts" />,
  ProfilePage: () => <div data-testid="page-profile" />,
  SettingsPage: () => <div data-testid="page-settings" />,
  SubmitJokePage: () => <div data-testid="page-submit" />,
  NotFoundPage: () => <div data-testid="page-not-found" />,
  OnboardingPage: () => <div data-testid="page-onboarding" />,
  HomePageLegacy: () => <div data-testid="page-home-legacy" />,
  TrendingPageLegacy: () => <div data-testid="page-trending-legacy" />,
  FavoritesPageLegacy: () => <div data-testid="page-favorites-legacy" />,
  DraftsPageLegacy: () => <div data-testid="page-drafts-legacy" />,
  ProfilePageLegacy: () => <div data-testid="page-profile-legacy" />,
  SettingsPageLegacy: () => <div data-testid="page-settings-legacy" />,
  SubmitJokePageLegacy: () => <div data-testid="page-submit-legacy" />,
  CreatorProfilePage: () => <div data-testid="page-creator-profile" />,
}))

// ── Mock Layout (used by /legacy/* routes) ────────────────────────────────────
vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// ── Mock ProtectedRoute / GuestOnlyRoute — passthrough ────────────────────────
vi.mock('@/app/providers/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/app/providers/GuestOnlyRoute', () => ({
  GuestOnlyRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── Prevent Firebase ──────────────────────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({
  initAnalytics: vi.fn(async () => null),
  isAnalyticsInitialized: vi.fn(() => false),
}))

// ── Mock auth store ───────────────────────────────────────────────────────────
const mockSetAuth = vi.fn()
const mockSetLoading = vi.fn()
vi.mock('@/features/auth/store', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector?: (s: { user: null; setAuth: typeof mockSetAuth; setLoading: typeof mockSetLoading }) => unknown) => {
      const state = { user: null, setAuth: mockSetAuth, setLoading: mockSetLoading }
      return selector ? selector(state) : state
    }),
    { getState: vi.fn(() => ({ user: null })) },
  ),
}))
vi.mock('@/features/auth', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector?: (s: { user: null; setAuth: typeof mockSetAuth; setLoading: typeof mockSetLoading }) => unknown) => {
      const state = { user: null, setAuth: mockSetAuth, setLoading: mockSetLoading }
      return selector ? selector(state) : state
    }),
    { getState: vi.fn(() => ({ user: null })) },
  ),
}))

// ── Mock axios so AuthProvider's network call resolves instantly ──────────────
vi.mock('axios', () => {
  const mock = {
    post: vi.fn().mockRejectedValue(new Error('no session')),
    get: vi.fn().mockRejectedValue(new Error('no session')),
    create: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  }
  mock.create.mockReturnValue(mock)
  return { default: mock, ...mock }
})

// ── Toast provider stub ───────────────────────────────────────────────────────
vi.mock('@/components/ui/toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── TanStack Query stub (prevent devtools from rendering) ─────────────────────
vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}))

import App from './App'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('App — ConsentBanner + Router composition', () => {
  it('mounts without throwing when no consent decision is stored', () => {
    // If ConsentBanner uses react-router <Link> outside RouterProvider this throws.
    expect(() => render(<App />)).not.toThrow()
  })

  it('shows the consent banner for a new (undecided) visitor', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: /cookie consent/i })).toBeInTheDocument()
  })

  it('the cookie-policy link is a plain <a> with no router dependency', () => {
    render(<App />)
    const link = screen.getByRole('link', { name: /cookie policy/i })
    expect(link).toBeInTheDocument()
    // Must be a plain anchor (href) — not react-router Link (which needs router context)
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/cookie-policy')
  })

  it('does NOT show the banner when a prior consent decision exists', () => {
    localStorage.setItem(
      'jokesfor-consent',
      JSON.stringify({ version: 1, analytics: false, ts: Date.now() }),
    )
    render(<App />)
    expect(screen.queryByRole('region', { name: /cookie consent/i })).not.toBeInTheDocument()
  })
})
