import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: 'lg' | 'md' | 'sm'
  hover?: boolean
}

const radiusMap = {
  lg: 'rounded-[48px]',
  md: 'rounded-[32px]',
  sm: 'rounded-[16px]',
}

export function Card({ className, radius = 'lg', hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#FAFAFA] p-6',
        radiusMap[radius],
        hover && 'transition-shadow hover:shadow-[0_8px_30px_rgba(46,47,47,0.08)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
