# Content Creation — Phase 6: v1 Extras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox steps.

**Goal:** Add the two remaining v1 extras: a header status-change dot (unseen pending→published/rejected) and analytics event scaffolding (no-op `track()` wired at the key §17 sites). Published-stats is already implemented (PublishedStats on SubmissionDetailPage).

**Architecture:** A small Zustand `useCreatorStore` (persisted `lastSeenAt`) + a derived "unseen change" check in `FlowAppShell` driving a dot on the `+` entry, cleared when the hub is viewed. A tiny `analytics.ts` `track()` (no-op/console in dev) called at the highest-value funnel events.

**Tech Stack:** React 19, Zustand (persist), TanStack Query, Vitest + RTL.

**Branch:** `feat/content-creation-build`. **Companion:** design §7 (extras), product spec §4.4 (header dot), §17 (analytics events).

---

## Task 1 — Analytics scaffolding (commit `feat: add analytics scaffolding + wire create events`)
- `src/features/create/analytics.ts`:
```ts
export type CreateEvent =
  | 'creator_hub_viewed' | 'format_picker_viewed' | 'format_selected'
  | 'editor_opened' | 'draft_created' | 'submit_succeeded' | 'draft_deleted' | 'format_changed'
export function track(event: CreateEvent, props?: Record<string, unknown>): void {
  // No analytics SDK yet (design §reconciliation). No-op in prod; debug in dev.
  if (import.meta.env.DEV) console.debug('[analytics]', event, props ?? {})
}
```
- Wire calls (highest-value, keep minimal):
  - `CreatorHubPage` mount → `track('creator_hub_viewed', { tab })` (once on mount).
  - `FormatPickerPage` mount → `track('format_picker_viewed')`; tile click → `track('format_selected', { format: slug })`.
  - `EditorPage`/EditorInner mount → `track('editor_opened', { format, mode })`; on submit success → `track('submit_succeeded', { draftId, format })`; on delete confirm → `track('draft_deleted', {...})`; change-format confirm → `track('format_changed', { from, to })`.
  - `useAutosave` onCreated (or where the draft is first created) → `track('draft_created', { format })`.
- Tests: `analytics.test.ts` — `track` doesn't throw and (in DEV) calls console.debug with the event; a wiring test is optional (mock `track` and assert it's called on FormatPickerPage tile click).

## Task 2 — Header status-change dot (commit `feat: add creator header status dot`)
- `src/features/create/store.ts`:
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface CreatorState { lastSeenAt: number; markSeen: () => void }
export const useCreatorStore = create<CreatorState>()(persist(
  (set) => ({ lastSeenAt: 0, markSeen: () => set({ lastSeenAt: Date.now() }) }),
  { name: 'jokesfor-creator' },
))
```
  (Mirror the existing onboarding store persist pattern in `src/stores/`.)
- `useUnseenSubmissionChange()` hook (in store.ts or a small queries addition): `const { data } = useDrafts(); const { lastSeenAt } = useCreatorStore(); return (data ?? []).some(d => (d.status === 'published' || d.status === 'rejected') && Date.parse(d.lastEditedAt) > lastSeenAt)`.
- `FlowAppShell`: call `useUnseenSubmissionChange()` (authenticated only) and render a small dot badge on the `+` entry when true. (Keep the dot purely visual; absolute-positioned on the `+` button.)
- `CreatorHubPage`: call `useCreatorStore().markSeen()` on mount (clears the dot).
- Tests: store `markSeen` sets `lastSeenAt`; `useUnseenSubmissionChange` returns true when a published/rejected draft is newer than lastSeenAt and false after markSeen (test the hook with QueryClientProvider + a seeded/mocked useDrafts). FlowAppShell shows the dot when the hook returns true (mock the hook).

---

## Phase 6 done-when
- [ ] `npm test` green; `npx tsc -b` clean; `npm run build` succeeds.
- [ ] `track()` wired at the listed sites (no SDK; safe no-op). Header `+` shows a dot on unseen published/rejected change; visiting `/create` clears it.
- [ ] Barrel exports `track`, `useCreatorStore`, `useUnseenSubmissionChange`.

## Self-review notes
- Keep analytics truly no-op (no network) — it's scaffolding for a future SDK, per the design's reconciliation note.
- The dot heuristic (published/rejected newer than lastSeenAt) is a v1 approximation of spec §4.4; acceptable since the backend has no per-status-change timestamp yet.
