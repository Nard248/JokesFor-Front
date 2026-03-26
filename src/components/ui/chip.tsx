import { cn } from '@/lib/utils'

interface ChipProps {
  selected?: boolean
  onClick?: () => void
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function Chip({ selected, onClick, children, icon, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border-2',
        selected
          ? 'bg-[#CAFD00]/20 border-[#CAFD00] text-[#3A4A00]'
          : 'bg-white border-[#E9E8E7] text-[#52525B] hover:border-[#AC8EFF] hover:bg-[#F7F0FF]',
        className
      )}
    >
      {icon}
      {children}
    </button>
  )
}
