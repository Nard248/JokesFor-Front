import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AlertCircle, RefreshCw, Search } from 'lucide-react'
import { useJokeSearch } from '@/features/jokes'
import type { JokeSearchParams } from '@/features/jokes'
import { JokeCard } from '@/components/JokeCard'
import { ProCommunityCard } from '@/components/ProCommunityCard'
import { EditorsPickCard } from '@/components/EditorsPickCard'
import { Pagination } from '@/components/Pagination'
import { SortButtons } from '@/components/search/SortButtons'
import { DesktopFiltersSidebar } from '@/components/search/DesktopFiltersSidebar'
import { MobileFilterChips } from '@/components/search/MobileFilterChips'
import { Button } from '@/components/ui/button'
import { mockJokes } from '@/lib/mock-data'

function parseSearchParams(urlParams: URLSearchParams): JokeSearchParams {
  return {
    q: urlParams.get('q') || undefined,
    tones: urlParams.get('tones') || undefined,
    age_rating: urlParams.get('age_rating') || undefined,
    joke_format: urlParams.get('joke_format') || undefined,
    page: urlParams.get('page') ? parseInt(urlParams.get('page')!, 10) : 1,
  }
}

function toURLSearchParams(params: JokeSearchParams): URLSearchParams {
  const urlParams = new URLSearchParams()
  if (params.q) urlParams.set('q', params.q)
  if (params.tones) urlParams.set('tones', params.tones)
  if (params.age_rating) urlParams.set('age_rating', params.age_rating)
  if (params.joke_format) urlParams.set('joke_format', params.joke_format)
  if (params.page && params.page > 1) urlParams.set('page', params.page.toString())
  return urlParams
}

function JokeCardSkeleton() {
  return (
    <div className="bg-[#FAFAFA] rounded-[48px] p-6 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-[#E9E8E7] rounded-full w-16" />
        <div className="h-5 bg-[#E9E8E7] rounded-full w-20" />
      </div>
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-[#E9E8E7] rounded w-3/4" />
        <div className="h-4 bg-[#E9E8E7] rounded w-full" />
        <div className="h-4 bg-[#E9E8E7] rounded w-2/3" />
      </div>
      <hr className="border-[#E9E8E7] my-4" />
      <div className="flex items-center gap-2">
        <div className="size-8 bg-[#E9E8E7] rounded-full" />
        <div className="h-3 bg-[#E9E8E7] rounded w-24" />
      </div>
    </div>
  )
}

export function SearchPage() {
  const [urlParams, setUrlParams] = useSearchParams()
  const filters = useMemo(() => parseSearchParams(urlParams), [urlParams])
  const [sort, setSort] = useState('relevance')
  const [sidebarFilters, setSidebarFilters] = useState({
    ageRating: '',
    humorTypes: [] as string[],
    situation: '',
    format: '',
  })
  const [mobileFilters, setMobileFilters] = useState<string[]>([])

  const { data, isLoading, isError, error, refetch, isFetching } = useJokeSearch(filters)

  const handleFiltersChange = useCallback(
    (newFilters: JokeSearchParams) => {
      setUrlParams(toURLSearchParams(newFilters))
    },
    [setUrlParams]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      handleFiltersChange({ ...filters, page })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [filters, handleFiltersChange]
  )

  // Use query data when available, otherwise show all mock jokes
  const jokes = data ? data.results : mockJokes
  const totalCount = data ? data.count : mockJokes.length
  const totalPages = Math.ceil(totalCount / 10)
  const currentPage = filters.page || 1
  const queryLabel = filters.q || 'Office humor'

  // Sidebar for Layout
  const filterSidebar = (
    <DesktopFiltersSidebar
      filters={sidebarFilters}
      onChange={setSidebarFilters}
    />
  )

  return (
    <div className="flex w-full">
      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block shrink-0">
        {filterSidebar}
      </div>

      <div className="flex-1 min-w-0 px-4 lg:px-8 py-6 lg:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-black text-3xl lg:text-5xl text-[#2E2F2F] mb-2">
            Search Results
          </h1>
          <p className="text-[#6B7280]">
            Found <span className="font-bold text-[#6A1CF6]">{totalCount} jokes</span> for "{queryLabel}"
          </p>
        </div>

        {/* Mobile: Search + Filters */}
        <div className="lg:hidden mb-4">
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search another punchline..."
              defaultValue={filters.q}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFiltersChange({ ...filters, q: (e.target as HTMLInputElement).value, page: 1 })
                }
              }}
              className="w-full h-11 pl-11 pr-4 rounded-full border border-[#E9E8E7] bg-white text-sm outline-none focus:border-[#6A1CF6]"
            />
          </div>
          <MobileFilterChips
            activeFilters={mobileFilters}
            onToggle={(f) => setMobileFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])}
          />
        </div>

        {/* Sort (Desktop) */}
        <div className="hidden lg:flex justify-end mb-6">
          <SortButtons value={sort} onChange={setSort} />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-5 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <JokeCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="size-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-[#2E2F2F] mb-2">Something went wrong</h2>
            <p className="text-[#6B7280] mb-6 max-w-md">
              {error instanceof Error ? error.message : 'Failed to load jokes.'}
            </p>
            <Button onClick={() => refetch()} variant="pill-outline">
              <RefreshCw className="size-4 mr-2" /> Try again
            </Button>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !isError && jokes.length > 0 && (
          <>
            <div className="grid gap-5 lg:grid-cols-3">
              {jokes.slice(0, 3).map((joke) => (
                <JokeCard key={joke.id} joke={joke} showBookmark />
              ))}

              {/* Pro Community Card after 3rd card */}
              <ProCommunityCard />

              {jokes.slice(3, 6).map((joke) => (
                <JokeCard key={joke.id} joke={joke} showBookmark />
              ))}
            </div>

            {/* Editor's Pick */}
            <div className="mt-8">
              <EditorsPickCard />
            </div>

            {/* Pagination (Desktop) */}
            <div className="hidden lg:block mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>

            {/* Show More (Mobile) */}
            <div className="lg:hidden mt-8 px-4">
              <Button variant="pill-lime" size="xl" className="w-full">
                Show Me More LOLs
              </Button>
            </div>
          </>
        )}

        {isFetching && !isLoading && (
          <div className="fixed top-20 right-6 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm text-[#6B7280]">
            <RefreshCw className="size-4 animate-spin" /> Updating...
          </div>
        )}
      </div>
    </div>
  )
}
