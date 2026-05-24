# Content Creation — Phase 5: Pages, Routing & Navbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox steps.

**Goal:** Assemble Phases 1–4 into the four route pages, wire the `/create/*` routes + redirects, and add the navbar entry points — making the Content Creation flow **navigable end-to-end** (mock-backed).

**Architecture:** Pages live in `src/pages/`, registered in `src/pages/index.ts`, mounted in `src/app/routes.tsx` under `ProtectedRoute`. All four wrap the existing `FlowAppShell` chrome (so the global header + new `+` entry are present). `EditorPage` is the integration hub: it owns `useAutosave`, `useFormats`, taxonomy hooks, `validate`, and composes `EditorShell` + the lazy editor + `PreviewPane` + tag pickers + footer + modals.

**Tech Stack:** React 19, React Router 7, TS, TanStack Query, Vitest + RTL.

**Branch:** `feat/content-creation-build`. **Companion:** product spec §4 (IA/routes/nav), §5 (journeys), §6 (screens); design §3.3.

---

## Tasks

### T1 — Navbar entry points (commit `feat: add /create entry points to navbar`)
- `src/components/FlowAppShell.tsx`: make the `active` prop optional (`active?: NavKey`) so create pages render without a highlighted nav item. Add a `+` icon button (lucide `Plus`) in the header right-side group, BEFORE the Bell, shown only when `isAuthenticated`: a `<Link to="/create">` styled like the bell button (40×40, radius 12), `aria-label="Submit a joke"`, `title="Submit a joke"`.
- `src/components/ProfileMenu.tsx`: add a "My submissions" menu item linking to `/create` (above or near "Your library").
- Tests: render FlowAppShell authenticated → a link to `/create` with aria-label "Submit a joke" exists; ProfileMenu has a "My submissions" link to `/create`. (Use existing test patterns; mock auth store as those components require — check how other FlowAppShell/ProfileMenu tests or stories set auth; if none, wrap with the real store and set authenticated state.)

### T2 — Routes + redirects + page barrel (commit `feat: wire /create routes + redirect legacy submit/drafts`)
- `src/pages/index.ts`: export `CreatorHubPage`, `FormatPickerPage`, `EditorPage`, `SubmissionDetailPage` (created in T3–T6; for T2 you may add the exports after those exist, or stub-create the page files first — implement T2 AFTER T3–T6, or create minimal placeholders. RECOMMENDED ORDER: do T3,T4,T5,T6 first, then T2 wiring.)
- `src/app/routes.tsx`: add under ProtectedRoute — `/create` → CreatorHubPage, `/create/new` → FormatPickerPage, `/create/new/:formatSlug` → EditorPage, `/create/:draftId` → EditorPage, `/create/:draftId/view` → SubmissionDetailPage. Change `/submit` to `<Navigate to="/create/new" replace />` and `/drafts` to `<Navigate to="/create" replace />`. Remove the now-unused `SubmitJokePage`/`DraftsPage` imports (leave the page files on disk; just unregister). Keep `/legacy/*` untouched.
- Tests: a routing test (render the router at `/submit` asserts redirect to `/create/new`; `/drafts` → `/create`). If full-router testing is heavy, assert the route config object maps the paths (import and inspect), or use `createMemoryRouter` in a test.

### T3 — CreatorHubPage (`src/pages/CreatorHubPage.tsx`) (commit `feat: add CreatorHubPage`)
- Wrap in `FlowAppShell` (no active). Title "Your jokes" + a "+ New" `Button` → navigate `/create/new`.
- Status tabs: All / Drafts / Pending / Published / Rejected with counts; filter `useDrafts()` results client-side by status (All = all). Tab state local.
- List `DraftCard`s (reverse-chron by `lastEditedAt`). Card click: draft/rejected → `/create/:id`; pending/published → `/create/:id/view`.
- States: loading → `Skeleton` cards; empty (no drafts) → friendly empty state + "Submit your first joke" → `/create/new`; empty filtered tab → contextual copy; error → message + retry.
- Tests: renders tabs; shows DraftCards from a mocked `useDrafts` (wrap in QueryClientProvider; mock adapter default returns seed drafts); clicking a draft card navigates (assert via a router/`useNavigate` spy or memory router); empty state when no drafts.

### T4 — FormatPickerPage (`src/pages/FormatPickerPage.tsx`) (commit `feat: add FormatPickerPage`)
- Wrap in FlowAppShell. "← Back" to `/create`. Heading "Pick a format".
- `useFormats()` → render 6 `FormatTile`s (use `FORMAT_EXAMPLE` for example text). Tile click → navigate `/create/new/:slug`. Loading → skeleton tiles; error → fall back to the 6 known slugs.
- Tests: renders 6 tiles from mocked useFormats; clicking a tile navigates to `/create/new/<slug>`.

### T5 — EditorPage (`src/pages/EditorPage.tsx`) — THE INTEGRATION (commit `feat: add EditorPage`)
- Params: `useParams()` → `formatSlug` (new) or `draftId` (existing). Determine mode.
- Existing mode: `useDraft(Number(draftId))` → when loaded, derive initial `EditorDraft` (map ContentDraft → EditorDraft) and pass as `initial` to `useAutosave`. If the draft status is `pending`/`published`, redirect to `/create/:id/view` (not editable). New mode: `formatSlug` from params (validate it's a known slug, else redirect `/create/new`).
- `useAutosave({ draftId: existing? Number(draftId): null, formatSlug: resolvedSlug, initial, onCreated: (id) => navigate(`/create/${id}`, {replace:true}) })`.
- Load `useFormats` + taxonomy hooks (`useContextTags`→themes, `useTones`→categories, `useCultureTags`, `useAgeRatings`, `useLanguages`).
- Compute `errors = validate(toJokePayload(draft), rule)` (rule = format from useFormats); `canSubmit = Object.keys(errors).length === 0`.
- Render `EditorShell` with: header formatLabel + onChangeFormat (opens `ChangeFormatModal`); children = the lazy editor from `EDITOR_BY_FORMAT[draft.format]` (wrap in `<Suspense fallback={Skeleton}>`) given `{draft, dispatch, errors}` PLUS the tag section (`TagPicker` ×3 bound to themes/categories/cultures via `dispatch setTags`, `AgeRatingRadio` via `dispatch setMeta ageRating`); preview = `<PreviewPane payload={toJokePayload(draft)} />`; footer = `SaveIndicator` + Delete button (opens `DeleteDraftModal`) + Submit button (disabled unless canSubmit; opens `SubmitConfirmModal`).
- Modals: ChangeFormat → `dispatch({type:'changeFormat', format})` + (the autosave will persist); Delete → `useDeleteDraft().mutate(id)` then navigate `/create`; Submit → `useSubmitDraft().mutate(id)` then toast (`useToast`) "Sent for review…" + navigate `/create`.
- Navigation-away guard: if `hasPendingChanges`, confirm before leaving (use a `beforeunload` listener + a guard on in-app back; minimal version: `window.confirm` on a `useBlocker`-style check or at least `beforeunload`).
- Tests (focused — this page is integration-heavy, keep tests targeted): new-mode renders the correct editor for a slug + a preview; typing dispatches and the Submit button is disabled until required fields valid; clicking Submit (when valid) calls the submit path. Use QueryClientProvider + memory router + ToastProvider wrappers; mock adapter default. Don't over-test; cover the wiring contracts.

### T6 — SubmissionDetailPage (`src/pages/SubmissionDetailPage.tsx`) (commit `feat: add SubmissionDetailPage`)
- `useDraft(Number(draftId))`. "← Back to your jokes" → `/create`.
- Status banner (pending amber / published green / rejected red). Render the joke read-only via `<JokeRenderer payload={...} revealed interactive={false} big />` (or PreviewPane). Tags shown.
- Pending: "With our reviewers since …" copy. Published: `PublishedStats` (if `draft.stats`) + "View public →" (link to `/jokes/:publishedId` if available, else hidden) + "+ New joke". Rejected: rejection reason panel + "Edit and resubmit" → `/create/:id`.
- Tests: pending shows pending banner; published shows stats; rejected shows reason + an "Edit and resubmit" link to `/create/:id`.

---

## Phase 5 done-when
- [ ] `npm test` green; `npx tsc -b` clean; `npm run build` succeeds.
- [ ] Navigating to `/create` (authenticated) shows the hub; `/create/new` the picker; picking a format opens the editor; autosave creates a draft; submit returns to the hub; `/submit` and `/drafts` redirect.
- [ ] The `+` header entry and ProfileMenu "My submissions" link reach `/create`.

## Self-review notes
- Order: build pages T3–T6 first, then wire routes/barrel (T2), then navbar (T1) — so imports resolve. (Adjust task order accordingly; commits can still be per-task.)
- EditorPage is the riskiest unit — keep its own internal helpers small; the heavy lifting lives in Phase 2/3/4 already.
- ContentDraft→EditorDraft mapping: a small `toEditorDraft(d: ContentDraft): EditorDraft` helper (in editor-state.ts or the page) picking the editable fields.
- Header status dot, analytics events, and richer published stats are Phase 6 — do not block here.
