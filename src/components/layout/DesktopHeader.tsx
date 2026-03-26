import { Link, useNavigate } from 'react-router'
import { Search, Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/features/auth'
import { useState } from 'react'

const navLinks = [
  { label: 'Browse', path: '/search' },
  { label: 'Categories', path: '/search?view=categories' },
  { label: 'Top Rated', path: '/search?sort=top' },
  { label: 'Submit', path: '/submit' },
]

export function DesktopHeader() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="hidden lg:flex sticky top-0 z-50 w-full items-center justify-between h-16 px-6 glass shadow-[var(--shadow-header)]">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-8">
        <Link to="/">
          <img src="/Logos/compact_light.svg" alt="Jokes For" className="h-9" />
        </Link>
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="font-display text-base font-medium text-[#2E2F2F] hover:text-[#6A1CF6] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Center: Search */}
      <form onSubmit={handleSearch} className="flex items-center max-w-sm w-full">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search for jokes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full border border-[#E9E8E7] bg-white/70 text-sm outline-none focus:border-[#6A1CF6] focus:ring-2 focus:ring-[#6A1CF6]/20 transition-all"
          />
        </div>
      </form>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button className="size-9 flex items-center justify-center rounded-full hover:bg-[#F7F0FF] transition-colors">
          <Bell className="size-5 text-[#52525B]" />
        </button>
        <button className="size-9 flex items-center justify-center rounded-full hover:bg-[#F7F0FF] transition-colors">
          <Settings className="size-5 text-[#52525B]" />
        </button>
        <Button variant="pill" size="sm" className="rounded-full px-5 h-9" onClick={() => navigate('/search')}>
          Get Laughs
        </Button>
        {isAuthenticated ? (
          <Avatar
            name={`${user?.first_name || ''} ${user?.last_name || ''}`}
            size="sm"
          />
        ) : (
          <Button variant="pill-ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        )}
      </div>
    </header>
  )
}
