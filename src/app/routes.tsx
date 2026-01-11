import { createBrowserRouter, RouterProvider, Outlet } from 'react-router'
import { Layout } from '@/components/Layout'

// Stub pages - will be implemented in Phase 12
function HomePage() {
  return (
    <div className="py-8 md:py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4">
          Find Your{' '}
          <span className="text-primary">Perfect Joke</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Search thousands of jokes by mood, occasion, and style.
          From dad jokes to dark humor, we've got you covered. 😏
        </p>
      </div>

      {/* Search placeholder */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for jokes..."
            className="w-full px-6 py-4 text-lg rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none transition-colors"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Quick categories */}
      <div className="flex flex-wrap justify-center gap-3">
        {['😄 Dad Jokes', '😈 Dark Humor', '🎯 Puns', '💼 Work Appropriate', '👶 Kid Friendly'].map((tag) => (
          <button
            key={tag}
            className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-foreground/70 hover:text-foreground transition-all"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
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
