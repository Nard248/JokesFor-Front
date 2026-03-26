import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
}

function hashColor(str: string): string {
  const colors = ['#6A1CF6', '#7C3AED', '#AC8EFF', '#CAFD00', '#FFC965', '#A3E635']
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

interface AvatarProps {
  src?: string
  initials?: string
  name?: string
  size?: keyof typeof sizeMap
  color?: string
  className?: string
}

export function Avatar({ src, initials, name, size = 'md', color, className }: AvatarProps) {
  const bgColor = color || (name ? hashColor(name) : '#6A1CF6')
  const displayInitials = initials || (name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?')

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0',
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {displayInitials}
    </div>
  )
}
