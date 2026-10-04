import { useState } from 'react'
import { useJokeSearch, type Joke, type JokeSearchParams, type PaginatedResponse } from '@/features/jokes'

/**
 * Keep accumulated pages scoped to every filter, never to a previous locale.
 *
 * Within one scope, a later page's own query has no data while it loads; the
 * hook keeps serving the response it already accumulated (and its count) so
 * "Load more" never blanks the list. A scope change drops everything.
 */
export function usePagedJokes(filters: JokeSearchParams) {
  const scope = JSON.stringify(filters)
  const [cursor, setCursor] = useState({ scope, page: 1 })
  const page = cursor.scope === scope ? cursor.page : 1
  // Record the new scope synchronously: revisiting an earlier language must
  // not revive its old page cursor before page one has been accumulated.
  if (cursor.scope !== scope) setCursor({ scope, page: 1 })
  const query = useJokeSearch({ ...filters, page })
  const response = query.data
  const [loaded, setLoaded] = useState<{ scope: string; response?: PaginatedResponse<Joke>; jokes: Joke[] }>({ scope, jokes: [] })
  let current = loaded
  if (loaded.scope !== scope || (response && loaded.response !== response)) {
    const results = response?.results ?? []
    const seen = new Set(loaded.jokes.map((joke) => joke.id))
    current = {
      scope, response,
      jokes: page === 1 || loaded.scope !== scope ? results : [...loaded.jokes, ...results.filter((joke) => !seen.has(joke.id))],
    }
    setLoaded(current)
  }
  const accumulated = current.jokes.length > 0
  const laterPageFailed = query.isError && accumulated
  return {
    ...query,
    data: current.response,
    // Only the first page of a scope shows as loading; a later page reports
    // progress through isFetching while the accumulated list stays visible.
    isLoading: query.isLoading && !accumulated,
    // A failed later page keeps the accumulated list; "Load more" retries it.
    isError: query.isError && !accumulated,
    jokes: current.jokes,
    page,
    loadMore: () => {
      if (laterPageFailed) void query.refetch()
      else setCursor({ scope, page: page + 1 })
    },
  }
}
