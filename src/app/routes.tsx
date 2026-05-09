import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router'
import { Layout } from '@/components/Layout'
import {
  HomePage,
  SearchPage,
  DailyJokePage,
  LoginPage,
  RegisterPage,
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
      { index: true, element: <HomePage /> },
      { path: 'daily', element: <DailyJokePage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'trending', element: <TrendingPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'drafts', element: <DraftsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      // Backward compat
      { path: 'collections', element: <Navigate to="/library" replace /> },
    ],
  },
  // Standalone pages (no Layout shell)
  { path: '/submit', element: <SubmitJokePage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  // Catch-all
  { path: '*', element: <NotFoundPage /> },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
