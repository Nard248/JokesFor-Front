/**
 * LegalPages.test.tsx
 *
 * Verifies that each legal route renders its document title and the
 * visible DRAFT notice, and that /cookies redirects to /cookie-policy.
 *
 * Strategy: import the real `routes` array (which includes the legal pages)
 * and mock @/pages for the NON-legal pages so we avoid pulling in their
 * heavy dependency trees. The legal pages are imported directly from their
 * source files so they're real (not mocked).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { HelmetProvider } from 'react-helmet-async'

// Mock all non-legal pages so their deps (auth store, TanStack Query, etc.)
// don't run in this test suite.
vi.mock('@/pages', async (importActual) => {
  const actual = await importActual<typeof import('@/pages')>()
  return {
    ...actual,
    // override only the non-legal heavy pages
    HomePage: () => <div data-testid="page-home" />,
    SearchPage: () => <div data-testid="page-search" />,
    DailyJokePage: () => <div data-testid="page-daily" />,
    LoginPage: () => <div data-testid="page-login" />,
    RegisterPage: () => <div data-testid="page-register" />,
    GoogleCallbackPage: () => <div data-testid="page-google-callback" />,
    LibraryPage: () => <div data-testid="page-library" />,
    TrendingPage: () => <div data-testid="page-trending" />,
    FavoritesPage: () => <div data-testid="page-favorites" />,
    ProfilePage: () => <div data-testid="page-profile" />,
    SettingsPage: () => <div data-testid="page-settings" />,
    NotFoundPage: () => <div data-testid="page-not-found" />,
    FlowPage: () => <div data-testid="page-flow" />,
    FlowCanvasPage: () => <div data-testid="page-flow-canvas" />,
    ExplorePage: () => <div data-testid="page-explore" />,
    CreatorHubPage: () => <div data-testid="page-creator-hub" />,
    FormatPickerPage: () => <div data-testid="page-format-picker" />,
    EditorPage: () => <div data-testid="page-editor" />,
    SubmissionDetailPage: () => <div data-testid="page-submission-detail" />,
    JokeDetailPage: () => <div data-testid="page-joke-detail" />,
    ForgotPasswordPage: () => <div data-testid="page-forgot-password" />,
    PackDetailPage: () => <div data-testid="page-pack-detail" />,
    VerifyEmailPage: () => <div data-testid="page-verify-email" />,
    HomePageLegacy: () => <div data-testid="page-home-legacy" />,
    TrendingPageLegacy: () => <div data-testid="page-trending-legacy" />,
    FavoritesPageLegacy: () => <div data-testid="page-favorites-legacy" />,
    DraftsPageLegacy: () => <div data-testid="page-drafts-legacy" />,
    ProfilePageLegacy: () => <div data-testid="page-profile-legacy" />,
    SettingsPageLegacy: () => <div data-testid="page-settings-legacy" />,
    SubmitJokePageLegacy: () => <div data-testid="page-submit-legacy" />,
    OnboardingPage: () => <div data-testid="page-onboarding" />,
    DraftsPage: () => <div data-testid="page-drafts" />,
    SubmitJokePage: () => <div data-testid="page-submit" />,
  }
})

vi.mock('@/app/providers/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/app/providers/GuestOnlyRoute', () => ({
  GuestOnlyRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Firebase mock so App-level providers don't error
vi.mock('@/lib/firebase', () => ({
  initAnalytics: vi.fn(async () => null),
  isAnalyticsInitialized: vi.fn(() => false),
}))

import { routes } from '@/app/routes'

const DRAFT_NOTICE = 'DRAFT — pending counsel review'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>,
  )
}

describe('Legal pages render correct title and DRAFT notice', () => {
  it('/privacy renders Privacy Policy with DRAFT notice', async () => {
    renderAt('/privacy')
    expect(await screen.findByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText(DRAFT_NOTICE)).toBeInTheDocument()
  })

  it('/terms renders Terms of Service with DRAFT notice', async () => {
    renderAt('/terms')
    expect(await screen.findByText('Terms of Service')).toBeInTheDocument()
    expect(screen.getByText(DRAFT_NOTICE)).toBeInTheDocument()
  })

  it('/cookie-policy renders Cookie Policy with DRAFT notice', async () => {
    renderAt('/cookie-policy')
    expect(await screen.findByText('Cookie Policy')).toBeInTheDocument()
    expect(screen.getByText(DRAFT_NOTICE)).toBeInTheDocument()
  })

  it("/childrens-privacy renders Children's Privacy Policy with DRAFT notice", async () => {
    renderAt('/childrens-privacy')
    expect(await screen.findByText("Children's Privacy Policy")).toBeInTheDocument()
    expect(screen.getByText(DRAFT_NOTICE)).toBeInTheDocument()
  })
})

describe('/cookies redirect', () => {
  it('/cookies redirects to /cookie-policy and renders the cookie doc', async () => {
    renderAt('/cookies')
    // After redirect, cookie-policy content should be visible
    expect(await screen.findByText('Cookie Policy')).toBeInTheDocument()
    expect(screen.getByText(DRAFT_NOTICE)).toBeInTheDocument()
  })
})
