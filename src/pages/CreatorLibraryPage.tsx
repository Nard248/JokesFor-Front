import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAuthStore } from '@/features/auth/store'
import { contentDemoMode } from '@/features/creator-content/api'
import { useLibraryAccess } from '@/features/creator-library/api'
import { CollectionsWorkspace } from '@/features/creator-library/CollectionsWorkspace'
import { NotesWorkspace } from '@/features/creator-library/NotesWorkspace'
import { MetadataWorkspace } from '@/features/creator-library/MetadataWorkspace'
import { Feedback } from '@/features/creator-library/components'
import { CreatorProGate, CreatorStudioLayout } from '@/features/creator-studio'
import '@/features/creator-library/library.css'

const SECTIONS = [['collections', 'Collections'], ['notes', 'Private notes'], ['review', 'Metadata review']] as const

function CreatorLibraryWorkspace() {
  const [params] = useSearchParams()
  const rawJoke = params.get('joke') ?? ''
  const initialJoke = /^\d+$/.test(rawJoke) && Number.isSafeInteger(Number(rawJoke)) && Number(rawJoke) > 0 ? Number(rawJoke) : undefined
  const [tab, setTab] = useState<string>(params.get('tab') === 'review' ? 'review' : initialJoke ? 'notes' : 'collections')
  const access = useLibraryAccess()
  return (
    <CreatorStudioLayout
      section="library"
      title="Library"
      subtitle="Rehearse the delivery, shape your next set, and help the right audience find your material."
    >
      {contentDemoMode() ? (
        <p className="m-0 rounded-2xl bg-purple-tint p-4 text-sm text-[#4B327A]">Connect to JokesFor to use your private creator library.</p>
      ) : (
        <>
          {!access.isLoading && !access.error && !access.canWrite && (
            <CreatorProGate
              compact
              className="mb-7"
              feature="Library editing"
              title="Your Library is read-only on the Free plan"
              description="Your existing private work remains available to read and delete. Creator Pro enables new notes, collections and metadata requests."
            />
          )}
          <div className="studio-lib">
            <Feedback error={access.error} />
            {/* In-page section switch; aria-current="true" (not "page") because
                the Studio tab bar already marks the current page. */}
            <nav aria-label="Library sections" className="studio-lib-tabs">
              {SECTIONS.map(([id, label]) => (
                <button key={id} type="button" aria-current={tab === id ? 'true' : undefined} onClick={() => setTab(id)}>{label}</button>
              ))}
            </nav>
            {tab === 'collections'
              ? <CollectionsWorkspace canWrite={access.canWrite} />
              : tab === 'notes'
                ? <NotesWorkspace canWrite={access.canWrite} initialJoke={initialJoke} />
                : <MetadataWorkspace canWrite={access.canWrite} initialJoke={initialJoke} />}
          </div>
        </>
      )}
    </CreatorStudioLayout>
  )
}

export function CreatorLibraryPage() {
  const owner = useAuthStore((state) => state.isAuthenticated ? state.user?.pk : undefined)
  return <CreatorLibraryWorkspace key={owner ?? 'signed-out'} />
}
