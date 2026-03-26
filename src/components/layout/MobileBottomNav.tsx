import { NavLink } from 'react-router'
import { Sparkles, Search, Bookmark, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { icon: Sparkles, label: 'Daily', path: '/daily' },
  { icon: Search, label: 'Explore', path: '/search' },
  { icon: Bookmark, label: 'Saved', path: '/library' },
  { icon: User, label: 'Profile', path: '/profile' },
]

export function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E9E8E7] safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]',
                isActive
                  ? 'text-[#6A1CF6]'
                  : 'text-[#6B7280] hover:text-[#52525B]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'flex items-center justify-center size-8 rounded-full transition-colors',
                  isActive && 'bg-[#CAFD00]'
                )}>
                  <tab.icon className="size-5" />
                </div>
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
