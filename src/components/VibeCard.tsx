import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'

interface VibeCardProps {
  title: string
  icon?: string
  gradient?: string
  size?: 'lg' | 'sm'
  searchQuery?: string
  className?: string
}

const defaultGradients: Record<string, string> = {
  'Wholesome & Pure': 'from-purple-400 to-purple-600',
  'Quick Puns': 'from-lime-300 to-lime-400',
  'Classic Dad': 'from-amber-300 to-amber-400',
}

export function VibeCard({ title, icon, gradient, size = 'sm', searchQuery, className }: VibeCardProps) {
  const navigate = useNavigate()
  const bg = gradient || defaultGradients[title] || 'from-purple-400 to-purple-600'

  return (
    <button
      onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery || title)}`)}
      className={cn(
        'relative rounded-[32px] bg-gradient-to-br text-white overflow-hidden transition-transform hover:scale-[1.02]',
        bg,
        size === 'lg' ? 'p-6 min-h-[180px]' : 'p-4 min-h-[100px]',
        className
      )}
    >
      {/* Decorative circle */}
      <div className={cn(
        'absolute rounded-full bg-white/10',
        size === 'lg' ? 'size-32 -top-6 -right-6' : 'size-20 -top-4 -right-4'
      )} />

      <div className="relative z-10 flex flex-col justify-end h-full text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider mb-1 text-white/70">Vibe</span>
        <span className={cn(
          'font-display font-bold leading-tight',
          size === 'lg' ? 'text-xl' : 'text-base'
        )}>
          {icon && <span className="mr-1">{icon}</span>}
          {title}
        </span>
      </div>
    </button>
  )
}
