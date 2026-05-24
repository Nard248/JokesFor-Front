# Content Creation — Phase 4: Editors & Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox steps.

**Goal:** Build all editor UI components — the tag pickers, preview pane, status/card/tile presentational pieces, the six per-format editors, the editor shell layout, and the three confirm modals — so Phase 5 can assemble them into pages.

**Architecture:** Presentational components consuming Phase 1 primitives (`Textarea`, `Modal`, `RadioGroup`, `Chip`, `Button`, `JokeRenderer`) and Phase 2/3 logic (`EditorDraft`/`EditorAction`, `validate`, taxonomy hooks). Editors are dumb: they receive `{draft, dispatch, errors}` and render fields. All live under `src/features/create/components/` and `src/features/create/editors/`.

**Tech Stack:** React 19, TS, Tailwind v4 + inline styles (match existing house style), Vitest + RTL.

**Branch:** `feat/content-creation-build`. **Companion:** product spec §6, §7 (per-format), §9 (component inventory), §14 (visual); design §6.

---

## Component contracts

```ts
// All editors share this prop shape:
interface EditorProps { draft: EditorDraft; dispatch: (a: EditorAction) => void; errors?: Record<string,string> }
```

| Component | File | Props | Behavior |
|---|---|---|---|
| `StatusBadge` | components/StatusBadge.tsx | `{ status: SubmissionStatus }` | colored pill (draft=neutral, pending=amber, published=lime/green, rejected=red); `aria-label` spells status. |
| `PreviewPane` | components/PreviewPane.tsx | `{ payload: JokePayload }` | tinted container + `<JokeRenderer payload revealed interactive={false} big />`; header "How readers will see it". |
| `TagPicker` | components/TagPicker.tsx | `{ label: string; options: Taxon[]; selected: string[]; onChange: (slugs: string[]) => void }` | typeahead filter input + selected chips (Chip primitive, removable); clicking an option toggles its slug. |
| `AgeRatingRadio` | components/AgeRatingRadio.tsx | `{ options: AgeRating[]; value: string \| null; onChange: (slug: string) => void }` | wraps `RadioGroup` primitive (maps AgeRating→RadioOption with description = min_age hint). |
| `DialogueLine` | components/DialogueLine.tsx | `{ index; value; onChange; onRemove; onMoveUp; onMoveDown; canRemove; canMoveUp; canMoveDown }` | speaker label A/B by `index%2`; auto-resize `Textarea`; up/down/remove icon buttons (keyboard-operable, aria-labels); ≤200-char counter. |
| `OneLinerEditor` | editors/OneLinerEditor.tsx | EditorProps | single auto-resize Textarea bound to `draft.text` → `dispatch(setField text)`; placeholder; inline error from `errors.text`. |
| `ObservationalEditor` | editors/ObservationalEditor.tsx | EditorProps | like OneLiner, observational placeholder. |
| `StoryEditor` | editors/StoryEditor.tsx | EditorProps | taller Textarea + live word counter (amber <30 / green ≥30) reading `draft.text`. |
| `SetupPunchlineEditor` | editors/SetupPunchlineEditor.tsx | EditorProps | two Textareas (setup, punchline); when `draft.format==='anti'` show the italic footer hint "* That's it. That's the joke. (added automatically)". |
| `KnockEditor` | editors/KnockEditor.tsx | EditorProps | renders `draft.lines` as `DialogueLine`s; "+ Add line" (disabled at 8); remove disabled at 4; live "N of 4–8 lines" (amber if <4); reorder via up/down dispatching `setLines`. |
| `EditorRegistry` | editors/index.ts | — | `EDITOR_BY_FORMAT: Record<FormatSlug, React.LazyExoticComponent<...>>` mapping slug → lazy editor (setup & anti both → SetupPunchlineEditor). |
| `EditorShell` | components/EditorShell.tsx | `{ formatLabel; onChangeFormat; footer; preview; children }` | two-pane layout (editor left, preview right ≥768px); mobile Edit/Preview toggle; header row with format label + "Change format" button. |
| `SubmitConfirmModal` | components/SubmitConfirmModal.tsx | `{ open; onClose; onConfirm }` | Modal "Send to moderators?" + Cancel/Submit. |
| `ChangeFormatModal` | components/ChangeFormatModal.tsx | `{ open; current; onClose; onConfirm: (slug)=>void }` | Modal w/ RadioGroup of 6 formats + warning copy; confirm calls onConfirm(slug). |
| `DeleteDraftModal` | components/DeleteDraftModal.tsx | `{ open; onClose; onConfirm }` | Modal "Delete this draft?" destructive confirm. |
| `DraftCard` | components/DraftCard.tsx | `{ draft: ContentDraft; onClick }` | hub list card: format icon + StatusBadge + excerpt + edited-time + theme/category. |
| `FormatTile` | components/FormatTile.tsx | `{ format: FormatRule; example: string; onClick }` | picker tile: icon + name + description + example; Enter/Space activates. |
| `PublishedStats` | components/PublishedStats.tsx | `{ stats: PublishedStats }` | "N saved · N reactions · N reports" row; render nothing if stats falsy. |

Format→lucide icon map (a shared `formatIcon.ts`): oneliner=Quote, setup=MessageCircleQuestion, knock=DoorOpen, story=BookOpen, anti=Asterisk, observ=Eye (per spec §14.1).

---

## Tasks (each: failing test → implement → pass → tsc clean → commit)

- [ ] **T1 — Leaf presentational:** `StatusBadge`, `PublishedStats`, `formatIcon.ts`, `FormatTile`, `DraftCard`. Tests: StatusBadge renders status text + aria-label per status; FormatTile fires onClick on click AND Enter; DraftCard shows excerpt+status; PublishedStats hides when falsy. Commit `feat: add create leaf components (status/tile/card/stats)`.
- [ ] **T2 — Tag + age + preview:** `TagPicker`, `AgeRatingRadio`, `PreviewPane`. Tests: TagPicker filters options by typed text, toggles selection via onChange, removes via chip ×; AgeRatingRadio maps options and fires onChange; PreviewPane renders the JokeRenderer output for a given payload (e.g. oneliner text visible). Commit `feat: add TagPicker, AgeRatingRadio, PreviewPane`.
- [ ] **T3 — Simple editors:** `OneLinerEditor`, `ObservationalEditor`, `StoryEditor`. Tests: typing dispatches `setField('text', ...)`; StoryEditor word counter shows count + amber/green threshold at 30; inline error renders from `errors.text`. Commit `feat: add one-liner/observational/story editors`.
- [ ] **T4 — Setup/punchline + anti:** `SetupPunchlineEditor`. Tests: two fields dispatch setField setup/punchline; anti format shows the footer hint, setup format does not; errors render. Commit `feat: add setup-punchline editor (serves anti)`.
- [ ] **T5 — Knock dialogue builder:** `DialogueLine` + `KnockEditor`. Tests: renders lines with alternating A/B labels; Add line appends (disabled at 8); remove disabled at 4; up/down reorder dispatches `setLines` with swapped order; counter shows "N of 4–8" and is amber below 4; ≤200 char enforcement hint. Commit `feat: add knock dialogue builder`.
- [ ] **T6 — Editor registry + shell:** `editors/index.ts` (lazy `EDITOR_BY_FORMAT`, setup+anti→SetupPunchlineEditor), `EditorShell`. Tests: registry has all 6 slugs; EditorShell renders header/children/preview and the mobile Edit/Preview toggle swaps panes. Commit `feat: add editor registry + EditorShell layout`.
- [ ] **T7 — Modals:** `SubmitConfirmModal`, `ChangeFormatModal`, `DeleteDraftModal`. Tests: each renders when open; confirm button fires onConfirm (ChangeFormat passes selected slug); Cancel fires onClose. Commit `feat: add submit/change-format/delete modals`.
- [ ] **T8 — Barrel:** export all Phase 4 components from `src/features/create/index.ts`. Commit `feat: export create components from barrel`.

---

## Phase 4 done-when
- [ ] `npm test` green; `npx tsc -b` clean; `npm run build` succeeds.
- [ ] All components exported; editors lazy-loadable by slug; no page/route wiring yet (Phase 5).
- [ ] Components use Phase 1 primitives + JokeRenderer; no duplicated styling primitives.

## Self-review notes
- Editors are presentational (no data fetching) — they take `draft`/`dispatch`/`errors`. The page (Phase 5) owns `useAutosave`, `useFormats`, taxonomy hooks, `validate`, and wires them in.
- `KnockEditor` reorder uses up/down (no dnd-kit) per the design decision; ensure keyboard operability + aria-labels (WCAG).
- Reuse `Chip` for TagPicker, `RadioGroup` for AgeRatingRadio/ChangeFormat, `Modal` for the 3 modals, `Textarea` for all text inputs, `JokeRenderer` for PreviewPane.
