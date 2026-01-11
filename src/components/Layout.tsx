import type { ReactNode } from 'react'
import { useUIStore } from '@/stores/ui.store'
import { useAuth, useLogout } from '@/features/auth'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore()
  const { user, isAuthenticated, isLoading } = useAuth()
  const logoutMutation = useLogout()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 p-4">
        <nav className="container mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-display font-bold text-primary">
            Jokes For
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/daily" className="text-foreground/70 hover:text-foreground">Daily</a>
            <a href="/collections" className="text-foreground/70 hover:text-foreground">Collections</a>
            <a href="/settings" className="text-foreground/70 hover:text-foreground">Settings</a>

            {isLoading ? (
              <span className="text-sm text-foreground/50">Loading...</span>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground/70">{user?.email}</span>
                <button
                  onClick={() => logoutMutation.mutate()}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <a href="/login" className="text-primary hover:text-primary/80">
                Login
              </a>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            <a href="/daily" className="block py-2 text-foreground/70 hover:text-foreground">Daily</a>
            <a href="/collections" className="block py-2 text-foreground/70 hover:text-foreground">Collections</a>
            <a href="/settings" className="block py-2 text-foreground/70 hover:text-foreground">Settings</a>
            {isAuthenticated ? (
              <button
                onClick={() => logoutMutation.mutate()}
                className="block py-2 text-red-500"
              >
                Logout ({user?.email})
              </button>
            ) : (
              <a href="/login" className="block py-2 text-primary">Login</a>
            )}
          </div>
        )}
      </header>

      <main className="container mx-auto">
        {children}
      </main>
    </div>
  )
}
