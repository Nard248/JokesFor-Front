import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useLibraryMutation, useLibraryQuery, type Page, type PrivateNote } from './api'
import { Feedback, MaterialPicker, Pagination } from './components'

function NoteForm({ note, canWrite }: { note: PrivateNote; canWrite: boolean }) {
  const [text, setText] = useState(note.private_note)
  const [message, setMessage] = useState('')
  const mutation = useLibraryMutation()
  const path = `/creators/me/content/${note.joke_id}/workspace/`
  return <><div className="studio-lib-heading"><h2>Rehearsal notes</h2><Link to={`/jokes/${note.joke_id}`}>View joke #{note.joke_id}</Link></div><p className="studio-lib-muted">Keep delivery cues, alternate punchlines, and ideas here. These notes are private.</p><form onSubmit={(event) => { event.preventDefault(); setMessage(''); void mutation.save('PATCH', path, { private_note: text }).then(() => setMessage('Note saved.')).catch(() => {}) }}><label>Private note<textarea rows={10} maxLength={5000} value={text} disabled={!canWrite || mutation.isPending} onChange={(event) => setText(event.target.value)} /></label><p className="studio-lib-muted">{text.length.toLocaleString()}/5,000 characters</p><div className="studio-lib-actions"><Button disabled={!canWrite || mutation.isPending}>Save note</Button><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => { setMessage(''); void mutation.save('DELETE', path).then(() => { setText(''); setMessage('Note deleted.') }).catch(() => {}) }}>Delete note</Button></div></form><Feedback error={mutation.error} message={message} /></>
}

function NoteEditor({ id, canWrite }: { id: number; canWrite: boolean }) {
  const query = useLibraryQuery<PrivateNote>(`/creators/me/content/${id}/workspace/`)
  return <section className="studio-lib-editor">{query.isLoading && <p>Loading your note…</p>}<Feedback error={query.error} />{query.data && !query.isError && <NoteForm key={id} note={query.data} canWrite={canWrite} />}</section>
}

export function NotesWorkspace({ canWrite, initialJoke }: { canWrite: boolean; initialJoke?: number }) {
  const [selected, setSelected] = useState(initialJoke)
  const [page, setPage] = useState(1)
  const query = useLibraryQuery<Page<PrivateNote>>(`/creators/me/content/workspace-notes/?page=${page}`)
  return <><div className="studio-lib-workspace"><aside className="studio-lib-index"><h2>Private notes</h2><p className="studio-lib-muted">A working notebook for your published jokes.</p>{query.isLoading && <p>Loading notes…</p>}<Feedback error={query.error} />{query.data?.results.length === 0 && <p>Choose a joke below or open it from the content workbench to start a note.</p>}<ul className="studio-lib-index-list">{query.data?.results.map((note) => <li key={note.joke_id}><button className="studio-lib-index-button" onClick={() => setSelected(note.joke_id)} aria-pressed={selected === note.joke_id}><strong>Joke #{note.joke_id}</strong><span>{note.private_note.slice(0, 110) || 'Empty note'}</span></button></li>)}</ul>{!!query.data?.unavailable_count && <p>{query.data.unavailable_count} notes are attached to unavailable material. Your account data export includes your retained private notes.</p>}<Pagination data={query.data} page={page} setPage={setPage} /></aside>{selected ? <NoteEditor key={selected} id={selected} canWrite={canWrite} /> : <section className="studio-lib-empty"><h2>Catch the thought before it goes.</h2><p>Select a note or choose material below to capture a new idea.</p></section>}</div>{canWrite && <MaterialPicker selected={selected ? [selected] : []} onAdd={(item) => setSelected(item.joke_id)} />}</>
}
