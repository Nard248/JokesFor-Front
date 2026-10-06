/**
 * useAutosave — editor autosave engine (Phase 3)
 *
 * Responsibilities:
 *  - Manages a local EditorDraft via useReducer (seeded from initial or emptyEditorDraft)
 *  - On first meaningful change when draftId===null: creates the draft (guarded by creatingRef)
 *  - Debounces 800ms after each dispatch, then runs a serialized PATCH queue
 *  - Exposes a save-state machine: idle → debouncing → saving → saved | error
 *  - retry() re-runs the last PATCH; flush() force-saves immediately
 */
import { useReducer, useRef, useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { contentAdapter } from './adapter'
import { useCreateDraft } from './mutations'
import { createKeys } from './queries'
import { editorReducer, emptyEditorDraft, toJokePayload } from './editor-state'
import type { EditorDraft, EditorAction } from './editor-state'
import type { FormatSlug } from './types'
import { track } from './analytics'

export type SaveState = 'idle' | 'debouncing' | 'saving' | 'saved' | 'error'

export interface UseAutosave {
  draft: EditorDraft
  dispatch: (action: EditorAction) => void
  saveState: SaveState
  lastSavedAt: number | null
  hasPendingChanges: boolean
  draftId: number | null
  retry: () => void
  flush: () => Promise<void>
}

function isMeaningful(draft: EditorDraft): boolean {
  const p = toJokePayload(draft)
  if (p.text.trim()) return true
  if (p.setup.trim()) return true
  if (p.punchline.trim()) return true
  if (p.lines && p.lines.some((l) => l.trim())) return true
  // An upload before any typing (image format) should still create the draft.
  if (draft.media.length > 0) return true
  return false
}

export function useAutosave(args: {
  draftId: number | null
  formatSlug: FormatSlug
  initial?: EditorDraft
  onCreated?: (id: number) => void
}): UseAutosave {
  const { formatSlug, initial, onCreated } = args

  // ── Local editor state ──────────────────────────────────────────────────────
  const [draft, dispatchRaw] = useReducer(
    editorReducer,
    undefined,
    () => initial ?? emptyEditorDraft(formatSlug)
  )

  // ── Draft ID ────────────────────────────────────────────────────────────────
  const [draftId, setDraftId] = useState<number | null>(args.draftId)
  const draftIdRef = useRef<number | null>(args.draftId)

  // ── Save state machine ──────────────────────────────────────────────────────
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  // Render-visible mirror of dirtyRef (changes queued behind an in-flight PATCH).
  // The ref drives the async coordination; this state drives hasPendingChanges,
  // since a ref must not be read during render.
  const [hasQueuedChanges, setHasQueuedChanges] = useState(false)

  // ── TanStack Query ──────────────────────────────────────────────────────────
  const queryClient = useQueryClient()
  const createDraftMutation = useCreateDraft()

  // ── Async coordination refs ─────────────────────────────────────────────────
  const creatingRef = useRef(false)
  const inFlightRef = useRef(false)
  const dirtyRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Always read the latest draft state inside async callbacks
  const draftRef = useRef<EditorDraft>(draft)
  // Fix 4: guard post-await state setters against stale updates after unmount
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  const setDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty
    if (mountedRef.current) setHasQueuedChanges(dirty)
  }, [])

  // ── Core PATCH runner (stable, reads refs) ──────────────────────────────────
  // We call contentAdapter.patchDraft directly so the promise resolves in a
  // single microtask tick — making timer-based tests deterministic.
  // After success we invalidate the TanStack Query detail cache so any
  // useQuery(detail) subscribers stay in sync.
  //
  // Changes queued while a PATCH is in flight (dirtyRef) are flushed by looping,
  // and only after a SUCCESSFUL patch (Fix 2): an error ends the run and leaves
  // the queue for retry(). A loop rather than a recursive call keeps the
  // callback self-contained, so the React Compiler can preserve its memoization.
  const runPatch = useCallback(async () => {
    const id = draftIdRef.current
    if (id === null) return

    inFlightRef.current = true
    try {
      for (;;) {
        if (mountedRef.current) setSaveState('saving')
        try {
          const current = draftRef.current
          await contentAdapter.patchDraft(id, {
            format: current.format,
            text: current.text,
            setup: current.setup,
            punchline: current.punchline,
            lines: current.lines,
            themes: current.themes,
            categories: current.categories,
            cultures: current.cultures,
            countries: current.countries,
            ageRating: current.ageRating,
            language: current.language,
            source: current.source,
            media: current.media,
          })
        } catch {
          // Fix 2: on error, leave the dirty queue as-is; recovery is via retry()
          if (mountedRef.current) setSaveState('error')
          return
        }
        // Keep the TanStack Query cache fresh
        queryClient.invalidateQueries({ queryKey: createKeys.drafts.detail(id) })
        // Fix 4: guard against stale state updates after unmount
        if (mountedRef.current) {
          setLastSavedAt(Date.now())
          setSaveState('saved')
        }
        if (!dirtyRef.current) return
        setDirty(false)
      }
    } finally {
      inFlightRef.current = false
    }
    // runPatch is stable — all shared state is via refs
  }, [queryClient, setDirty])

  // ── Schedule debounced PATCH ────────────────────────────────────────────────
  const schedulePatch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      if (inFlightRef.current) {
        setDirty(true)
        return
      }
      runPatch()
    }, 800)
  }, [runPatch, setDirty])

  // ── Public dispatch ─────────────────────────────────────────────────────────
  const dispatch = useCallback(
    (action: EditorAction) => {
      const nextDraft = editorReducer(draftRef.current, action)
      draftRef.current = nextDraft
      dispatchRaw(action)

      // Create draft on first meaningful change
      if (draftIdRef.current === null && isMeaningful(nextDraft) && !creatingRef.current) {
        creatingRef.current = true
        setSaveState('debouncing')
        createDraftMutation.mutateAsync(formatSlug)
          .then((created) => {
            draftIdRef.current = created.id
            setDraftId(created.id)
            track('draft_created', { format: formatSlug })
            onCreated?.(created.id)
            schedulePatch()
          })
          .catch(() => {
            creatingRef.current = false
            setSaveState('error')
          })
        return
      }

      if (draftIdRef.current !== null) {
        if (inFlightRef.current) {
          // A PATCH is already in flight — mark dirty so a follow-up runs after it settles.
          // We still set saveState to debouncing so hasPendingChanges reflects correctly.
          setDirty(true)
          setSaveState('debouncing')
        } else {
          setSaveState('debouncing')
          schedulePatch()
        }
      }
    },
    [createDraftMutation, formatSlug, onCreated, schedulePatch, setDirty]
  )

  // ── retry ───────────────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    if (draftIdRef.current === null) return
    runPatch()
  }, [runPatch])

  // ── flush ───────────────────────────────────────────────────────────────────
  // Fix 3: if a PATCH is already in-flight, do NOT start a second concurrent one.
  // Instead, mark dirty so the in-flight success path will flush the changes.
  const flush = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (inFlightRef.current) {
      setDirty(true)
      return
    }
    await runPatch()
  }, [runPatch, setDirty])

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Fix 1: hasPendingChanges must be true during a clean in-flight save,
  // not only when both in-flight AND dirty. hasQueuedChanges captures queued changes.
  const hasPendingChanges =
    saveState === 'debouncing' || saveState === 'saving' || hasQueuedChanges

  return {
    draft,
    dispatch,
    saveState,
    lastSavedAt,
    hasPendingChanges,
    draftId,
    retry,
    flush,
  }
}
