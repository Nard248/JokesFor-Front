import { Plus, Zap, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CollectionCardProps {
  variant: 'image-overlay' | 'accent' | 'new'
  title?: string
  description?: string
  jokeCount?: number
  imageUrl?: string
  bgColor?: string
  className?: string
  onClick?: () => void
  size?: 'lg' | 'md' | 'sm'
}

export function CollectionCard({
  variant,
  title,
  description,
  jokeCount,
  imageUrl,
  bgColor,
  className,
  onClick,
  size = 'md',
}: CollectionCardProps) {
  if (variant === 'new') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'rounded-[32px] border-2 border-dashed border-[#DDDCDC] flex flex-col items-center justify-center gap-2 hover:border-[#AC8EFF] hover:bg-[#F7F0FF] transition-all',
          size === 'lg' ? 'min-h-[280px]' : 'min-h-[180px]',
          className
        )}
      >
        <div className="size-12 rounded-full bg-[#F2F0F0] flex items-center justify-center">
          <Plus className="size-5 text-[#6B7280]" />
        </div>
        <span className="text-sm font-medium text-[#6B7280]">New Collection</span>
      </button>
    )
  }

  if (variant === 'accent') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'rounded-[32px] p-5 flex flex-col justify-between relative overflow-hidden transition-transform hover:scale-[1.02]',
          size === 'lg' ? 'min-h-[280px]' : 'min-h-[180px]',
          className
        )}
        style={{ backgroundColor: bgColor || '#FFC965' }}
      >
        <div className="flex items-center justify-between">
          <Zap className="size-6 text-[#5F4200]" />
          <ArrowUpRight className="size-5 text-[#5F4200]/50" />
        </div>
        <div className="text-left">
          <h3 className="font-display font-bold text-lg text-[#2E2F2F]">{title}</h3>
          {description && <p className="text-sm text-[#5F4200] mt-1">{description}</p>}
        </div>
      </button>
    )
  }

  // image-overlay
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-[32px] relative overflow-hidden group transition-transform hover:scale-[1.02]',
        size === 'lg' ? 'min-h-[280px]' : 'min-h-[180px]',
        className
      )}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="relative z-10 flex flex-col justify-end h-full p-5 text-left text-white">
        {jokeCount != null && (
          <Badge variant="lime" size="default" className="mb-2 self-start">
            {jokeCount} Jokes
          </Badge>
        )}
        <h3 className="font-display font-bold text-lg">{title}</h3>
        {description && <p className="text-sm text-white/70 mt-1">{description}</p>}
      </div>
    </button>
  )
}
