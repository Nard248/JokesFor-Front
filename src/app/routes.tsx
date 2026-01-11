import { createBrowserRouter, RouterProvider, Outlet } from 'react-router'
import { Layout } from '@/components/Layout'

// Stub pages - will be implemented in Phase 12
function HomePage() {
  return <div className="p-4"><h1 className="text-2xl font-display">Search Jokes</h1></div>
}

function LoginPage() {
  return <div className="min-h-screen flex items-center justify-center"><h1>Login</h1></div>
}

function RegisterPage() {
  return <div className="min-h-screen flex items-center justify-center"><h1>Register</h1></div>
}

function DailyJokePage() {
  return <div className="p-4"><h1 className="text-2xl font-display">Daily Joke</h1></div>
}

function CollectionsPage() {
  return <div className="p-4"><h1 className="text-2xl font-display">My Collections</h1></div>
}

function SettingsPage() {
  return <div className="p-4"><h1 className="text-2xl font-display">Settings</h1></div>
}

function NotFoundPage() {
  return <div className="min-h-screen flex items-center justify-center"><h1>404 - Not Found</h1></div>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Outlet /></Layout>,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'daily', element: <DailyJokePage /> },
      { path: 'collections', element: <CollectionsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  // Auth pages without main layout
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  // Catch-all
  { path: '*', element: <NotFoundPage /> },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
