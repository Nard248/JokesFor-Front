import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { FlowAppShell } from '@/components/FlowAppShell'
import { useAuthStore } from '@/features/auth/store'
import { contentDemoMode } from '@/features/creator-content/api'
import { useLibraryAccess } from '@/features/creator-library/api'
import { CollectionsWorkspace } from '@/features/creator-library/CollectionsWorkspace'
import { NotesWorkspace } from '@/features/creator-library/NotesWorkspace'
import { MetadataWorkspace } from '@/features/creator-library/MetadataWorkspace'
import { Feedback } from '@/features/creator-library/components'
import '@/features/creator-library/library.css'

function CreatorLibraryWorkspace() {
  const [params] = useSearchParams()
  const rawJoke = params.get('joke') ?? ''
  const initialJoke = /^\d+$/.test(rawJoke) && Number.isSafeInteger(Number(rawJoke)) && Number(rawJoke) > 0 ? Number(rawJoke) : undefined
  const [tab, setTab] = useState(params.get('tab') === 'review' ? 'review' : initialJoke ? 'notes' : 'collections')
  const access = useLibraryAccess()
  return <div className="creator-library"><FlowAppShell><div className="cl-page"><nav aria-label="Creator navigation" className="cl-nav"><Link to="/create">Your jokes</Link><Link to="/create/content">Content workbench</Link><Link to="/create/insights">Insights</Link></nav><header className="cl-page-heading"><h1>Your working library</h1><p>Rehearse the delivery. Shape your next set. Help the right audience find your material.</p></header>
    {contentDemoMode() ? <p className="cl-notice">Connect to JokesFor to use your private creator library.</p> : <><Feedback error={access.error} />{!access.isLoading && !access.error && !access.canWrite && <p className="cl-notice">Your existing private work remains available to read and delete. An eligible creator plan enables new notes, collections, and metadata requests. <Link to="/settings/billing">View creator plans</Link></p>}<nav aria-label="Library sections" className="cl-tabs">{[['collections', 'Collections'], ['notes', 'Private notes'], ['review', 'Metadata review']].map(([id, label]) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>{tab === 'collections' ? <CollectionsWorkspace canWrite={access.canWrite} /> : tab === 'notes' ? <NotesWorkspace canWrite={access.canWrite} initialJoke={initialJoke} /> : <MetadataWorkspace canWrite={access.canWrite} initialJoke={initialJoke} />}</>}
  </div></FlowAppShell></div>
}

export function CreatorLibraryPage() {
  const owner = useAuthStore((state) => state.isAuthenticated ? state.user?.pk : undefined)
  return <CreatorLibraryWorkspace key={owner ?? 'signed-out'} />
}
