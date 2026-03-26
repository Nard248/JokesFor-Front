import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center font-bold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-[#6A1CF6] text-white',
        lime: 'bg-[#CAFD00] text-[#3A4A00]',
        amber: 'bg-[#FFC965] text-[#5F4200]',
        purple: 'bg-[#F7F0FF] text-[#6A1CF6]',
        outline: 'border border-[#E3E2E2] text-[#52525B] bg-transparent',
        hot: 'bg-[#6A1CF6] text-white',
        muted: 'bg-[#F2F0F0] text-[#52525B]',
      },
      size: {
        default: 'px-3 py-1 text-[10px] rounded-full',
        sm: 'px-2 py-0.5 text-[9px] rounded-full',
        lg: 'px-4 py-1.5 text-xs rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}
