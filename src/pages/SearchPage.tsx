import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { Search as SearchIcon, X } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard } from '@/components/FlowJokeCard'
import { jokeToFlowData } from '@/components/flowJokeData'
import { FLOW_FORMAT_TO_BACKEND_SLUG } from '@/components/jokeFormats'
import { useInfiniteJokeSearch, type JokeSearchParams } from '@/features/jokes'
import { useFormats, useTones, useContextTags } from '@/features/create/queries'
import { useBrowseSelection } from '@/features/discovery/context'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Seo } from '@/lib/seo'
import './search.css'

const FILTER_KEYS = ['joke_format', 'categories', 'themes'] as const
type FilterKey = typeof FILTER_KEYS[number]
const splitSlugs = (value: string | null) => [...new Set((value ?? '').split(',').map((slug) => slug.trim()).filter(Boolean))].sort()

function searchError(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: { q?: unknown; detail?: unknown } } } | null)?.response
  const validation = response?.data?.q
  if (typeof validation === 'string') return validation
  if (Array.isArray(validation) && validation.every((value) => typeof value === 'string')) return validation.join(' ')
  if (response?.status === 429) return 'Too many searches at once. Wait a moment, then try again.'
  return 'We could not load these jokes. Check your connection and try again.'
}

/** The URL owns the committed search; Query owns the result pages. */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const selection = useBrowseSelection()
  const { isMobile, isTablet } = useBreakpoint()
  const columns = isMobile ? 1 : isTablet ? 2 : 3
  const committedQuery = (searchParams.get('q') ?? '').trim()
  // Keep raw typing through our own URL commits. A genuine navigation restores
  // the committed query and discards the previous entry's unfinished draft.
  const [draft, setDraft] = useState<{ key: string; value: string; pendingSearch: string | null }>({
    key: location.key, value: committedQuery, pendingSearch: null,
  })
  const input = draft.key === location.key || draft.pendingSearch === searchParams.toString()
    ? draft.value
    : committedQuery
  if (draft.key !== location.key) setDraft({ key: location.key, value: input, pendingSearch: null })
  const filters = {
    joke_format: splitSlugs(searchParams.get('joke_format')),
    categories: splitSlugs(searchParams.get('categories') ?? searchParams.get('tones')),
    themes: splitSlugs(searchParams.get('themes') ?? searchParams.get('context_tags')),
  }
  const activeFilters = FILTER_KEYS.reduce((count, key) => count + filters[key].length, 0)
  const updateSearchUrl = useCallback((next: URLSearchParams, value: string, replace = false) => {
    setDraft({ key: location.key, value, pendingSearch: next.toString() })
    setSearchParams(next, { replace, preventScrollReset: true })
  }, [location.key, setSearchParams])
  const commitQuery = useCallback((value: string, replace: boolean) => {
    const next = new URLSearchParams(searchParams)
    const query = value.trim()
    if (query) next.set('q', query)
    else next.delete('q')
    next.delete('page')
    updateSearchUrl(next, value, replace)
  }, [searchParams, updateSearchUrl])

  useEffect(() => {
    if (input.trim() === committedQuery) return
    const timer = window.setTimeout(() => commitQuery(input, true), 300)
    return () => window.clearTimeout(timer)
  }, [input, committedQuery, commitQuery, location.key])

  const params: JokeSearchParams = {
    ...selection,
    page_size: 30,
    ...(committedQuery ? { q: committedQuery } : { ordering: '-created_at' }),
    ...Object.fromEntries(FILTER_KEYS.filter((key) => filters[key].length).map((key) => [key, filters[key].join(',')])),
    ...(searchParams.get('age_rating') ? { age_rating: searchParams.get('age_rating')! } : {}),
    ...(searchParams.get('vibe') ? { vibe: searchParams.get('vibe')! } : {}),
  }
  const search = useInfiniteJokeSearch(params)
  const matches = useMemo(() => {
    const seen = new Set<number>()
    return (search.data?.pages.flatMap((page) => page.results) ?? []).filter((joke) => {
      if (seen.has(joke.id)) return false
      seen.add(joke.id)
      return true
    })
  }, [search.data])
  const totalCount = search.data?.pages[0]?.count ?? 0
  const formats = useFormats()
  const categories = useTones()
  const themes = useContextTags()

  function toggleFilter(key: FilterKey, slug: string) {
    const next = new URLSearchParams(searchParams)
    const values = new Set(filters[key])
    if (values.has(slug)) values.delete(slug)
    else values.add(slug)
    if (values.size) next.set(key, [...values].sort().join(','))
    else next.delete(key)
    if (key === 'categories') next.delete('tones')
    if (key === 'themes') next.delete('context_tags')
    // Commit any pending text at the same time so selecting a filter cannot
    // erase what the reader just typed.
    if (input.trim()) next.set('q', input.trim())
    else next.delete('q')
    next.delete('page')
    updateSearchUrl(next, input)
  }

  function clearSearch() {
    const next = new URLSearchParams(searchParams)
    for (const key of ['q', ...FILTER_KEYS, 'tones', 'context_tags', 'age_rating', 'vibe', 'page']) next.delete(key)
    updateSearchUrl(next, '')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    commitQuery(input, false)
  }

  return (
    <div className="joke-search-page">
      <Seo title="Search Jokes · JokesFor" description="Find jokes by their words, punchlines, categories and themes. Search the JokesFor library in one place." canonicalPath="/search" />
      <FlowAppShell active="search">
        <div className="joke-search-content">
          <h1>Find your next laugh.</h1>
          <p className="joke-search-intro">A joke you remember. A punchline you almost forgot. A topic you love.</p>

          <form role="search" onSubmit={submit} className="joke-search-form">
            <label htmlFor="joke-search-input">Search jokes</label>
            <div className="joke-search-input-row">
              <div className="joke-search-input-wrap">
                <SearchIcon size={22} aria-hidden="true" />
                <input
                  id="joke-search-input"
                  type="search"
                  name="q"
                  value={input}
                  onChange={(event) => setDraft({ key: location.key, value: event.target.value, pendingSearch: null })}
                  maxLength={200}
                  placeholder="Try coffee, dad jokes, or a few words you remember"
                  aria-describedby="joke-search-help"
                  autoComplete="off"
                />
                {input && <button type="button" className="joke-search-clear" aria-label="Clear search text" onClick={() => commitQuery('', true)}><X size={18} aria-hidden="true" /></button>}
              </div>
              <button type="submit" className="btn-flow-primary joke-search-submit">Search</button>
            </div>
            <p id="joke-search-help">Search joke text, setups, punchlines, categories and themes. Use quotes for an exact phrase.</p>
          </form>

          <details className="joke-search-filters" open={activeFilters > 0 || undefined}>
            <summary>Refine your search{activeFilters > 0 ? ` (${activeFilters})` : ''}</summary>
            <div className="joke-search-filter-grid">
              <FilterGroup label="Formats" options={(formats.data ?? []).map((format) => ({ slug: FLOW_FORMAT_TO_BACKEND_SLUG[format.slug] ?? format.slug, name: format.name }))} selected={filters.joke_format} onToggle={(slug) => toggleFilter('joke_format', slug)} isError={formats.isError} />
              <FilterGroup label="Categories" options={categories.data ?? []} selected={filters.categories} onToggle={(slug) => toggleFilter('categories', slug)} isError={categories.isError} />
              <FilterGroup label="Themes" options={themes.data ?? []} selected={filters.themes} onToggle={(slug) => toggleFilter('themes', slug)} isError={themes.isError} />
            </div>
            {(activeFilters > 0 || committedQuery) && <button type="button" className="btn-flow-ghost" onClick={clearSearch}>Reset search</button>}
          </details>

          <section className="joke-search-results" aria-label="Search results" aria-busy={search.isFetching}>
            <div className="joke-search-result-heading">
              <p role="status" aria-live="polite">
                {search.isPending ? 'Searching…' : search.isError && !search.data ? 'Search unavailable' : `${totalCount} match${totalCount === 1 ? '' : 'es'}`}
                {search.isFetching && !search.isPending && !search.isFetchingNextPage && <span> · Updating…</span>}
              </p>
              {search.data && <span>{committedQuery ? 'Most relevant first' : 'Newest first'}</span>}
            </div>

            {search.isPending ? (
              <div className="joke-search-grid" style={{ columnCount: columns }} aria-label="Loading jokes">
                {Array.from({ length: 6 }, (_, index) => <div key={index} className="joke-search-skeleton" style={{ height: 170 + index % 3 * 35 }} />)}
              </div>
            ) : search.isError && !search.data ? (
              <div className="joke-search-state" role="alert"><h2>Search could not finish</h2><p>{searchError(search.error)}</p><button type="button" className="btn-flow-primary" onClick={() => { void search.refetch() }}>Try again</button></div>
            ) : matches.length ? (
              <>
                <div className="joke-search-grid" style={{ columnCount: columns }}>
                  {matches.map((joke) => {
                    const flow = jokeToFlowData(joke)
                    return flow && <div key={joke.id} className="joke-search-result"><Link to={`/jokes/${joke.id}?source=search`} className="joke-search-card-link"><FlowJokeCard joke={flow} source="search" /></Link></div>
                  })}
                </div>
                {search.isFetchNextPageError && <p role="alert" className="joke-search-more-error">We could not load more jokes. Your current results are still here.</p>}
                {search.isRefetchError && !search.isFetchNextPageError && <p role="alert" className="joke-search-more-error">These results could not be refreshed. <button type="button" onClick={() => { void search.refetch() }}>Try again</button></p>}
                {search.hasNextPage && <div className="joke-search-more"><button type="button" className="btn-flow-ghost" disabled={search.isFetching} onClick={() => { void search.fetchNextPage() }}>{search.isFetchingNextPage ? 'Loading more…' : search.isFetchNextPageError ? 'Try loading more again' : `Load more · ${matches.length} of ${totalCount}`}</button></div>}
              </>
            ) : (
              <div className="joke-search-state"><h2>No jokes found</h2><p>Try a different word, a shorter phrase, or fewer filters.</p><button type="button" className="btn-flow-primary" onClick={clearSearch}>Clear search and filters</button></div>
            )}
          </section>
        </div>
      </FlowAppShell>
    </div>
  )
}

function FilterGroup({ label, options, selected, onToggle, isError }: {
  label: string
  options: { slug: string; name: string }[]
  selected: string[]
  onToggle: (slug: string) => void
  isError: boolean
}) {
  // Preserve removable choices from bookmarked URLs even if a catalog changes.
  const available = [...options, ...selected.filter((slug) => !options.some((option) => option.slug === slug)).map((slug) => ({ slug, name: slug }))]
  return <fieldset><legend>{label}</legend><div className="joke-search-filter-options">{available.map((option) => <label key={option.slug}><input type="checkbox" checked={selected.includes(option.slug)} onChange={() => onToggle(option.slug)} /><span>{option.name}</span></label>)}</div>{isError && <p>Could not load {label.toLowerCase()}. Text search is still available.</p>}</fieldset>
}
