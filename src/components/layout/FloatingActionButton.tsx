import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FABProps {
  onClick?: () => void
  className?: string
}

export function FloatingActionButton({ onClick, className }: FABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-40 size-14 rounded-full bg-[#6A1CF6] text-white flex items-center justify-center',
        'shadow-[var(--shadow-fab)] hover:bg-[#5D00E4] transition-all hover:scale-105',
        'bottom-6 right-6 lg:bottom-8 lg:right-8',
        'max-lg:bottom-24', // Above mobile bottom nav
        className
      )}
    >
      <Plus className="size-6" />
    </button>
  )
}
