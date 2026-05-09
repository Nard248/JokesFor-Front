import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from './providers/ProtectedRoute'
import { GuestOnlyRoute } from './providers/GuestOnlyRoute'
import {
  HomePage,
  SearchPage,
  DailyJokePage,
  LoginPage,
  RegisterPage,
  GoogleCallbackPage,
  LibraryPage,
  TrendingPage,
  FavoritesPage,
  DraftsPage,
  ProfilePage,
  SettingsPage,
  SubmitJokePage,
  NotFoundPage,
  FlowPage,
  FlowCanvasPage,
  ExplorePage,
} from '@/pages'

const router = createBrowserRouter([
  // Search now uses FlowAppShell internally (redesign), so no Layout wrapper.
  // Public route — utility-first promise: search works for anonymous users.
  { path: '/search', element: <SearchPage /> },
  {
    path: '/',
    element: <Layout><Outlet /></Layout>,
    children: [
      // Public — anyone can browse
      { index: true, element: <HomePage /> },
      { path: 'trending', element: <TrendingPage /> },
      // Authenticated only
      { path: 'favorites', element: <ProtectedRoute><FavoritesPage /></ProtectedRoute> },
      { path: 'drafts', element: <ProtectedRoute><DraftsPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: 'settings', element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
      // Backward compat
      { path: 'collections', element: <Navigate to="/library" replace /> },
    ],
  },
  // Standalone authenticated pages (no Layout shell)
  { path: '/submit', element: <ProtectedRoute><SubmitJokePage /></ProtectedRoute> },
  // /onboarding kept as alias for backward compat — points at the redesigned /flow.
  // OnboardingPage (legacy component) stays in code, no longer routed.
  { path: '/onboarding', element: <Navigate to="/flow" replace /> },
  // Redesigned user flow — each provides its own FlowAppShell, no legacy Layout.
  { path: '/flow', element: <ProtectedRoute><FlowPage /></ProtectedRoute> },
  { path: '/flow-canvas', element: <ProtectedRoute><FlowCanvasPage /></ProtectedRoute> },
  { path: '/explore', element: <ProtectedRoute><ExplorePage /></ProtectedRoute> },
  // Library + Daily — reskinned in iteration 4 with FlowAppShell. Hoisted out of
  // the legacy Layout-wrapped subtree so the chrome doesn't double-stack.
  { path: '/library', element: <LibraryPage /> },
  { path: '/daily', element: <DailyJokePage /> },
  // Guest-only — redirect home if already signed in
  { path: '/login', element: <GuestOnlyRoute><LoginPage /></GuestOnlyRoute> },
  { path: '/register', element: <GuestOnlyRoute><RegisterPage /></GuestOnlyRoute> },
  // OAuth callback — must process even if user state is uncertain (no guard)
  { path: '/auth/google/callback', element: <GoogleCallbackPage /> },
  // Catch-all
  { path: '*', element: <NotFoundPage /> },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
