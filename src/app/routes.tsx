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
  OnboardingPage,
  LibraryPage,
  TrendingPage,
  FavoritesPage,
  DraftsPage,
  ProfilePage,
  SettingsPage,
  SubmitJokePage,
  NotFoundPage,
} from '@/pages'

const router = createBrowserRouter([
  // Search page gets its own Layout (filter sidebar replaces nav sidebar)
  {
    path: '/search',
    element: <Layout hideDefaultSidebar hideFAB><SearchPage /></Layout>,
  },
  {
    path: '/',
    element: <Layout><Outlet /></Layout>,
    children: [
      // Public — anyone can browse
      { index: true, element: <HomePage /> },
      { path: 'daily', element: <DailyJokePage /> },
      { path: 'library', element: <LibraryPage /> },
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
  { path: '/onboarding', element: <ProtectedRoute><OnboardingPage /></ProtectedRoute> },
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
