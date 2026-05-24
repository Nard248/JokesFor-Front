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

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  // ── Core PATCH runner (stable, reads refs) ──────────────────────────────────
  // We call contentAdapter.patchDraft directly so the promise resolves in a
  // single microtask tick — making timer-based tests deterministic.
  // After success we invalidate the TanStack Query detail cache so any
  // useQuery(detail) subscribers stay in sync.
  const runPatch = useCallback(async () => {
    const id = draftIdRef.current
    if (id === null) return

    inFlightRef.current = true
    setSaveState('saving')

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
        ageRating: current.ageRating,
        language: current.language,
        source: current.source,
      })
      // Keep the TanStack Query cache fresh
      queryClient.invalidateQueries({ queryKey: createKeys.drafts.detail(id) })
      setLastSavedAt(Date.now())
      setSaveState('saved')
    } catch {
      setSaveState('error')
    } finally {
      inFlightRef.current = false
      if (dirtyRef.current) {
        dirtyRef.current = false
        runPatch()
      }
    }
    // runPatch is intentionally stable — all shared state is via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient])

  // ── Schedule debounced PATCH ────────────────────────────────────────────────
  const schedulePatch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      if (inFlightRef.current) {
        dirtyRef.current = true
        return
      }
      runPatch()
    }, 800)
  }, [runPatch])

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
          dirtyRef.current = true
          setSaveState('debouncing')
        } else {
          setSaveState('debouncing')
          schedulePatch()
        }
      }
    },
    [createDraftMutation, formatSlug, onCreated, schedulePatch]
  )

  // ── retry ───────────────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    if (draftIdRef.current === null) return
    runPatch()
  }, [runPatch])

  // ── flush ───────────────────────────────────────────────────────────────────
  const flush = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    await runPatch()
  }, [runPatch])

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const hasPendingChanges =
    saveState === 'debouncing' || (inFlightRef.current && dirtyRef.current)

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
