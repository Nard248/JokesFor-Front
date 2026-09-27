import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useContextTags, useTones } from '@/features/create/queries'
import { useLibraryMutation, useLibraryQuery, type MetadataChanges, type MetadataRequest, type Page } from './api'
import { Feedback, MaterialPicker, Pagination, type Material } from './components'

export function MetadataWorkspace({ canWrite, initialJoke }: { canWrite: boolean; initialJoke?: number }) {
  const [items, setItems] = useState<Material[]>(initialJoke ? [{ joke_id: initialJoke, display_text: `Joke #${initialJoke}` }] : [])
  const [replaceThemes, setReplaceThemes] = useState(false)
  const [replaceCategories, setReplaceCategories] = useState(false)
  const [themes, setThemes] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)
  const themeQuery = useContextTags()
  const categoryQuery = useTones()
  const history = useLibraryQuery<Page<MetadataRequest>>(`/creators/me/content/metadata-requests/?page=${page}`)
  const mutation = useLibraryMutation()
  const toggle = (values: string[], slug: string) => values.includes(slug) ? values.filter((value) => value !== slug) : [...values, slug]
  const submit = (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    const changes: MetadataChanges = { joke_ids: items.map((item) => item.joke_id), ...(replaceThemes ? { themes } : {}), ...(replaceCategories ? { categories } : {}), reason }
    void mutation.save('POST', '/creators/me/content/metadata-requests/', changes).then(() => setMessage('Your changes were sent for review. Published metadata stays unchanged until approval.')).catch(() => {})
  }
  return <div className="cl-review"><section className="cl-editor"><h2>Improve discovery metadata</h2><p className="cl-muted">Choose themes and categories for up to 50 of your jokes. An editor reviews the changes before they appear publicly.</p><form onSubmit={submit}>
    <h3>Selected material <span className="cl-muted">{items.length}/50</span></h3><ul className="cl-materials">{items.map((item) => <li key={item.joke_id}><span>{item.display_text}</span><Button type="button" variant="ghost" disabled={!canWrite || mutation.isPending} onClick={() => setItems((current) => current.filter((entry) => entry.joke_id !== item.joke_id))}>Remove</Button></li>)}</ul>
    <fieldset disabled={!canWrite || mutation.isPending}><legend>Requested changes</legend><label className="cl-check"><input type="checkbox" checked={replaceThemes} onChange={(e) => setReplaceThemes(e.target.checked)} />Replace themes</label>{replaceThemes && <div className="cl-taxonomy">{themeQuery.data?.map((theme) => <label className="cl-check" key={theme.slug}><input type="checkbox" checked={themes.includes(theme.slug)} onChange={() => setThemes(toggle(themes, theme.slug))} />{theme.name}</label>)}{themeQuery.isError && <p role="alert">Could not load themes. Reload before choosing replacements.</p>}</div>}<label className="cl-check"><input type="checkbox" checked={replaceCategories} onChange={(e) => setReplaceCategories(e.target.checked)} />Replace categories</label>{replaceCategories && <div className="cl-taxonomy">{categoryQuery.data?.map((category) => <label className="cl-check" key={category.slug}><input type="checkbox" checked={categories.includes(category.slug)} onChange={() => setCategories(toggle(categories, category.slug))} />{category.name}</label>)}{categoryQuery.isError && <p role="alert">Could not load categories. Reload before choosing replacements.</p>}</div>}<p className="cl-muted">Each checked group replaces that group on every selected joke. Checking a group with no tags clears it. Unchecked groups stay as they are.</p><label>Reason for change<textarea rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} /></label></fieldset>
    <Button disabled={!canWrite || mutation.isPending || !items.length || (!replaceThemes && !replaceCategories) || (replaceThemes && (themeQuery.isLoading || themeQuery.isError)) || (replaceCategories && (categoryQuery.isLoading || categoryQuery.isError))}>Request review</Button>
  </form><Feedback error={mutation.error} message={message} />{canWrite && !mutation.isPending && <MaterialPicker selected={items.map((item) => item.joke_id)} limit={50} onAdd={(item) => setItems((current) => [...current, item])} />}</section>
  <section className="cl-index"><h2>Review history</h2>{history.isLoading && <p>Loading review history…</p>}<Feedback error={history.error} />{history.data?.results.length === 0 && <p>Your metadata requests will appear here.</p>}<ul className="cl-history">{history.data?.results.map((request) => <li key={request.id}><div className="cl-heading"><strong>Joke #{request.joke_id}</strong><span className={`cl-badge cl-${request.status}`}>{request.status[0].toUpperCase() + request.status.slice(1)}</span></div>{Object.entries(request.changes).map(([group, slugs]) => <p key={group}>{group === 'themes' ? 'Themes' : 'Categories'}: {slugs.join(', ') || 'Clear all'}</p>)}{request.reason && <p>{request.reason}</p>}{request.decision_reason && <p><strong>Review note:</strong> {request.decision_reason}</p>}<small>{new Date(request.created_at).toLocaleDateString()}</small></li>)}</ul><Pagination data={history.data} page={page} setPage={setPage} /></section></div>
}
