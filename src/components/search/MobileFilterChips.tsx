import { Chip } from '@/components/ui/chip'

interface MobileFilterChipsProps {
  activeFilters: string[]
  onToggle: (filter: string) => void
}

const quickFilters = [
  { value: 'all_ages', label: 'All Ages', icon: '🎯' },
  { value: 'humor_type', label: 'Humor Type', icon: '😄' },
  { value: 'language', label: 'Language', icon: '🌐' },
]

export function MobileFilterChips({ activeFilters, onToggle }: MobileFilterChipsProps) {
  return (
    <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 -mx-4 scrollbar-hide">
      {quickFilters.map((filter) => (
        <Chip
          key={filter.value}
          selected={activeFilters.includes(filter.value)}
          onClick={() => onToggle(filter.value)}
          icon={<span>{filter.icon}</span>}
          className="shrink-0"
        >
          {filter.label}
        </Chip>
      ))}
    </div>
  )
}
