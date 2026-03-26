import { NavLink, useLocation } from 'react-router'
import { Home, TrendingUp, Smile, Heart, FileText, Plus } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mockUser } from '@/lib/mock-data'

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: TrendingUp, label: 'Trending', path: '/trending' },
  { icon: Smile, label: 'My Jokes', path: '/library' },
  { icon: Heart, label: 'Favorites', path: '/favorites' },
  { icon: FileText, label: 'Drafts', path: '/drafts' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 h-[calc(100vh-64px)] sticky top-16 bg-[#FAFAFA] border-r border-[#E9E8E7] p-5">
      {/* User Profile */}
      <div className="flex items-center gap-3 mb-8">
        <Avatar name={`${mockUser.first_name} ${mockUser.last_name}`} size="md" color="#6A1CF6" />
        <div className="min-w-0">
          <p className="font-display font-bold text-sm text-[#2E2F2F] truncate">
            {mockUser.first_name} {mockUser.last_name}
          </p>
          <p className="text-xs text-[#6B7280]">Premium Member</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/library' && location.pathname === '/library')
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#CAFD00] text-[#3A4A00] font-bold'
                  : 'text-[#52525B] hover:bg-[#F2F0F0]'
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Add New Joke Button */}
      <Button variant="pill-lime" className="w-full mt-4 gap-2">
        <Plus className="size-4" />
        Add New Joke
      </Button>
    </aside>
  )
}
