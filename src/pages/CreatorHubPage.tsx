import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDrafts, DraftCard } from '@/features/create'
import type { ContentDraft, SubmissionStatus } from '@/features/create'
import { track } from '@/features/create/analytics'
import { useCreatorStore } from '@/features/create/store'

type TabId = 'all' | SubmissionStatus

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'all',       label: 'All'       },
  { id: 'draft',     label: 'Drafts'    },
  { id: 'pending',   label: 'Pending'   },
  { id: 'published', label: 'Published' },
  { id: 'rejected',  label: 'Rejected'  },
]

function tabCount(drafts: ContentDraft[], id: TabId): number {
  if (id === 'all') return drafts.length
  return drafts.filter((d) => d.status === id).length
}

function sortByLastEdited(drafts: ContentDraft[]): ContentDraft[] {
  return [...drafts].sort(
    (a, b) => new Date(b.lastEditedAt).getTime() - new Date(a.lastEditedAt).getTime()
  )
}

export function CreatorHubPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useDrafts()
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const { markSeen } = useCreatorStore()

  // Analytics: track hub viewed once on mount; also clear the header dot
  useEffect(() => {
    track('creator_hub_viewed', { tab: activeTab })
    markSeen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allDrafts: ContentDraft[] = data ?? []
  const filtered = activeTab === 'all'
    ? sortByLastEdited(allDrafts)
    : sortByLastEdited(allDrafts.filter((d) => d.status === activeTab))

  function handleCardClick(draft: ContentDraft) {
    if (draft.status === 'draft' || draft.status === 'rejected') {
      navigate(`/create/${draft.id}`)
    } else {
      navigate(`/create/${draft.id}/view`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell>
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 800, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              Your jokes
            </h1>
            <Button
              variant="pill"
              size="lg"
              onClick={() => navigate('/create/new')}
            >
              <Plus size={16} />
              New
            </Button>
          </div>

          {/* Status tabs */}
          <div
            role="tablist"
            aria-label="Filter jokes by status"
            style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24 }}
          >
            {TABS.map(({ id, label }) => {
              const count = tabCount(allDrafts, id)
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 9999,
                    border: isActive ? '1px solid #AC8EFF' : '1px solid #E9E8E7',
                    background: isActive ? '#F7F0FF' : 'transparent',
                    color: isActive ? '#6A1CF6' : '#52525B',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {label}
                  {!isLoading && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: isActive ? '#AC8EFF' : '#E9E8E7',
                        color: isActive ? '#fff' : '#52525B',
                        padding: '1px 6px',
                        borderRadius: 999,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton style={{ height: 88, borderRadius: 16 }} />
              <Skeleton style={{ height: 88, borderRadius: 16 }} />
              <Skeleton style={{ height: 88, borderRadius: 16 }} />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div
              style={{
                padding: '32px',
                borderRadius: 16,
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#991B1B', fontWeight: 600, marginBottom: 12 }}>
                Failed to load your jokes
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {/* Loaded: no drafts at all */}
          {!isLoading && !isError && allDrafts.length === 0 && (
            <div
              style={{
                padding: '56px 32px',
                border: '1px dashed #E9E8E7',
                borderRadius: 18,
                textAlign: 'center',
                background: '#fff',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 24,
                  color: '#1A1A1A',
                  letterSpacing: '-0.01em',
                  marginBottom: 8,
                }}
              >
                Nothing here yet
              </h2>
              <p style={{ fontSize: 15, color: '#52525B', marginBottom: 20 }}>
                Got a joke up your sleeve? Share it with the world.
              </p>
              <Button variant="pill" onClick={() => navigate('/create/new')}>
                Submit your first joke
              </Button>
            </div>
          )}

          {/* Loaded: filtered empty (has drafts but none match current tab) */}
          {!isLoading && !isError && allDrafts.length > 0 && filtered.length === 0 && (
            <div
              style={{
                padding: '40px 32px',
                border: '1px dashed #E9E8E7',
                borderRadius: 18,
                textAlign: 'center',
                background: '#fff',
              }}
            >
              <p style={{ fontSize: 15, color: '#52525B' }}>
                No{' '}
                {activeTab === 'all' ? '' : activeTab}{' '}
                jokes here yet.
              </p>
            </div>
          )}

          {/* Loaded: draft cards */}
          {!isLoading && !isError && filtered.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  onClick={() => handleCardClick(draft)}
                />
              ))}
            </div>
          )}
        </div>
      </FlowAppShell>
    </div>
  )
}
