import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { CreatorContentPageData } from '@/features/creator-content/api'
import { libraryError, useLibraryQuery, type Page } from './api'

export type Material = { joke_id: number; display_text: string }

export function Feedback({ error, message }: { error?: unknown; message?: string }) {
  return <>{error && <p role="alert" className="studio-lib-error">{libraryError(error)}</p>}{message && <p role="status" className="studio-lib-status">{message}</p>}</>
}

export function Pagination({ data, page, setPage }: { data?: Page<unknown>; page: number; setPage: (page: number) => void }) {
  if (!data?.next && !data?.previous) return null
  return <nav className="studio-lib-actions" aria-label="Library pages"><Button variant="outline" disabled={!data.previous} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page}</span><Button variant="outline" disabled={!data.next} onClick={() => setPage(page + 1)}>Next</Button></nav>
}

export function MaterialPicker({ selected, onAdd, limit = 100 }: { selected: number[]; onAdd: (item: Material) => void; limit?: number }) {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const params = new URLSearchParams({ period: 'month', sort: 'newest', page_size: '10', page: String(page), ...(q ? { q } : {}) })
  const query = useLibraryQuery<CreatorContentPageData>(`/creators/me/content/?${params}`)
  return <section className="studio-lib-picker" aria-label="Your published material">
    <h3>Add your material</h3>
    <div className="studio-lib-actions"><label className="studio-lib-grow">Search your jokes<input value={search} maxLength={200} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setQ(search.trim()); setPage(1) } }} /></label><Button type="button" variant="outline" onClick={() => { setQ(search.trim()); setPage(1) }}>Search</Button></div>
    {query.isLoading && <p>Loading your material…</p>}
    <Feedback error={query.error} />
    {query.data?.results.length === 0 && <p>No matching published material. <Link to="/create">Go to your jokes</Link></p>}
    <ul className="studio-lib-materials">{query.data?.results.map((joke) => {
      const title = (joke.text || joke.setup || `${joke.format.name} #${joke.id}`).slice(0, 180)
      const added = selected.includes(joke.id)
      return <li key={joke.id}><span>{title}</span><Button type="button" variant="outline" aria-label={`Add ${title}`} disabled={added || selected.length >= limit} onClick={() => onAdd({ joke_id: joke.id, display_text: title })}>{added ? 'Added' : 'Add'}</Button></li>
    })}</ul>
    <Pagination data={query.data} page={page} setPage={setPage} />
  </section>
}
