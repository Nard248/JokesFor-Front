import { Link } from 'react-router'
import { PenLine, Plus, Send, Trash2, Clock, ArrowRight } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { useDrafts, useSubmitDraft, useDeleteDraft } from '@/features/drafts'

/**
 * DraftsPage — redesigned for iteration 4.
 *
 * Sections:
 *   1. Hero (greeting + count)
 *   2. New-draft CTA
 *   3. Draft list with status badges + submit/delete actions
 *
 * Status palette (per mock-data shape):
 *   - draft     → gray
 *   - pending   → amber (under review)
 *   - published → lime (live in catalog)
 *   - rejected  → ink (with note in legacy; not surfaced here yet)
 */
export function DraftsPage() {
  const { data: draftsData, isLoading } = useDrafts()
  const submit = useSubmitDraft()
  const remove = useDeleteDraft()

  const drafts = draftsData?.results ?? []
  const inProgress = drafts.filter((d) => d.status === 'draft').length
  const pending = drafts.filter((d) => d.status === 'pending').length
  const published = drafts.filter((d) => d.status === 'published').length

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)' }}>
          {/* Hero */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="eyebrow-mono">Drafts · {drafts.length} total</span>
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
                Things you're <em className="wink">working on.</em>
              </h2>
              <p style={{ marginTop: 6, fontSize: 18, color: '#52525B' }}>
                Polish, submit, ship. Drafts you don't ship are jokes that don't land.
              </p>
            </div>
            <Link
              to="/submit"
              className="btn-flow-primary"
              style={{ height: 48, fontSize: 14, textDecoration: 'none' }}
            >
              <Plus size={16} /> Start a new draft
            </Link>
          </div>

          {/* Status counts */}
          <div
            style={{
              marginTop: 32,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            <CountCard count={inProgress} label="In progress" accent="purple" />
            <CountCard count={pending} label="Awaiting review" accent="amber" />
            <CountCard count={published} label="Published" accent="lime" />
          </div>

          {/* Drafts list */}
          <section style={{ marginTop: 48 }}>
            <span className="eyebrow-mono">All drafts</span>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 28,
                marginTop: 4,
                marginBottom: 18,
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
              }}
            >
              Your <em className="wink">workshop.</em>
            </h3>

            {isLoading ? (
              <DraftsSkeleton />
            ) : drafts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {drafts.map((d) => (
                  <DraftRow
                    key={d.id}
                    setup={d.setup}
                    punchline={d.punchline}
                    format={d.format}
                    status={d.status}
                    lastEditedAt={d.lastEditedAt}
                    onSubmit={d.status === 'draft' ? () => submit.mutate(d.id) : undefined}
                    onDelete={() => remove.mutate(d.id)}
                    submitting={submit.isPending}
                    deleting={remove.isPending}
                  />
                ))}
              </div>
            ) : (
              <DraftsEmpty />
            )}
          </section>
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────

function CountCard({ count, label, accent }: { count: number; label: string; accent: 'purple' | 'amber' | 'lime' }) {
  const palette = {
    purple: { fg: '#6A1CF6', tint: '#F2E9FF' },
    amber: { fg: '#5F4200', tint: 'rgba(255, 201, 101, 0.18)' },
    lime: { fg: '#3A4A00', tint: 'rgba(202, 253, 0, 0.18)' },
  }[accent]
  return (
    <div
      style={{
        padding: 24,
        background: palette.tint,
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div className="eyebrow-mono" style={{ color: palette.fg }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 48,
          color: palette.fg,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {count}
      </div>
    </div>
  )
}

interface DraftRowProps {
  setup: string
  punchline: string
  format: string
  status: 'draft' | 'pending' | 'published' | 'rejected'
  lastEditedAt: string
  onSubmit?: () => void
  onDelete: () => void
  submitting: boolean
  deleting: boolean
}

function DraftRow({ setup, punchline, format, status, lastEditedAt, onSubmit, onDelete, submitting, deleting }: DraftRowProps) {
  const statusPill = {
    draft: { bg: '#F2F0F0', fg: '#52525B', label: 'Draft' },
    pending: { bg: 'rgba(255, 201, 101, 0.3)', fg: '#5F4200', label: 'Pending review' },
    published: { bg: '#CAFD00', fg: '#3A4A00', label: 'Published' },
    rejected: { bg: '#1A1A1A', fg: '#fff', label: 'Rejected' },
  }[status]

  const dateText = formatRelative(lastEditedAt)

  return (
    <article
      style={{
        padding: 24,
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: statusPill.bg,
              color: statusPill.fg,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {statusPill.label}
          </span>
          <span className="eyebrow-mono">{format}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: '#6B7280', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} /> {dateText}
        </span>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: '#1A1A1A', lineHeight: 1.3 }}>
          {setup}
        </div>
        <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: '#1A1A1A', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
          {punchline}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="btn-flow-primary"
            style={{ height: 36, fontSize: 13, padding: '0 16px' }}
          >
            <Send size={13} /> {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="btn-flow-ghost"
          style={{ height: 36, fontSize: 13, padding: '0 16px' }}
        >
          <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </article>
  )
}

function DraftsEmpty() {
  return (
    <div
      style={{
        padding: '56px 32px',
        border: '1px dashed #E9E8E7',
        borderRadius: 18,
        textAlign: 'center',
        background: '#fff',
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 14, background: '#F2E9FF', color: '#6A1CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        <PenLine size={22} />
      </div>
      <div style={{ marginTop: 16, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
        Got a <em className="wink">good one?</em>
      </div>
      <p style={{ marginTop: 8, fontSize: 18, color: '#52525B', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
        Drafts you save here can be polished, previewed, and submitted to the catalog when they're ready.
      </p>
      <Link to="/submit" className="btn-flow-primary" style={{ display: 'inline-flex', marginTop: 16, height: 44, fontSize: 14, textDecoration: 'none' }}>
        Start a new draft <ArrowRight size={16} />
      </Link>
    </div>
  )
}

function DraftsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: 24,
            background: '#fff',
            border: '1px solid #E9E8E7',
            borderRadius: 18,
            minHeight: 100,
          }}
        >
          <div style={{ height: 14, width: 80, background: '#F2F0F0', borderRadius: 4 }} />
          <div style={{ height: 24, background: '#F2F0F0', borderRadius: 6, marginTop: 12 }} />
        </div>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const ms = Date.now() - d.getTime()
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
