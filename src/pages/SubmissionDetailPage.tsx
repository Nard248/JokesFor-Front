import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ArrowLeft, Plus } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { JokeRenderer } from '@/components/JokeRenderer'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useDraft, PublishedStats } from '@/features/create'
import type { SubmissionStatus } from '@/features/create'

// ── Status banner config ─────────────────────────────────────────────────────

const BANNER_CONFIG: Record<SubmissionStatus, { label: string; bg: string; border: string; color: string }> = {
  draft:     { label: 'Draft',     bg: '#F3F4F6', border: '#E9E8E7', color: '#52525B' },
  pending:   { label: 'Pending',   bg: '#FEF3C7', border: '#FDE68A', color: '#92400E' },
  published: { label: 'Published', bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46' },
  rejected:  { label: 'Rejected',  bg: '#FEF2F2', border: '#FEE2E2', color: '#991B1B' },
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return isoString
  }
}

export function SubmissionDetailPage() {
  const { draftId } = useParams<{ draftId: string }>()
  const navigate = useNavigate()

  const id = Number(draftId)
  const { data: draft, isLoading, isError } = useDraft(id)

  // Spec §12.1: drafts are edited, not viewed — redirect to the editor.
  // Rejected drafts remain viewable (Edit-and-resubmit CTA); pending/published
  // are the normal detail-view cases.
  useEffect(() => {
    if (draft && draft.status === 'draft') {
      navigate(`/create/${id}`, { replace: true })
    }
  }, [draft, id, navigate])

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell>
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 720, margin: '0 auto' }}>
          {/* Back link */}
          <Link
            to="/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#6A1CF6',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              marginBottom: 28,
            }}
          >
            <ArrowLeft size={16} />
            Back to your jokes
          </Link>

          {/* Loading state */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Skeleton style={{ height: 60, borderRadius: 14 }} />
              <Skeleton style={{ height: 160, borderRadius: 18 }} />
              <Skeleton style={{ height: 80, borderRadius: 14 }} />
            </div>
          )}

          {/* Error / not found state */}
          {!isLoading && (isError || !draft) && (
            <div
              style={{
                padding: 32,
                borderRadius: 16,
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#991B1B', fontWeight: 600, marginBottom: 12 }}>
                Submission not found or failed to load.
              </p>
              <Link to="/create" style={{ color: '#6A1CF6', fontWeight: 600, fontSize: 14 }}>
                Back to your jokes
              </Link>
            </div>
          )}

          {/* Main content */}
          {!isLoading && !isError && draft && (
            <>
              {/* Status banner */}
              {(() => {
                const cfg = BANNER_CONFIG[draft.status]
                return (
                  <div
                    style={{
                      padding: '14px 20px',
                      borderRadius: 14,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      color: cfg.color,
                      fontWeight: 700,
                      fontSize: 15,
                      marginBottom: 24,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span>{cfg.label}</span>
                    {draft.status === 'pending' && (
                      <span style={{ fontWeight: 400, fontSize: 13 }}>
                        — With our reviewers since {formatDate(draft.lastEditedAt)}
                      </span>
                    )}
                  </div>
                )
              })()}

              {/* Joke preview (read-only) */}
              <div
                style={{
                  padding: '20px 24px',
                  borderRadius: 18,
                  border: '1.5px solid #E9E8E7',
                  background: 'rgba(106, 28, 246, 0.04)',
                  marginBottom: 24,
                }}
              >
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#6A1CF6',
                  }}
                >
                  Your submission
                </p>
                <JokeRenderer
                  payload={{
                    format: draft.format,
                    text: draft.text,
                    setup: draft.setup,
                    punchline: draft.punchline,
                    lines: draft.lines,
                  }}
                  revealed
                  interactive={false}
                  big
                />
              </div>

              {/* Tags */}
              {(draft.themes.length > 0 || draft.categories.length > 0 || draft.ageRating) && (
                <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {draft.themes.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: '#F3F4F6',
                        color: '#52525B',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  {draft.categories.map((c) => (
                    <span
                      key={c}
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: '#F7F0FF',
                        color: '#6A1CF6',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                  {draft.ageRating && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: '#F3F4F6',
                        color: '#52525B',
                      }}
                    >
                      {draft.ageRating}
                    </span>
                  )}
                </div>
              )}

              {/* Status-specific sections */}

              {/* Pending: reviewer copy */}
              {draft.status === 'pending' && (
                <p style={{ fontSize: 14, color: '#92400E' }}>
                  With our reviewers since {formatDate(draft.lastEditedAt)}. We'll notify you once it's reviewed.
                </p>
              )}

              {/* Published: stats + new joke button */}
              {draft.status === 'published' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <PublishedStats stats={draft.stats} />
                  {/* View public link — omitted until published joke id is available in ContentDraft */}
                  {/* TODO: add when ContentDraft exposes a publishedId field */}
                  <div>
                    <Button
                      variant="pill"
                      size="default"
                      onClick={() => navigate('/create/new')}
                    >
                      <Plus size={14} />
                      New joke
                    </Button>
                  </div>
                </div>
              )}

              {/* Rejected: rejection reason + edit link */}
              {draft.status === 'rejected' && (
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: 14,
                    background: '#FEF2F2',
                    border: '1px solid #FEE2E2',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {draft.rejectionReason && (
                    <p style={{ margin: 0, color: '#991B1B', fontSize: 14, lineHeight: 1.6 }}>
                      {draft.rejectionReason}
                    </p>
                  )}
                  <Link
                    to={`/create/${draft.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#6A1CF6',
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: 'none',
                    }}
                  >
                    Edit and resubmit
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </FlowAppShell>
    </div>
  )
}
