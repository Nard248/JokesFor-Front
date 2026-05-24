# Content Creation — Phase 3: Autosave Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox steps.

**Goal:** Build the editor's local-state + autosave engine: a reducer for in-flight edits, a `useAutosave` hook (create-on-first-change → debounced serialized PATCH → save-state machine), and a `SaveIndicator` component — so Phase 4 editors just render fields and call `setField`.

**Architecture:** Local editor state in a `useReducer` (seeded from the server draft), separate from the TanStack Query cache (last-confirmed save) per design §10.3. The hook owns: first-meaningful-change creates the draft (via `useCreateDraft`, URL rewrite handled by the page), 800ms debounce, a serialized PATCH queue (never cancel in-flight; enqueue latest diff), and a `idle→debouncing→saving→saved|error` state machine. Validation (`validate` from Phase 2) drives `canSubmit`. Consumes Phase 2 hooks.

**Tech Stack:** React 19, TS, TanStack Query v5, Vitest + RTL (fake timers for debounce).

**Branch:** `feat/content-creation-build`. **Companion:** design §4.4/§10/§12; product spec §12 (autosave contract).

---

## Shared editor types (Task 1)

```ts
// src/features/create/editor-state.ts
import type { FormatSlug } from './types'
import type { JokePayload } from '@/components/JokeRenderer'

/** The user-editable view-model (ContentDraft minus server-owned fields). */
export interface EditorDraft {
  format: FormatSlug
  text: string; setup: string; punchline: string; lines: string[] | null
  themes: string[]; categories: string[]; cultures: string[]
  ageRating: string | null; language: string; source: string
}

export type EditorAction =
  | { type: 'hydrate'; draft: EditorDraft }
  | { type: 'setField'; field: 'text' | 'setup' | 'punchline'; value: string }
  | { type: 'setLines'; lines: string[] }
  | { type: 'setTags'; field: 'themes' | 'categories' | 'cultures'; value: string[] }
  | { type: 'setMeta'; field: 'ageRating' | 'language' | 'source'; value: string | null }
  | { type: 'changeFormat'; format: FormatSlug }

export function emptyEditorDraft(format: FormatSlug): EditorDraft
export function toJokePayload(d: EditorDraft): JokePayload  // {format,text,setup,punchline,lines}
export function editorReducer(state: EditorDraft, action: EditorAction): EditorDraft
```

`changeFormat` clears fields incompatible with the new format per product spec §7.7 (one-liner↔observ↔story keep `text`; setup↔anti keep setup/punchline; otherwise clear). `setField`/`setLines` set the relevant field.

---

## Task 1: Editor reducer (`editor-state.ts` + test)
- [ ] Test: `emptyEditorDraft('knock')` has format knock, empty fields, `lines: null→[]`? (decide: knock starts `lines: []`); `editorReducer` setField updates; changeFormat setup→anti keeps setup/punchline; changeFormat setup→oneliner clears setup/punchline and keeps text empty; `toJokePayload` extracts the 5 render fields.
- [ ] FAIL → implement → PASS → tsc clean → commit `feat: add editor-state reducer`.

---

## Task 2: `useAutosave` hook (`autosave.ts` + test)

**Contract:**
```ts
export type SaveState = 'idle' | 'debouncing' | 'saving' | 'saved' | 'error'
export interface UseAutosave {
  draft: EditorDraft
  dispatch: (action: EditorAction) => void   // any dispatch schedules a debounced save
  saveState: SaveState
  lastSavedAt: number | null
  hasPendingChanges: boolean                  // true while debouncing or queued/in-flight unsent
  draftId: number | null                      // null until first save creates the row
  retry: () => void
  flush: () => Promise<void>                   // force-save now (Save & exit / beforeunload)
}
export function useAutosave(args: {
  draftId: number | null            // null for /create/new/:formatSlug
  formatSlug: FormatSlug
  initial?: EditorDraft             // when editing existing (from useDraft), hydrate
  onCreated?: (id: number) => void  // page rewrites URL to /create/:id
}): UseAutosave
```

**Behaviors (product spec §12):**
- Seed reducer from `initial` (existing draft) or `emptyEditorDraft(formatSlug)` (new).
- On a meaningful change (any dispatch that makes a required field non-empty) when `draftId===null`: call `useCreateDraft().mutateAsync(formatSlug)`, set internal id, call `onCreated(id)`. Guard with a `creatingRef` so concurrent dispatches create only one row.
- Debounce 800ms after last dispatch, then PATCH the current diff via `usePatchDraft(id)`. Serialized queue: if a PATCH is in flight, mark dirty and fire another after it settles. Never cancel in-flight.
- State machine: dispatch→`debouncing`; timer fires & PATCH starts→`saving`; success→`saved` + `lastSavedAt=Date.now()`; error→`error` (retry() re-runs).
- `flush()` clears the debounce timer and awaits an immediate PATCH.
- Send `format` + content together when relevant (the patch body builds from the full `EditorDraft` via the adapter's `toPatchBody`, so this is automatic).

- [ ] Tests (use `vi.useFakeTimers()` + QueryClientProvider wrapper, mock adapter):
  - new draft: first `setField` (non-empty) creates a draft (draftId becomes non-null, onCreated called once even with 2 quick dispatches);
  - after create, advancing 800ms triggers a PATCH and saveState goes saving→saved;
  - rapid dispatches debounce to a single PATCH; a dispatch during an in-flight PATCH enqueues exactly one follow-up;
  - error path sets saveState 'error' and retry() recovers (use an adapter spy that rejects once).
- [ ] FAIL → implement → PASS → tsc clean → commit `feat: add useAutosave engine`.

---

## Task 3: `SaveIndicator` (`components/SaveIndicator.tsx` + test)
- [ ] Renders per `saveState`: debouncing `…`, saving `Saving…`, saved `Saved` (+ relative time from `lastSavedAt`), error `Save failed · retry` (button calls `retry`). `aria-live="polite"`. idle with a prior save shows `Saved`.
- [ ] Test: shows "Saving…" for saving; "Saved" for saved; error renders a retry button that calls the handler.
- [ ] FAIL → implement → PASS → tsc clean → commit `feat: add SaveIndicator`.

---

## Phase 3 done-when
- [ ] `npm test` green; `npx tsc -b` clean; `npm run build` succeeds.
- [ ] `useAutosave` + `editorReducer` + `SaveIndicator` exported from the module barrel (`index.ts`).
- [ ] No navigation guard yet (Phase 5 page wires `hasPendingChanges` into a route-leave prompt).

## Self-review notes
- The hook depends only on Phase 2 (`useCreateDraft`, `usePatchDraft`, adapter `toPatchBody`, `validate`) + the reducer. Editors (Phase 4) consume `draft`/`dispatch`/`saveState`. Preview consumes `toJokePayload(draft)`.
- `canSubmit`/validation surfacing: editors call `validate(toJokePayload(draft), rule)` directly (rule from `useFormats`); the hook needn't own it. (Keep the hook focused on persistence.)
