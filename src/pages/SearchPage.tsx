import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { AlertCircle, RefreshCw, Search } from 'lucide-react'
import { useJokeSearch } from '@/features/jokes'
import type { JokeSearchParams } from '@/features/jokes'
import { JokeCard } from '@/components/JokeCard'
import { SearchFilters } from '@/components/SearchFilters'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Parse URL search params into JokeSearchParams
 */
function parseSearchParams(urlParams: URLSearchParams): JokeSearchParams {
  return {
    q: urlParams.get('q') || undefined,
    tones: urlParams.get('tones') || undefined,
    age_rating: urlParams.get('age_rating') || undefined,
    joke_format: urlParams.get('joke_format') || undefined,
    page: urlParams.get('page') ? parseInt(urlParams.get('page')!, 10) : 1,
  }
}

/**
 * Convert JokeSearchParams to URLSearchParams
 */
function toURLSearchParams(params: JokeSearchParams): URLSearchParams {
  const urlParams = new URLSearchParams()
  if (params.q) urlParams.set('q', params.q)
  if (params.tones) urlParams.set('tones', params.tones)
  if (params.age_rating) urlParams.set('age_rating', params.age_rating)
  if (params.joke_format) urlParams.set('joke_format', params.joke_format)
  if (params.page && params.page > 1) urlParams.set('page', params.page.toString())
  return urlParams
}

/**
 * Loading skeleton for joke cards
 */
function JokeCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 animate-pulse">
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-muted rounded-full w-16" />
        <div className="h-5 bg-muted rounded-full w-20" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 bg-muted rounded w-12" />
        <div className="h-5 bg-muted rounded w-14" />
      </div>
    </div>
  )
}

/**
 * Main search results page
 * Displays jokes from backend with filters and pagination
 */
export function SearchPage() {
  const [urlParams, setUrlParams] = useSearchParams()
  const filters = useMemo(() => parseSearchParams(urlParams), [urlParams])

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
      // Scroll to top on page change
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [filters, handleFiltersChange]
  )

  const hasFilters = Boolean(filters.q || filters.tones || filters.age_rating || filters.joke_format)
  const jokes = data?.results || []
  const totalPages = data ? Math.ceil(data.count / 10) : 0 // Assuming page_size=10
  const currentPage = filters.page || 1

  return (
    <div className="py-6 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          Search Jokes
        </h1>
        <p className="text-muted-foreground">
          Find the perfect joke for any occasion
        </p>
      </div>

      {/* Filters */}
      <SearchFilters
        filters={filters}
        onChange={handleFiltersChange}
        className="mb-8"
      />

      {/* Results section */}
      <div className="min-h-[400px]">
        {/* Loading state */}
        {isLoading && (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <JokeCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {error instanceof Error ? error.message : 'Failed to load jokes. Please try again.'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
          </div>
        )}

        {/* Empty state - no filters */}
        {!isLoading && !isError && !hasFilters && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Start searching
            </h2>
            <p className="text-muted-foreground max-w-md">
              Enter a search term or select a category to find jokes
            </p>
          </div>
        )}

        {/* Empty state - no results */}
        {!isLoading && !isError && hasFilters && jokes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No jokes found
            </h2>
            <p className="text-muted-foreground max-w-md">
              Try adjusting your search or filters to find more jokes
            </p>
          </div>
        )}

        {/* Results grid */}
        {!isLoading && !isError && jokes.length > 0 && (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {data?.count} joke{data?.count !== 1 ? 's' : ''} found
              </p>
              {isFetching && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating...
                </div>
              )}
            </div>

            {/* Jokes grid */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jokes.map((joke) => (
                <JokeCard key={joke.id} joke={joke} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isFetching}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isFetching}
                        className={cn(
                          'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                          pageNum === currentPage
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent text-muted-foreground'
                        )}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isFetching}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}
