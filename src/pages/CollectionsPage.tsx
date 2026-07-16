import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Bookmark, X } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { useToast } from '@/components/ui/toast'
import { useCollections, useCreateCollection } from '@/features/collections'
import { parseAuthError } from '@/features/auth/parseAuthError'

/**
 * CollectionsPage — the collections hub.
 *
 * Backend: CollectionViewSet (jokes/urls.py `collections`).
 *   - GET  /api/v1/collections/        → list the user's collections
 *   - POST /api/v1/collections/ {name} → create a collection
 * Tiles navigate to /collections/:id (CollectionDetailPage), which lists that
 * collection's saved jokes via GET /api/v1/collections/:id/jokes/.
 */
export function CollectionsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data, isLoading, isError, refetch } = useCollections()
  const createCollection = useCreateCollection()

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const collections = data?.results ?? []

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || createCollection.isPending) return
    createCollection.mutate(trimmed, {
      onSuccess: () => {
        toast({ message: `Created "${trimmed}"`, variant: 'success' })
        setName('')
        setCreating(false)
      },
      onError: (err) => {
        toast({ message: parseAuthError(err, 'Could not create collection.').message, variant: 'error' })
      },
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        <div style={{ padding: '40px 0', maxWidth: 1080, margin: '0 auto' }}>
          {/* Hero */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="eyebrow-mono">Collections</span>
              <h2
                style={{
                  marginTop: 8,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                  letterSpacing: '-0.02em',
                  color: '#1A1A1A',
                  lineHeight: 1.05,
                }}
              >
                Curated <em className="wink">sets.</em>
              </h2>
              <p style={{ marginTop: 6, fontSize: 18, color: '#52525B' }}>
                Group your saved jokes into themes. Click any set to open it.
              </p>
            </div>
            {!creating && (
              <button
                type="button"
                className="btn-flow-primary"
                style={{ height: 48, fontSize: 14 }}
                onClick={() => setCreating(true)}
              >
                <Plus size={16} /> New collection
              </button>
            )}
          </div>

          {/* Inline create form */}
          {creating && (
            <form
              onSubmit={submitCreate}
              style={{
                marginTop: 24,
                padding: 8,
                paddingLeft: 18,
                background: '#fff',
                border: '1px solid #E9E8E7',
                borderRadius: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                maxWidth: 640,
              }}
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Name your collection — e.g. "Office-safe"'
                aria-label="Collection name"
                autoFocus
                maxLength={100}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 0,
                  outline: 'none',
                  color: '#1A1A1A',
                  fontSize: 14,
                  fontFamily: 'var(--font-sans)',
                }}
              />
              <button
                type="submit"
                className="btn-flow-primary"
                style={{ height: 38, fontSize: 13 }}
                disabled={!name.trim() || createCollection.isPending}
              >
                {createCollection.isPending ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                aria-label="Cancel"
                onClick={() => {
                  setCreating(false)
                  setName('')
                }}
                className="btn-flow-ghost"
                style={{ height: 38, width: 38, padding: 0, justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </form>
          )}

          {/* Grid */}
          <section style={{ marginTop: 40 }}>
            {isLoading ? (
              <StateCard>Loading your collections…</StateCard>
            ) : isError ? (
              <StateCard>
                Couldn't load your collections.{' '}
                <button type="button" className="btn-flow-ghost" style={{ height: 34, fontSize: 12 }} onClick={() => refetch()}>
                  Retry
                </button>
              </StateCard>
            ) : collections.length === 0 ? (
              <StateCard>
                No collections yet. Create your first one to start organizing your saved jokes.
              </StateCard>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                {collections.map((c, i) => (
                  <CollectionTile
                    key={c.id}
                    name={c.name}
                    count={c.joke_count}
                    isDefault={c.is_default}
                    index={i}
                    onOpen={() => navigate(`/collections/${c.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '48px 32px',
        border: '1px dashed #E9E8E7',
        borderRadius: 18,
        textAlign: 'center',
        background: '#fff',
        color: '#52525B',
        fontSize: 15,
      }}
    >
      {children}
    </div>
  )
}

interface CollectionTileProps {
  name: string
  count: number
  isDefault: boolean
  index: number
  onOpen: () => void
}

function CollectionTile({ name, count, isDefault, index, onOpen }: CollectionTileProps) {
  const tints = [
    { bg: '#fff', border: '#E9E8E7', accent: '#6A1CF6' },
    { bg: '#F2E9FF', border: '#E8DAFF', accent: '#6A1CF6' },
    { bg: '#FBFAF7', border: '#E9E8E7', accent: '#1A1A1A' },
    { bg: '#fff', border: '#E9E8E7', accent: '#5F4200' },
  ]
  const tint = tints[index % tints.length]

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open collection ${name}`}
      style={{
        position: 'relative',
        padding: 24,
        background: tint.bg,
        border: `1px solid ${tint.border}`,
        borderRadius: 18,
        textAlign: 'left',
        cursor: 'pointer',
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        fontFamily: 'inherit',
        color: '#1A1A1A',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(15,14,18,0.08)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: tint.accent,
          color: tint.accent === '#1A1A1A' ? '#CAFD00' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bookmark size={18} />
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 20,
            color: '#1A1A1A',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#52525B',
          }}
        >
          {count} {count === 1 ? 'joke' : 'jokes'}
          {isDefault && ' · Default'}
        </div>
      </div>
    </button>
  )
}
