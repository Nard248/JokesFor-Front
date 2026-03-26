import { Chip } from '@/components/ui/chip'
import { cn } from '@/lib/utils'

interface Filters {
  ageRating: string
  humorTypes: string[]
  situation: string
  format: string
}

interface DesktopFiltersSidebarProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

const ageRanges = [
  { value: 'kid_safe', label: 'Kids (3-12)' },
  { value: 'teen', label: 'Teens (13-19)' },
  { value: 'adult', label: 'Adults (18+)' },
]

const humorTypes = [
  { value: 'punny', label: 'Punny' },
  { value: 'sarcastic', label: 'Sarcastic' },
  { value: 'dark', label: 'Dark' },
  { value: 'slapstick', label: 'Slapstick' },
]

const situations = [
  { value: '', label: 'All' },
  { value: 'office', label: 'Office / Work' },
  { value: 'school', label: 'School' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'social_media', label: 'Social Media' },
]

export function DesktopFiltersSidebar({ filters, onChange }: DesktopFiltersSidebarProps) {
  const updateFilter = (key: keyof Filters, value: Filters[keyof Filters]) => {
    onChange({ ...filters, [key]: value })
  }

  const toggleHumorType = (type: string) => {
    const current = filters.humorTypes
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    updateFilter('humorTypes', next)
  }

  return (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 h-[calc(100vh-64px)] sticky top-16 p-5 overflow-y-auto">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-4">Filters</h3>

      {/* Age Range */}
      <div className="mb-6">
        <h4 className="font-semibold text-sm text-[#2E2F2F] mb-3">Age Range</h4>
        <div className="space-y-2">
          {ageRanges.map((age) => (
            <label key={age.value} className="flex items-center gap-2 cursor-pointer">
              <div className={cn(
                'size-5 rounded-full border-2 flex items-center justify-center transition-colors',
                filters.ageRating === age.value
                  ? 'border-[#CAFD00] bg-[#CAFD00]'
                  : 'border-[#DDDCDC]'
              )}>
                {filters.ageRating === age.value && (
                  <svg className="size-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="#3A4A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-sm text-[#2E2F2F]">{age.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Humor Type */}
      <div className="mb-6">
        <h4 className="font-semibold text-sm text-[#2E2F2F] mb-3">Humor Type</h4>
        <div className="flex flex-wrap gap-2">
          {humorTypes.map((type) => (
            <Chip
              key={type.value}
              selected={filters.humorTypes.includes(type.value)}
              onClick={() => toggleHumorType(type.value)}
              className="text-xs px-3 py-1.5"
            >
              {type.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Situation */}
      <div className="mb-6">
        <h4 className="font-semibold text-sm text-[#2E2F2F] mb-3">Situation</h4>
        <select
          value={filters.situation}
          onChange={(e) => updateFilter('situation', e.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-[#E9E8E7] bg-white text-sm text-[#2E2F2F] outline-none focus:border-[#6A1CF6]"
        >
          {situations.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Format */}
      <div className="mb-6">
        <h4 className="font-semibold text-sm text-[#2E2F2F] mb-3">Format</h4>
        <div className="flex bg-[#F2F0F0] rounded-full p-1">
          {[
            { value: '', label: 'One-Liner' },
            { value: 'short_story', label: 'Short Story' },
          ].map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => updateFilter('format', filters.format === fmt.value ? '' : fmt.value)}
              className={cn(
                'flex-1 py-2 px-3 rounded-full text-xs font-semibold transition-all text-center',
                filters.format === fmt.value
                  ? 'bg-[#6A1CF6] text-white shadow-sm'
                  : 'text-[#6B7280]'
              )}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
