import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router'
import type { RouteObject } from 'react-router'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from './providers/ProtectedRoute'
import { GuestOnlyRoute } from './providers/GuestOnlyRoute'
import {
  // Redesigned (current design system + FlowAppShell)
  HomePage,
  SearchPage,
  DailyJokePage,
  LoginPage,
  RegisterPage,
  GoogleCallbackPage,
  LibraryPage,
  TrendingPage,
  FavoritesPage,
  ProfilePage,
  SettingsPage,
  NotFoundPage,
  FlowPage,
  FlowCanvasPage,
  ExplorePage,
  // Content creation (Phase 5)
  CreatorHubPage,
  FormatPickerPage,
  EditorPage,
  SubmissionDetailPage,
  // Legacy — preserved at /legacy/<path> mirror routes
  HomePageLegacy,
  TrendingPageLegacy,
  FavoritesPageLegacy,
  DraftsPageLegacy,
  ProfilePageLegacy,
  SettingsPageLegacy,
  SubmitJokePageLegacy,
  // Iteration 5 — new pages
  JokeDetailPage,
  ForgotPasswordPage,
  PackDetailPage,
  VerifyEmailPage,
} from '@/pages'

export const routes: RouteObject[] = [
  // ─────────────────────────────────────────────────────────────────────
  // Canonical routes — all redesigned, all using FlowAppShell internally.
  // None of them get wrapped in the legacy `Layout` anymore.
  // ─────────────────────────────────────────────────────────────────────

  // Public
  { path: '/', element: <HomePage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/daily', element: <DailyJokePage /> },
  { path: '/library', element: <LibraryPage /> },
  { path: '/trending', element: <TrendingPage /> },

  // Authenticated
  { path: '/favorites', element: <ProtectedRoute><FavoritesPage /></ProtectedRoute> },
  { path: '/profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
  { path: '/settings', element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },

  // Content creation — /create/* (new-first to avoid "new" matching :draftId)
  { path: '/create', element: <ProtectedRoute><CreatorHubPage /></ProtectedRoute> },
  { path: '/create/new', element: <ProtectedRoute><FormatPickerPage /></ProtectedRoute> },
  { path: '/create/new/:formatSlug', element: <ProtectedRoute><EditorPage /></ProtectedRoute> },
  { path: '/create/:draftId', element: <ProtectedRoute><EditorPage /></ProtectedRoute> },
  { path: '/create/:draftId/view', element: <ProtectedRoute><SubmissionDetailPage /></ProtectedRoute> },

  // Legacy submit/drafts redirects → new create routes
  { path: '/submit', element: <Navigate to="/create/new" replace /> },
  { path: '/drafts', element: <Navigate to="/create" replace /> },

  // Redesigned flow
  { path: '/flow', element: <ProtectedRoute><FlowPage /></ProtectedRoute> },
  { path: '/flow-canvas', element: <ProtectedRoute><FlowCanvasPage /></ProtectedRoute> },
  { path: '/explore', element: <ProtectedRoute><ExplorePage /></ProtectedRoute> },

  // Auth
  { path: '/login', element: <GuestOnlyRoute><LoginPage /></GuestOnlyRoute> },
  { path: '/register', element: <GuestOnlyRoute><RegisterPage /></GuestOnlyRoute> },
  { path: '/verify-email', element: <GuestOnlyRoute><VerifyEmailPage /></GuestOnlyRoute> },
  { path: '/auth/google/callback', element: <GoogleCallbackPage /> },
  // Forgot/reset password — single component, branches on URL.
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ForgotPasswordPage /> },

  // Joke detail (logs JokeView server-side via ?source=)
  { path: '/jokes/:id', element: <JokeDetailPage /> },

  // Joke pack detail (editorial bundle)
  { path: '/packs/:slug', element: <PackDetailPage /> },

  // Backward compat aliases
  { path: '/collections', element: <Navigate to="/library" replace /> },
  { path: '/onboarding', element: <Navigate to="/flow" replace /> },

  // ─────────────────────────────────────────────────────────────────────
  // /legacy/* — preserved old design versions for reference + reversion.
  // Wrapped in the legacy `Layout` because that's the chrome they were
  // designed for. Not linked from any nav; reachable by direct URL only.
  // Retire these once the redesigned versions are reviewed and approved.
  // ─────────────────────────────────────────────────────────────────────
  {
    path: '/legacy',
    element: <Layout><LegacyOutlet /></Layout>,
    children: [
      { index: true, element: <HomePageLegacy /> },
      { path: 'trending', element: <TrendingPageLegacy /> },
      { path: 'favorites', element: <ProtectedRoute><FavoritesPageLegacy /></ProtectedRoute> },
      { path: 'drafts', element: <ProtectedRoute><DraftsPageLegacy /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePageLegacy /></ProtectedRoute> },
      { path: 'settings', element: <ProtectedRoute><SettingsPageLegacy /></ProtectedRoute> },
    ],
  },
  // /legacy/submit — Submit had no Layout wrapper in legacy; keep that.
  { path: '/legacy/submit', element: <ProtectedRoute><SubmitJokePageLegacy /></ProtectedRoute> },

  // Catch-all
  { path: '*', element: <NotFoundPage /> },
]

const router = createBrowserRouter(routes)

function LegacyOutlet() {
  return <Outlet />
}

export function AppRoutes() {
  return <RouterProvider router={router} />
}
