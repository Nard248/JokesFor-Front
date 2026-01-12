import { useState, useEffect, useCallback } from 'react'
import { Search, X, Smile, Skull, Target, Briefcase, Baby, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { JokeSearchParams } from '@/features/jokes'

// Category buttons with their corresponding tones filter
const categories = [
  { label: 'Dad Jokes', slug: 'dad-joke', icon: Smile, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200' },
  { label: 'Dark Humor', slug: 'dark-humor', icon: Skull, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' },
  { label: 'Puns', slug: 'pun', icon: Target, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200' },
  { label: 'Work Safe', slug: 'work-safe', icon: Briefcase, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' },
  { label: 'Kid Friendly', slug: 'kid-friendly', icon: Baby, color: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' },
]

const ageRatings = [
  { label: 'All Ages', value: '' },
  { label: 'Kid Safe', value: 'kid-safe' },
  { label: 'Family Friendly', value: 'family-friendly' },
  { label: 'Teen', value: 'teen' },
  { label: 'Adult', value: 'adult' },
]

interface SearchFiltersProps {
  filters: JokeSearchParams
  onChange: (filters: JokeSearchParams) => void
  className?: string
}

/**
 * Search filters component with debounced search input,
 * category buttons, and age rating dropdown
 */
export function SearchFilters({ filters, onChange, className }: SearchFiltersProps) {
  const [localQuery, setLocalQuery] = useState(filters.q || '')
  const [ageDropdownOpen, setAgeDropdownOpen] = useState(false)

  // Sync local query with external filters
  useEffect(() => {
    setLocalQuery(filters.q || '')
  }, [filters.q])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== (filters.q || '')) {
        onChange({ ...filters, q: localQuery || undefined, page: 1 })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localQuery, filters, onChange])

  const handleCategoryClick = useCallback(
    (slug: string) => {
      const currentTones = filters.tones || ''
      const tonesArray = currentTones ? currentTones.split(',') : []

      let newTones: string[]
      if (tonesArray.includes(slug)) {
        newTones = tonesArray.filter((t) => t !== slug)
      } else {
        newTones = [...tonesArray, slug]
      }

      onChange({
        ...filters,
        tones: newTones.length > 0 ? newTones.join(',') : undefined,
        page: 1,
      })
    },
    [filters, onChange]
  )

  const handleAgeRatingChange = useCallback(
    (value: string) => {
      onChange({
        ...filters,
        age_rating: value || undefined,
        page: 1,
      })
      setAgeDropdownOpen(false)
    },
    [filters, onChange]
  )

  const handleClearFilters = useCallback(() => {
    setLocalQuery('')
    onChange({ page: 1 })
  }, [onChange])

  const hasActiveFilters = Boolean(filters.q || filters.tones || filters.age_rating)
  const activeTones = (filters.tones || '').split(',').filter(Boolean)
  const selectedAgeRating = ageRatings.find((r) => r.value === filters.age_rating) || ageRatings[0]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search for jokes..."
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        {localQuery && (
          <button
            type="button"
            onClick={() => setLocalQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category buttons */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = activeTones.includes(cat.slug)
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => handleCategoryClick(cat.slug)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                  isActive
                    ? `${cat.color} ring-2 ring-offset-1 ring-current`
                    : 'bg-background hover:bg-accent text-muted-foreground border-border'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Age rating dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAgeDropdownOpen(!ageDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-background border border-border hover:bg-accent transition-colors"
          >
            <span>{selectedAgeRating.label}</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', ageDropdownOpen && 'rotate-180')} />
          </button>

          {ageDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAgeDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 min-w-[150px] bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                {ageRatings.map((rating) => (
                  <button
                    key={rating.value}
                    type="button"
                    onClick={() => handleAgeRatingChange(rating.value)}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors',
                      rating.value === filters.age_rating && 'bg-accent font-medium'
                    )}
                  >
                    {rating.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
