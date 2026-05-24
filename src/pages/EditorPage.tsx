/**
 * EditorPage — the integration hub for content creation.
 *
 * Two modes:
 *  - New mode:      /create/new/:formatSlug   → no draftId yet, creates on first keystroke
 *  - Existing mode: /create/:draftId           → loads existing draft, then enters editor
 *
 * Architecture (hook-safe):
 *  EditorPage  → reads params, resolves mode
 *    ├─ ExistingEditor (draftId: number) → useDraft, then renders EditorInner once loaded
 *    └─ NewEditor      (formatSlug)      → renders EditorInner immediately
 *  Both inner editors render EditorInner which unconditionally calls all hooks.
 *  EditorInner is keyed by `draftId ?? formatSlug` so it remounts cleanly on navigation.
 */
import { Suspense, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ToastProvider, useToast } from '@/components/ui/toast'
import {
  useAutosave,
  useFormats,
  useContextTags,
  useTones,
  useCultureTags,
  useAgeRatings,
  useLanguages,
  useDraft,
  useDeleteDraft,
  useSubmitDraft,
  validate,
  toJokePayload,
  EDITOR_BY_FORMAT,
  FORMAT_SLUGS,
  EditorShell,
  PreviewPane,
  TagPicker,
  AgeRatingRadio,
  SaveIndicator,
  SubmitConfirmModal,
  ChangeFormatModal,
  DeleteDraftModal,
} from '@/features/create'
import type { FormatSlug, ContentDraft, EditorDraft } from '@/features/create'

// ── toEditorDraft: ContentDraft → EditorDraft ─────────────────────────────────

function toEditorDraft(d: ContentDraft): EditorDraft {
  return {
    format: d.format,
    text: d.text,
    setup: d.setup,
    punchline: d.punchline,
    lines: d.lines,
    themes: d.themes,
    categories: d.categories,
    cultures: d.cultures,
    ageRating: d.ageRating,
    language: d.language,
    source: d.source,
  }
}

// ── EditorInner ───────────────────────────────────────────────────────────────
// All hooks are called unconditionally here.

interface EditorInnerProps {
  draftId: number | null
  formatSlug: FormatSlug
  initial?: EditorDraft
}

function EditorInner({ draftId, formatSlug, initial }: EditorInnerProps) {
  const navigate = useNavigate()
  const { toast } = useToast()

  // ── Autosave engine ──────────────────────────────────────────────────────────
  const { draft, dispatch, saveState, lastSavedAt, hasPendingChanges, draftId: liveId, retry } =
    useAutosave({
      draftId,
      formatSlug,
      initial,
      onCreated: (id) => navigate(`/create/${id}`, { replace: true }),
    })

  // ── Taxonomy data ────────────────────────────────────────────────────────────
  const { data: formats = [] } = useFormats()
  const { data: contextTags = [] } = useContextTags()
  const { data: tones = [] } = useTones()
  const { data: cultureTags = [] } = useCultureTags()
  const { data: ageRatings = [] } = useAgeRatings()
  useLanguages() // pre-fetch for potential future use

  // ── Mutations ────────────────────────────────────────────────────────────────
  const deleteDraft = useDeleteDraft()
  const submitDraft = useSubmitDraft()

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [showChangeFormat, setShowChangeFormat] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)

  // ── Navigation-away guard (beforeunload) ──────────────────────────────────────
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasPendingChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasPendingChanges])

  // ── Validation ───────────────────────────────────────────────────────────────
  const rule = formats.find((f) => f.slug === draft.format)
  const errors = rule ? validate(toJokePayload(draft), rule) : {}
  const canSubmit = !!rule && Object.keys(errors).length === 0

  // ── Lazy editor from registry ─────────────────────────────────────────────────
  const Editor = EDITOR_BY_FORMAT[draft.format]

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleConfirmFormat(slug: FormatSlug) {
    dispatch({ type: 'changeFormat', format: slug })
    setShowChangeFormat(false)
  }

  function handleDelete() {
    if (liveId == null) return
    deleteDraft.mutate(liveId, {
      onSuccess: () => navigate('/create'),
    })
    setShowDelete(false)
  }

  function handleSubmit() {
    if (liveId == null) return
    submitDraft.mutate(liveId, {
      onSuccess: () => {
        toast({
          message: "Sent for review. We'll email you when a moderator acts.",
          variant: 'success',
        })
        navigate('/create')
      },
    })
    setShowSubmit(false)
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footer = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}
    >
      <SaveIndicator saveState={saveState} lastSavedAt={lastSavedAt} onRetry={retry} />
      <div style={{ display: 'flex', gap: 10 }}>
        <Button
          variant="outline"
          size="sm"
          disabled={liveId == null}
          onClick={() => setShowDelete(true)}
          aria-label="Delete draft"
        >
          <Trash2 size={14} />
          Delete
        </Button>
        <Button
          variant="pill"
          size="sm"
          disabled={!canSubmit || liveId == null}
          onClick={() => setShowSubmit(true)}
        >
          Submit for review
        </Button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 1100, margin: '0 auto' }}>
          {/* Back navigation */}
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
              marginBottom: 24,
            }}
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          {/* Editor shell */}
          <EditorShell
            formatLabel={rule?.name ?? draft.format}
            onChangeFormat={() => setShowChangeFormat(true)}
            footer={footer}
            preview={<PreviewPane payload={toJokePayload(draft)} />}
          >
            {/* Format-specific editor (lazy) */}
            <Suspense fallback={<Skeleton style={{ height: 120, borderRadius: 16 }} />}>
              <Editor draft={draft} dispatch={dispatch} errors={errors} />
            </Suspense>

            {/* Tag section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
              <TagPicker
                label="Themes"
                options={contextTags}
                selected={draft.themes}
                onChange={(v) => dispatch({ type: 'setTags', field: 'themes', value: v })}
              />
              <TagPicker
                label="Categories"
                options={tones}
                selected={draft.categories}
                onChange={(v) => dispatch({ type: 'setTags', field: 'categories', value: v })}
              />
              <TagPicker
                label="Cultures"
                options={cultureTags}
                selected={draft.cultures}
                onChange={(v) => dispatch({ type: 'setTags', field: 'cultures', value: v })}
              />
              <AgeRatingRadio
                options={ageRatings}
                value={draft.ageRating}
                onChange={(v) => dispatch({ type: 'setMeta', field: 'ageRating', value: v })}
              />
            </div>
          </EditorShell>

          {/* Modals */}
          <ChangeFormatModal
            open={showChangeFormat}
            current={draft.format}
            onClose={() => setShowChangeFormat(false)}
            onConfirm={handleConfirmFormat}
          />
          <DeleteDraftModal
            open={showDelete}
            onClose={() => setShowDelete(false)}
            onConfirm={handleDelete}
          />
          <SubmitConfirmModal
            open={showSubmit}
            onClose={() => setShowSubmit(false)}
            onConfirm={handleSubmit}
          />
        </div>
      </FlowAppShell>
    </div>
  )
}

// ── NewEditor ─────────────────────────────────────────────────────────────────

interface NewEditorProps {
  formatSlug: FormatSlug
}

function NewEditor({ formatSlug }: NewEditorProps) {
  return <EditorInner key={formatSlug} draftId={null} formatSlug={formatSlug} />
}

// ── ExistingEditor ────────────────────────────────────────────────────────────

interface ExistingEditorProps {
  draftId: number
}

function ExistingEditor({ draftId }: ExistingEditorProps) {
  const navigate = useNavigate()
  const { data: draft, isLoading, isError } = useDraft(draftId)

  // Redirect to view-only page if draft is no longer editable
  useEffect(() => {
    if (draft && (draft.status === 'pending' || draft.status === 'published')) {
      navigate(`/create/${draftId}/view`, { replace: true })
    }
  }, [draft, draftId, navigate])

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
        <FlowAppShell active="library">
          <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 1100, margin: '0 auto' }}>
            <Skeleton style={{ height: 40, borderRadius: 10, marginBottom: 24, width: 80 }} />
            <Skeleton style={{ height: 52, borderRadius: 14, marginBottom: 16 }} />
            <Skeleton style={{ height: 200, borderRadius: 16, marginBottom: 16 }} />
            <Skeleton style={{ height: 100, borderRadius: 16 }} />
          </div>
        </FlowAppShell>
      </div>
    )
  }

  if (isError || !draft) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
        <FlowAppShell active="library">
          <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 720, margin: '0 auto' }}>
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
                Draft not found or failed to load.
              </p>
              <Link to="/create" style={{ color: '#6A1CF6', fontWeight: 600, fontSize: 14 }}>
                Back to your jokes
              </Link>
            </div>
          </div>
        </FlowAppShell>
      </div>
    )
  }

  // Redirecting — render nothing while useEffect fires
  if (draft.status === 'pending' || draft.status === 'published') {
    return null
  }

  const initial = toEditorDraft(draft)
  return (
    <EditorInner
      key={draftId}
      draftId={draftId}
      formatSlug={draft.format}
      initial={initial}
    />
  )
}

// ── EditorPage (root) ─────────────────────────────────────────────────────────

export function EditorPage() {
  const { formatSlug, draftId } = useParams<{
    formatSlug?: string
    draftId?: string
  }>()

  // New mode: /create/new/:formatSlug
  if (formatSlug !== undefined) {
    // Validate the slug
    const isValidSlug = (FORMAT_SLUGS as readonly string[]).includes(formatSlug)
    if (!isValidSlug) {
      // Redirect to picker — use useEffect pattern inside a tiny wrapper to keep render pure
      return <InvalidSlugRedirect />
    }
    return (
      <ToastProvider>
        <NewEditor formatSlug={formatSlug as FormatSlug} />
      </ToastProvider>
    )
  }

  // Existing mode: /create/:draftId
  if (draftId !== undefined) {
    const numId = Number(draftId)
    if (!numId || isNaN(numId)) {
      return <InvalidSlugRedirect />
    }
    return (
      <ToastProvider>
        <ExistingEditor draftId={numId} />
      </ToastProvider>
    )
  }

  // Fallback (shouldn't happen under normal routing)
  return <InvalidSlugRedirect />
}

// ── InvalidSlugRedirect ───────────────────────────────────────────────────────
// Tiny component that fires a redirect via useEffect (keeps render pure).

function InvalidSlugRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/create/new', { replace: true })
  }, [navigate])
  return null
}
