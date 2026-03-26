import { cn } from '@/lib/utils'

interface SortButtonsProps {
  value: string
  onChange: (value: string) => void
}

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'most_liked', label: 'Most Liked' },
]

export function SortButtons({ value, onChange }: SortButtonsProps) {
  return (
    <div className="flex items-center gap-1 bg-[#F2F0F0] rounded-full p-1">
      {sortOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
            value === opt.value
              ? 'bg-white text-[#2E2F2F] shadow-sm'
              : 'text-[#6B7280] hover:text-[#2E2F2F]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
