import { useState } from 'react'
import { useAuth, useLogout } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Menu, X, Sparkles, Search, CalendarDays, Bookmark, Laugh } from 'lucide-react'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuth()
  const logoutMutation = useLogout()

  const navLinks = [
    { href: '/', label: 'Search', icon: Search },
    { href: '/daily', label: 'Daily', icon: CalendarDays },
    { href: '/collections', label: 'Saved', icon: Bookmark },
  ]

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <Laugh className="w-7 h-7 text-primary group-hover:rotate-12 transition-transform" />
            <span className="text-xl font-display font-bold text-primary group-hover:text-primary-dark transition-colors">
              Jokes For
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </a>
              )
            })}
          </div>

          {/* Auth Section - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium truncate max-w-32">
                    {user?.email?.split('@')[0]}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/login">Login</a>
                </Button>
                <Button size="sm" asChild>
                  <a href="/register" className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Sign Up
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -mr-2 text-foreground/70 hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </a>
                )
              })}

              <div className="my-2 border-t border-border" />

              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    Signed in as {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      logoutMutation.mutate()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    className="flex items-center justify-center gap-2 mx-4 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Sparkles className="w-4 h-4" />
                    Sign Up Free
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
