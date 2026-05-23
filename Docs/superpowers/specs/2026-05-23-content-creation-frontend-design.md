# Content Creation (Creator Authoring) — Frontend Implementation Design

**Status:** Approved design — 2026-05-23. Ready for `writing-plans`.
**Author:** brainstormed via session 2026-05-23.

## Relationship to other docs

This is **not** a product spec. The product/UX spec already exists and is the source of
truth for screens, copy, states, and the API contract:

- `Docs/API/Frontend_Content_Creation_Spec.md` — the full product spec (routes, 6 editors,
  autosave, validation, a11y, analytics, acceptance criteria, backend gaps). **Read it first.**
- `Docs/API/Frontend_Integration_Handout.md` — broader API surface / wiring.
- `MEMORY` / `state_management.md` — Zustand + TanStack Query adapter architecture.

This document is the **reconciliation + architecture layer**: how that product spec maps onto
*this* codebase (which differs from the spec's assumptions), the decisions taken, and the
build sequence that feeds the implementation plan. Where this doc and the product spec
disagree on *mechanics*, this doc wins (it reflects verified code reality); where they
disagree on *product behavior*, the product spec wins.

---

## 1. Decisions taken (brainstorming outcomes)

| Decision | Choice | Rationale |
|---|---|---|
| Architecture | **New `src/features/create/` module + `JokeRenderer` extraction** (Approach A) | Small single-purpose units; isolates the risky renderer refactor; clean migration; mechanical plan. |
| Old `/submit` + `/drafts` | **Replace + redirect** | One canonical creation flow. `/submit → /create/new`, `/drafts → /create`. |
| Knock-knock reorder | **No-dep up/down + keyboard** | WCAG-clean by default, zero bundle cost; drag can be layered later. |
| Data strategy | **Mock-first via adapter**, real behind `VITE_USE_REAL_CREATE` | Unblocks all FE work despite the missing backend create-draft endpoint. |
| v1 scope — included | Header status-change dot; analytics event scaffolding (no-op); published-stats section (mocked) | Cheap-now / painful-to-retrofit items. |
| v1 scope — deferred | Offline banner + PATCH queue + `sendBeacon` tab-close save | Fast-follow per spec §13.1. |

---

## 2. Spec-vs-reality reconciliation

The product spec was written against assumptions that do not match this repo. Verified deltas:

| Product spec assumes | Verified reality | Resolution |
|---|---|---|
| shadcn/ui (`Dialog`, `Textarea`, `RadioGroup`, `Skeleton`, toast) | Custom CVA design system in `src/components/ui/` (button, card, badge, chip, input, avatar, progress-bar). Only `@radix-ui/react-slot` installed. | **Build 5 new primitives** in the existing token/CVA style: `textarea`, `modal`, `radio-group`, `skeleton`, `toast`. |
| "Extract a `<JokeRenderer>` — biggest refactor" | `src/components/FlowJokeCard.tsx` already renders all 6 formats from `{fmt,setup,punch,text,lines}` and has `jokeToFlowData(joke)`. But it bundles header/footer/reactions and bakes in interactive reveal state. | Extract its `Body` into a pure, reveal-parameterized `<JokeRenderer>`; refactor `FlowJokeCard` to consume it. |
| Blank-slate `/create/*` routes | `/submit` (`SubmitJokePage`) + `/drafts` (`DraftsPage`) already live; `/legacy/submit` + `/legacy/drafts` already taken by `*Legacy` components. | Add `/create/*`; redirect `/submit`+`/drafts`; **retire** the redesigned `SubmitJokePage`/`DraftsPage` (remove from router, keep files for reference). |
| `dnd-kit` | Not installed. | No-dep reorder (decision above). |
| PostHog analytics | No analytics SDK. | `analytics.ts` no-op `track()` wired at call-sites; connect SDK later. |
| `POST /jokes/my-drafts/` create-draft | Absent in `api.ts` (code comments "adds this endpoint later"). Spec §19.1 = the one backend blocker. | Mock-first sidesteps it; real path behind toggle. |
| Unit test runner | **Playwright e2e only** (`@playwright/test`); no Vitest/Jest, no existing unit tests. | e2e-first (matches convention); Vitest for pure logic is an optional add (see §8). |

Supporting facts: `Joke` type (`src/lib/api.ts`) already carries `lines`, `format.slug`,
`themes`, `categories` — the renderer payload is fully supported.

---

## 3. Architecture

### 3.1 Feature module — `src/features/create/`

```
api.ts          contentApi: real endpoints (create-draft, formats, taxonomy, drafts CRUD)
mock.ts         mockContentApi + mock format/taxonomy catalogs + in-memory draft store
adapter.ts      contentAdapter — USE_MOCKS / VITE_USE_REAL_CREATE switch (preferences pattern)
queries.ts      query-key factory + useFormats / useTaxonomy / useDrafts / useDraft
mutations.ts    useCreateDraft / usePatchDraft / useSubmitDraft / useDeleteDraft
validation.ts   data-driven validate(payload, rule) sourced from GET /formats
autosave.ts     useAutosave — debounce + serialized PATCH queue + save-state machine
store.ts        useCreatorStore — lastSeenAt for the header status dot
analytics.ts    no-op track() + typed event helpers (§17 of product spec)
types.ts        FormatRule, Taxon, ContentDraft (view-model), JokePayload, FormatSlug
editors/        OneLiner, SetupPunchline (serves anti), Knock, Story, Observational + lazy registry
components/      DraftCard, FormatTile, EditorShell, DialogueLine, TagPicker, AgeRatingRadio,
                PreviewPane, StatusBadge, SaveIndicator, PublishedStats, SubmitConfirmModal,
                ChangeFormatModal, DeleteDraftModal
index.ts        barrel
```

Route-level pages in `src/pages/`: `CreatorHubPage`, `FormatPickerPage`, `EditorPage`,
`SubmissionDetailPage`. `EditorPage` serves both `/create/new/:formatSlug` and
`/create/:draftId`, branching on whether `draftId` is present.

### 3.2 New design-system primitives — `src/components/ui/`

Built in the existing CVA + `@theme` token style (Epilogue/Jakarta, 48px radii, pill, oklch),
**not** shadcn:

- `textarea.tsx` — auto-resize; `variant` parity with `input.tsx`.
- `modal.tsx` — focus-trap, Escape close, outside-click, reuses `.dropdown-enter`/reduced-motion CSS.
- `radio-group.tsx` — accessible radio set for age rating.
- `skeleton.tsx` — loading placeholders.
- `toast` — provider + `useToast()` + `<Toaster>`; lightweight, no new dep.

### 3.3 Routing & navigation migration

- Add (all `ProtectedRoute`): `/create`, `/create/new`, `/create/new/:formatSlug`,
  `/create/:draftId`, `/create/:draftId/view`.
- Redirect `/submit → /create/new`, `/drafts → /create` via `<Navigate replace>`.
- Retire `SubmitJokePage`/`DraftsPage` from the router (files kept for reference).
- Entry points: `+` icon (lucide `Plus`, with status dot) in `FlowAppShell` header and
  `DesktopHeader`; "My submissions" in `ProfileMenu`; repoint `MobileHeader` "Post Joke" and
  `Sidebar` "Add New Joke" → `/create/new`.
- Guest CTAs reuse the existing login-with-`returnTo` gating pattern.

---

## 4. Data layer & view-model

### 4.1 DTO ↔ view-model boundary (mirrors the `preferences` `toDTO/fromDTO` precedent)

```ts
type FormatSlug = 'oneliner' | 'setup' | 'knock' | 'story' | 'anti' | 'observ'
type JokePayload = { format: FormatSlug; text: string; setup: string; punchline: string; lines: string[] | null }
type ContentDraft = JokePayload & {
  id: number
  status: 'draft' | 'pending' | 'published' | 'rejected'
  themes: string[]; categories: string[]; cultures: string[]
  ageRating: string | null; language: string; source: string
  lastEditedAt: string; rejectionReason: string
  stats?: PublishedStats | null
}
```

`fromDTO` prefers new keys (`themes`/`categories`), falls back to legacy
(`context_tags`/`tones`); `toDTO` writes `categories`/`context_tags` per spec guidance,
defaults `language='en'`, `source='original'`.

### 4.2 Query keys & cache

- `formats`, `taxonomy.{ages,tones,themes,cultures,languages}` → `staleTime: 1h`, fetched in
  parallel at app load (no waterfall into `/create`).
- `drafts.list` → `staleTime: 30s`.
- `drafts.detail(id)` → `refetchOnMount: 'always'`.

### 4.3 Mutations

- `usePatchDraft(id)` — optimistic write into `drafts.detail(id)`, rollback on error,
  reconcile from response (three-phase pattern).
- `useCreateDraft()` — `POST {format}`, push row to cache, `navigate('/create/:id',{replace:true})`.
- `useSubmitDraft(id)` / `useDeleteDraft(id)` — invalidate `drafts.list`, navigate to `/create`.

### 4.4 Autosave engine (`autosave.ts`)

- **Local editor state** via `useReducer` seeded from `fromDTO(server)`; query cache =
  last-confirmed-save. The two are deliberately separate so optimistic PATCHes never re-seed
  inputs mid-typing.
- **First meaningful change** (first non-empty char in a required field) → create-draft, URL
  rewrite. Guarded by a `creating` flag (prevents double-create on double keystroke/click).
- **Debounce 800ms**, then a **serialized queue**: in-flight PATCH is never cancelled; a single
  follow-up PATCH with the latest diff is enqueued.
- **Format-aware PATCH:** on format change, send `format` + cleared/new content fields in the
  same PATCH (serializer 400s on `{format}` alone).
- **Save-state machine:** `idle → debouncing → saving → saved | error(retry)`, surfaced via
  `SaveIndicator` with `aria-live="polite"`.
- **Navigation guard:** confirm dialog when a PATCH is pending/unsent.
- **403 mid-session** → stop autosave, navigate to detail view.
- *(Deferred: offline queue + `sendBeacon`.)*

---

## 5. Renderer extraction

`src/components/JokeRenderer.tsx` — pure component:
`<JokeRenderer payload={JokePayload} revealed?={boolean} interactive?={boolean} />`.

- Editor `PreviewPane` mounts it with `revealed`, `interactive={false}` — always-revealed,
  no tap-gating, so it reflects exactly what readers get.
- `FlowJokeCard` refactored to consume `JokeRenderer` for its body, keeping its
  header/footer/reactions. **No visual change** to existing pages — single rendering source of truth.
- Slug normalization reuses `jokeToFlowData`.

This is the **first** implementation task (per product spec §9.3 — the renderer must not lie to creators).

---

## 6. Components & editors

**Editors** (`editors/`, `React.lazy` registry keyed by slug):
- `OneLinerEditor`, `ObservationalEditor`, `StoryEditor` — single auto-resize `Textarea`;
  Story adds a live word counter (amber <30, green ≥30) gating Submit.
- `SetupPunchlineEditor` — two textareas; shows anti-joke footer hint when `format==='anti'`.
- `KnockEditor` — dialogue builder: `DialogueLine[]`, derived non-editable A/B labels (index
  parity), up/down + keyboard reorder, add/remove with 4–8 enforcement, live "N of 4–8" counter.

**Shared chrome:** `EditorShell` (format header + "Change format" + footer: `SaveIndicator`,
Delete, Submit); `TagPicker` (typeahead chip multi-select reusing `Chip`); `AgeRatingRadio`;
`PreviewPane`; three modals on the new `Modal` primitive; `StatusBadge`; `DraftCard`;
`FormatTile`; `PublishedStats`.

---

## 7. Cross-cutting

- **Validation** (`validation.ts`): data-driven from `/formats` catalog —
  required/forbidden/constraints. Submit enables iff zero client errors. Server 400 field-errors
  render in the same inline slots and **override** client messages. Never blocks typing.
- **Error matrix** (product spec §13): field-400 inline; `detail`-400/403/404 → toast + navigate;
  401 → existing axios interceptor; 429 → "slow down" + brief Submit disable; 5xx → retry on PATCH.
- **Header dot:** `useCreatorStore.lastSeenAt`; poll `my-drafts` on load, compare statuses, set
  dot on unseen change, clear on `/create` visit.
- **Analytics:** `analytics.ts` no-op `track()` wired at the §17 event call-sites.
- **Published stats:** `PublishedStats` renders mocked saves/reactions/reports; hidden when absent.
- **A11y (WCAG AA):** labels + `aria-describedby` on fields; `aria-live` save indicator;
  focus-trapped modals; keyboard reorder; 44px touch targets; `prefers-reduced-motion` (CSS already honors it).

---

## 8. Testing

Repo has **Playwright e2e only**; e2e-first matches the established convention.

- **e2e (Playwright):** create → autosave → edit → submit happy path against the mock adapter;
  knock 4–8 enforcement + reorder; format-switch field-clearing; rejected → edit-and-resubmit;
  validation-gated Submit button.
- **Pure-logic units:** `validation.ts`, the autosave reducer/state-machine, `fromDTO/toDTO`,
  and `KnockEditor` parity/bounds logic would benefit from unit tests. **No unit runner exists.**
  Optional add: introduce Vitest + RTL for these. *Open item — confirm before the plan's test phase.*

---

## 9. Build sequence (expanded into phases by `writing-plans`)

1. **Foundation** — `JokeRenderer` extraction + `FlowJokeCard` refactor; 5 new UI primitives.
2. **Data layer** — `types`, `api`, `mock` (create-draft + catalogs), `adapter`, `queries`,
   `mutations`, `validation`.
3. **Autosave engine** — `autosave.ts` + `SaveIndicator`, proven on one format end-to-end.
4. **Editors & chrome** — `EditorShell`, `TagPicker`, `AgeRatingRadio`, `PreviewPane`, then the 5 editors.
5. **Pages & routing** — 4 pages; redirects; nav entry points.
6. **v1 extras & polish** — header dot, analytics call-sites, published stats, error matrix,
   a11y pass, e2e tests.

---

## 10. Open items / risks

- **Backend blocker (spec §19.1):** real create-draft endpoint must land before the real-API
  toggle flips. Mock-first removes this from the FE critical path.
- **Legacy route collision:** `/legacy/submit`+`/legacy/drafts` already used by `*Legacy`
  components; redesigned `SubmitJokePage`/`DraftsPage` are retired in place, not re-homed.
- **Unit-test runner:** decide whether to add Vitest for pure logic (§8).
- **Taxonomy/format endpoints** may not be deployed yet — mock catalogs cover dev; verify on
  real-API switch.
- **Published-joke public URL** (spec open Q9): numeric ID for v1; hide "View public" if absent.
