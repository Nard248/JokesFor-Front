/**
 * Routes test — redirect assertions.
 *
 * Strategy:
 *  - Import the exported `routes` array and pass it to createMemoryRouter.
 *  - All page components are mocked as simple divs (avoids pulling in their
 *    full dependency trees — auth store, TanStack Query, etc.).
 *  - ProtectedRoute is mocked to be a passthrough so we can test redirects
 *    without setting up auth state.
 *  - Navigate from react-router is mocked as a lightweight redirect so the
 *    router's internal <Navigate> still works (we import the real one from
 *    react-router inside routes.tsx, but redirect assertions use the real
 *    createMemoryRouter anyway).
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'

// ── Mock every page component to a lightweight passthrough ────────────────────
vi.mock('@/pages', () => ({
  // Legal pages (CD5)
  PrivacyPage: () => <div data-testid="page-privacy" />,
  TermsPage: () => <div data-testid="page-terms" />,
  CookiePolicyPage: () => <div data-testid="page-cookie-policy" />,
  ChildrenPrivacyPage: () => <div data-testid="page-childrens-privacy" />,
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
  BillingPage: () => <div data-testid="page-billing" />,
  NotFoundPage: () => <div data-testid="page-not-found" />,
  FlowPage: () => <div data-testid="page-flow" />,
  FlowCanvasPage: () => <div data-testid="page-flow-canvas" />,
  ExplorePage: () => <div data-testid="page-explore" />,
  CreatorHubPage: () => <div data-testid="page-creator-hub" />,
  CreatorInsightsPage: () => <div data-testid="page-creator-insights" />,
  FormatPickerPage: () => <div data-testid="page-format-picker" />,
  EditorPage: () => <div data-testid="page-editor" />,
  SubmissionDetailPage: () => <div data-testid="page-submission-detail" />,
  JokeDetailPage: () => <div data-testid="page-joke-detail" />,
  ForgotPasswordPage: () => <div data-testid="page-forgot-password" />,
  PackDetailPage: () => <div data-testid="page-pack-detail" />,
  VerifyEmailPage: () => <div data-testid="page-verify-email" />,
  CreatorProfilePage: () => <div data-testid="page-creator-profile" />,
  // Legacy pages
  HomePageLegacy: () => <div data-testid="page-home-legacy" />,
  TrendingPageLegacy: () => <div data-testid="page-trending-legacy" />,
  FavoritesPageLegacy: () => <div data-testid="page-favorites-legacy" />,
  DraftsPageLegacy: () => <div data-testid="page-drafts-legacy" />,
  ProfilePageLegacy: () => <div data-testid="page-profile-legacy" />,
  SettingsPageLegacy: () => <div data-testid="page-settings-legacy" />,
  SubmitJokePageLegacy: () => <div data-testid="page-submit-legacy" />,
  OnboardingPage: () => <div data-testid="page-onboarding" />,
  // These stay on disk but are not imported by routes.tsx anymore:
  DraftsPage: () => <div data-testid="page-drafts" />,
  SubmitJokePage: () => <div data-testid="page-submit" />,
}))

// ── ProtectedRoute → passthrough (no auth check in route tests) ───────────────
vi.mock('@/app/providers/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── GuestOnlyRoute → passthrough ─────────────────────────────────────────────
vi.mock('@/app/providers/GuestOnlyRoute', () => ({
  GuestOnlyRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── Legacy Layout → passthrough ───────────────────────────────────────────────
vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('redirect routes', () => {
  it('/submit redirects to /create/new', async () => {
    renderAt('/submit')
    // After redirect, FormatPickerPage should render
    expect(await screen.findByTestId('page-format-picker')).toBeInTheDocument()
  })

  it('/drafts redirects to /create', async () => {
    renderAt('/drafts')
    // After redirect, CreatorHubPage should render
    expect(await screen.findByTestId('page-creator-hub')).toBeInTheDocument()
  })
})

describe('create routes', () => {
  it('/create renders CreatorHubPage', async () => {
    renderAt('/create')
    expect(await screen.findByTestId('page-creator-hub')).toBeInTheDocument()
  })

  it('/create/insights renders CreatorInsightsPage', async () => {
    renderAt('/create/insights')
    expect(await screen.findByTestId('page-creator-insights')).toBeInTheDocument()
  })

  it('/create/new renders FormatPickerPage', async () => {
    renderAt('/create/new')
    expect(await screen.findByTestId('page-format-picker')).toBeInTheDocument()
  })

  it('/create/new/:formatSlug renders EditorPage (not captured as :draftId)', async () => {
    renderAt('/create/new/oneliner')
    expect(await screen.findByTestId('page-editor')).toBeInTheDocument()
  })

  it('/create/:draftId renders EditorPage', async () => {
    renderAt('/create/42')
    expect(await screen.findByTestId('page-editor')).toBeInTheDocument()
  })

  it('/create/:draftId/view renders SubmissionDetailPage', async () => {
    renderAt('/create/42/view')
    expect(await screen.findByTestId('page-submission-detail')).toBeInTheDocument()
  })
})
