import { useState, type FormEvent } from 'react'
import { ArrowUp, ArrowDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLibraryMutation, useLibraryQuery, type CreatorCollection, type Page } from './api'
import { Feedback, MaterialPicker, Pagination, type Material } from './components'

const base = '/creators/me/collections/'

function CollectionEditor({ collection, canWrite, onClose }: { collection: CreatorCollection | null; canWrite: boolean; onClose: () => void }) {
  const [name, setName] = useState(collection?.name ?? '')
  const [kind, setKind] = useState(collection?.kind ?? 'set_list')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [items, setItems] = useState<Material[]>(collection?.joke_ids.map((id) => collection.items?.find((item) => item.joke_id === id) ?? { joke_id: id, display_text: `Joke #${id}` }) ?? [])
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const mutation = useLibraryMutation<CreatorCollection>()
  const canArrange = canWrite && !collection?.unavailable_count && !mutation.isPending
  const move = (index: number, offset: number) => setItems((current) => {
    const next = [...current]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next
  })
  const save = (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    const data = { name: name.trim(), kind, description, ...(!collection?.unavailable_count ? { joke_ids: items.map((item) => item.joke_id) } : {}) }
    void mutation.save(collection ? 'PATCH' : 'POST', collection ? `${base}${collection.id}/` : base, data).then(() => { if (collection) setMessage('Collection saved.'); else onClose() }).catch(() => {})
  }
  return <section className="studio-lib-editor">
    <div className="studio-lib-heading"><h2>{collection ? 'Edit collection' : 'New collection'}</h2><Button variant="ghost" onClick={onClose}>Close</Button></div>
    <form onSubmit={save}>
      <div className="studio-lib-fields"><label>Collection name<input required maxLength={100} value={name} disabled={!canWrite || mutation.isPending} onChange={(e) => setName(e.target.value)} /></label><label>Collection type<select value={kind} disabled={!canWrite || mutation.isPending} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="set_list">Set list</option><option value="series">Series</option></select></label></div>
      <label>Description<textarea rows={2} maxLength={1000} value={description} disabled={!canWrite || mutation.isPending} onChange={(e) => setDescription(e.target.value)} /></label>
      <h3>{kind === 'set_list' ? 'Running order' : 'Series order'} <span className="studio-lib-muted">{items.length}/100</span></h3>
      {!!collection?.unavailable_count && <p className="studio-lib-notice">{collection.unavailable_count} unavailable item(s) remain in this collection. You can rename it; arranging material is paused to preserve those items.</p>}
      {items.length === 0 && <p className="studio-lib-muted">Add published jokes below, then arrange them in the order you want to perform or release them.</p>}
      <ol className="studio-lib-running-order">{items.map((item, index) => <li key={item.joke_id}><span className="studio-lib-position">{index + 1}</span><span className="studio-lib-grow">{item.display_text}</span><div className="studio-lib-order-buttons"><Button type="button" variant="ghost" aria-label={`Move ${item.display_text} up`} disabled={!canArrange || index === 0} onClick={() => move(index, -1)}><ArrowUp size={18} /></Button><Button type="button" variant="ghost" aria-label={`Move ${item.display_text} down`} disabled={!canArrange || index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown size={18} /></Button><Button type="button" variant="ghost" aria-label={`Remove ${item.display_text}`} disabled={!canArrange} onClick={() => setItems((current) => current.filter((entry) => entry.joke_id !== item.joke_id))}><X size={18} /></Button></div></li>)}</ol>
      <div className="studio-lib-actions"><Button type="submit" disabled={!canWrite || mutation.isPending || !name.trim()}>{mutation.isPending ? 'Saving…' : collection ? 'Save collection' : 'Create collection'}</Button>{collection && <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => setConfirmDelete(true)}>Delete collection</Button>}</div>
    </form>
    {confirmDelete && <div className="studio-lib-notice"><p>Delete this private collection? Your published jokes will remain.</p><div className="studio-lib-actions"><Button disabled={mutation.isPending} onClick={() => { void mutation.save('DELETE', `${base}${collection!.id}/`).then(onClose).catch(() => {}) }}>Confirm delete</Button><Button variant="outline" onClick={() => setConfirmDelete(false)}>Keep collection</Button></div></div>}
    <Feedback error={mutation.error} message={message} />
    {canArrange && <MaterialPicker selected={items.map((item) => item.joke_id)} onAdd={(item) => setItems((current) => [...current, item])} />}
  </section>
}

export function CollectionsWorkspace({ canWrite }: { canWrite: boolean }) {
  const [page, setPage] = useState(1)
  const query = useLibraryQuery<Page<CreatorCollection>>(`${base}?page=${page}`)
  const [selectedId, setSelectedId] = useState<number | null | undefined>()
  const selected = selectedId === null ? null : query.data?.results.find((item) => item.id === selectedId)
  // A membership/visibility change remounts the editor; a rename or reorder
  // preserves its local draft. Never reuse a filtered membership snapshot.
  const selectionKey = selected ? `${selected.id}:${selected.unavailable_count}:${[...selected.joke_ids].sort((a, b) => a - b).join(',')}` : 'new' 
  return <div className="studio-lib-workspace"><aside className="studio-lib-index"><div className="studio-lib-heading"><h2>Collections</h2><Button disabled={!canWrite} onClick={() => setSelectedId(null)}>New collection</Button></div><p className="studio-lib-muted">Build a set for the stage or a series for your next release. Only you can see these collections.</p>
    {query.isLoading && <p>Loading collections…</p>}<Feedback error={query.error} />
    {query.data?.results.length === 0 && <p>Your first set starts here. Create a collection and add your published material.</p>}
    <ul className="studio-lib-index-list">{query.data?.results.map((collection) => <li key={collection.id}><button className="studio-lib-index-button" aria-label={`Open ${collection.name}`} aria-pressed={selected?.id === collection.id} onClick={() => setSelectedId(collection.id)}><strong>{collection.name}</strong><span>{collection.kind === 'set_list' ? 'Set list' : 'Series'} · {collection.joke_ids.length + collection.unavailable_count} jokes</span></button></li>)}</ul><Pagination data={query.data} page={page} setPage={setPage} />
  </aside>{selected !== undefined && !query.isError ? <CollectionEditor key={selectionKey} collection={selected} canWrite={canWrite} onClose={() => setSelectedId(undefined)} /> : <section className="studio-lib-empty"><h2>Give your material an order.</h2><p>Open a collection to shape a running order, or start a new set list or series.</p></section>}</div>
}
