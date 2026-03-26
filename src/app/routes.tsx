import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router'
import { Layout } from '@/components/Layout'
import { HomePage, SearchPage, DailyJokePage, LoginPage, RegisterPage, OnboardingPage, LibraryPage } from '@/pages'

function TrendingPage() {
  return <div className="p-8"><h1 className="font-display font-bold text-3xl">Trending</h1><p className="text-[#6B7280] mt-2">Coming soon...</p></div>
}

function SettingsPage() {
  return <div className="p-8"><h1 className="font-display font-bold text-3xl">Settings</h1><p className="text-[#6B7280] mt-2">Coming soon...</p></div>
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F6F6]">
      <h1 className="font-display font-black text-6xl text-[#6A1CF6] mb-4">404</h1>
      <p className="text-[#6B7280] text-lg">This joke doesn't exist... yet.</p>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Outlet /></Layout>,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'daily', element: <DailyJokePage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'trending', element: <TrendingPage /> },
      { path: 'favorites', element: <TrendingPage /> },
      { path: 'drafts', element: <TrendingPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'profile', element: <SettingsPage /> },
      // Backward compat
      { path: 'collections', element: <Navigate to="/library" replace /> },
    ],
  },
  // Standalone pages (no Layout shell)
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  // Catch-all
  { path: '*', element: <NotFoundPage /> },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
