# Content Creation — Phase 2: Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the `src/features/create/` data layer — types, mock + real API, adapter (mock-first with `VITE_USE_REAL_CREATE` toggle), TanStack Query hooks, and data-driven validation — so the editor/pages phases have a complete, typed data contract to build against.

**Architecture:** New `src/features/create/` module, independent of the legacy `features/drafts/` (whose `DraftJoke` shape is incompatible). Reuses `JokePayload`/`FlowJokeFormat` from `@/components/JokeRenderer` as the canonical render contract. Mock-first via the existing adapter pattern (mirrors `preferencesAdapter`'s `toDTO/fromDTO` + env toggle). All hooks follow the established `features/*/api.ts` conventions (key factory + `useQuery`/`useMutation`).

**Tech Stack:** React 19, TS, TanStack Query v5, Vitest + RTL, axios (`@/lib/axios`).

**Branch:** `feat/content-creation-build`.

**Companion:** design doc `docs/superpowers/specs/2026-05-23-content-creation-frontend-design.md` (§4, §8); product spec `Docs/API/Frontend_Content_Creation_Spec.md` (§8 API contract, §11 validation).

---

## Canonical contract (used across all tasks)

```ts
// FormatSlug === FlowJokeFormat from @/components/JokeRenderer
import type { FlowJokeFormat, JokePayload } from '@/components/JokeRenderer'
export type FormatSlug = FlowJokeFormat  // 'setup'|'oneliner'|'observ'|'anti'|'knock'|'story'

export type SubmissionStatus = 'draft' | 'pending' | 'published' | 'rejected'

export interface Taxon { id: number; slug: string; name: string; description?: string }
export interface AgeRating extends Taxon { min_age?: number }
export interface Language { id: number; code: string; name: string }

export interface FormatRule {
  id: number
  slug: FormatSlug
  name: string
  description: string
  required_fields: string[]
  forbidden_fields: string[]
  constraints: { min_lines?: number; max_lines?: number; max_line_chars?: number; min_text_words?: number }
}

export interface PublishedStats { saves: number; reactions: number; reports: number }

/** View-model the editor + pages use. JokePayload = {format,text,setup,punchline,lines}. */
export interface ContentDraft extends JokePayload {
  id: number
  status: SubmissionStatus
  themes: string[]      // slugs (API: context_tags / themes)
  categories: string[]  // slugs (API: tones / categories)
  cultures: string[]    // slugs (API: culture_tags)
  ageRating: string | null
  language: string
  source: string
  lastEditedAt: string
  rejectionReason: string
  likes: number | null
  stats?: PublishedStats | null
}
```

---

## Task 1: Module types (`src/features/create/types.ts`)

**Files:** Create `src/features/create/types.ts`; Test `src/features/create/types.test.ts`.

- [ ] **Step 1: Test** — assert the module exports the types and a `FORMAT_SLUGS` tuple of the 6 slugs.

```ts
import { FORMAT_SLUGS } from './types'
test('exposes the 6 format slugs', () => {
  expect([...FORMAT_SLUGS].sort()).toEqual(['anti','knock','observ','oneliner','setup','story'])
})
```

- [ ] **Step 2:** Run `npm test -- create/types` → FAIL.
- [ ] **Step 3:** Implement `types.ts` with the full "Canonical contract" block above, plus:

```ts
export const FORMAT_SLUGS = ['oneliner','setup','knock','story','anti','observ'] as const

/** DTO shapes from the backend (snake_case). */
export interface ContentDraftDTO {
  id: number
  text: string
  setup: string
  punchline: string
  lines: string[] | null
  format: FormatSlug
  status: SubmissionStatus
  tones: string[]
  categories?: string[]
  context_tags: string[]
  themes?: string[]
  culture_tags: string[]
  age_rating: string | null
  language?: string
  source?: string
  last_edited_at: string
  created_at: string
  likes: number | null
  rejection_reason: string
  stats?: PublishedStats | null
}
export interface CreateDraftBody { format: FormatSlug; age_rating?: string | null; language?: string }
export interface PatchDraftBody {
  format?: FormatSlug; text?: string; setup?: string; punchline?: string; lines?: string[] | null
  tones?: string[]; context_tags?: string[]; culture_tags?: string[]
  age_rating?: string | null; language?: string; source?: string
}
```

- [ ] **Step 4:** `npm test -- create/types` → PASS; `npx tsc -b` clean.
- [ ] **Step 5:** Commit `feat: add content-creation module types`.

---

## Task 2: Mock catalogs + mock content API (`src/features/create/mock.ts`)

**Files:** Create `src/features/create/mock.ts`; Test `src/features/create/mock.test.ts`.

Implements an in-memory drafts store + format/taxonomy catalogs returning the exact `ContentDraftDTO`/catalog shapes. Functions: `mockFormats()`, `mockAgeRatings()`, `mockTones()`, `mockContextTags()`, `mockCultureTags()`, `mockLanguages()`, and `mockContentApi = { listDrafts, getDraft, createDraft, patchDraft, submitDraft, deleteDraft }`.

Key behaviors (mirror product spec §8): `createDraft({format})` → new row, `status:'draft'`, empty content, returns full DTO; `patchDraft(id, body)` merges + bumps `last_edited_at`; `submitDraft(id)` → `status:'pending'`; `listDrafts()` → `PaginatedResponse<ContentDraftDTO>` from the store; seed 2–3 sample drafts across statuses (incl. one `published` with `stats` and one `rejected` with `rejection_reason`). Format catalog must include the `constraints` per spec §8.1 (knock min/max lines 4/8, story min_text_words 30). Use a `delay()` helper like `mock-api.ts`.

- [ ] **Step 1:** Tests: createDraft returns draft status + given format; patchDraft merges fields; submitDraft flips to pending; listDrafts returns seeded rows; mockFormats returns 6 with knock/story constraints.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test -- create/mock` PASS; `npx tsc -b` clean.
- [ ] **Step 5:** Commit `feat: add content-creation mock api + catalogs`.

---

## Task 3: Real API endpoints + DTO mapping (`src/features/create/api.ts`)

**Files:** Create `src/features/create/api.ts`; Test `src/features/create/api.test.ts` (pure mapping tests only — no network).

Defines axios-based endpoints AND the `fromDTO`/`toDTO` mappers.

```ts
import { api } from '@/lib/axios'
import type { PaginatedResponse } from '@/lib/api'
import type { ContentDraft, ContentDraftDTO, CreateDraftBody, PatchDraftBody, FormatRule, Taxon, AgeRating, Language } from './types'

export const contentApi = {
  formats: () => api.get<{ results: FormatRule[] }>('/formats/'),
  ageRatings: () => api.get<AgeRating[]>('/age-ratings/'),
  tones: () => api.get<Taxon[]>('/tones/'),
  contextTags: () => api.get<Taxon[]>('/context-tags/'),
  cultureTags: () => api.get<Taxon[]>('/culture-tags/'),
  languages: () => api.get<Language[]>('/languages/'),
  listDrafts: () => api.get<PaginatedResponse<ContentDraftDTO>>('/jokes/my-drafts/?page_size=100'),
  getDraft: (id: number) => api.get<ContentDraftDTO>(`/jokes/my-drafts/${id}/`),
  createDraft: (body: CreateDraftBody) => api.post<ContentDraftDTO>('/jokes/my-drafts/', body),
  patchDraft: (id: number, body: PatchDraftBody) => api.patch<ContentDraftDTO>(`/jokes/my-drafts/${id}/`, body),
  submitDraft: (id: number) => api.post<{ id: number; status: string }>(`/jokes/my-drafts/${id}/submit/`),
  deleteDraft: (id: number) => api.delete(`/jokes/my-drafts/${id}/`),
}

export function fromDTO(d: ContentDraftDTO): ContentDraft {
  return {
    id: d.id, format: d.format, text: d.text ?? '', setup: d.setup ?? '', punchline: d.punchline ?? '',
    lines: d.lines ?? null, status: d.status,
    themes: d.themes ?? d.context_tags ?? [],
    categories: d.categories ?? d.tones ?? [],
    cultures: d.culture_tags ?? [],
    ageRating: d.age_rating ?? null, language: d.language ?? 'en', source: d.source ?? 'original',
    lastEditedAt: d.last_edited_at, rejectionReason: d.rejection_reason ?? '',
    likes: d.likes ?? null, stats: d.stats ?? null,
  }
}
/** Maps an editor view-model patch to the API body (prefers new key names). */
export function toPatchBody(p: Partial<ContentDraft>): PatchDraftBody { /* map themes->context_tags, categories->tones, cultures->culture_tags, ageRating->age_rating, etc. */ }
```

- [ ] **Step 1:** Tests for `fromDTO` (prefers themes/categories over context_tags/tones; null lines; defaults language/source) and `toPatchBody` (maps camel→snake, omits undefined).
- [ ] **Step 2:** FAIL → **Step 3:** implement (complete `toPatchBody`) → **Step 4:** PASS + tsc clean.
- [ ] **Step 5:** Commit `feat: add content-creation api endpoints + DTO mappers`.

---

## Task 4: Adapter (`src/features/create/adapter.ts`)

**Files:** Create `src/features/create/adapter.ts`; Test `src/features/create/adapter.test.ts`.

Mirror `preferencesAdapter`: `const USE_REAL = import.meta.env.VITE_USE_REAL_CREATE === 'true'`. Export `contentAdapter` with: `formats`, `ageRatings`, `tones`, `contextTags`, `cultureTags`, `languages` (returning view types), and `listDrafts → ContentDraft[]`, `getDraft`, `createDraft(format)`, `patchDraft(id, Partial<ContentDraft>)`, `submitDraft(id)`, `deleteDraft(id)`. When `USE_REAL`, call `contentApi.*` and map via `fromDTO`/`toPatchBody`; else call `mockContentApi.*` (which already returns view-friendly shapes via a small mock mapper, or map mock DTOs through `fromDTO` for consistency — prefer routing mock DTOs through `fromDTO` so both paths share mapping).

- [ ] Tests: with mocks (default), `createDraft('knock')` resolves a ContentDraft with status 'draft' + format 'knock'; `listDrafts()` returns an array of ContentDraft. (Mock `import.meta.env` not required since default path is mock.)
- [ ] FAIL → implement → PASS + tsc clean.
- [ ] Commit `feat: add content-creation adapter (mock-first, VITE_USE_REAL_CREATE)`.

---

## Task 5: Query hooks (`src/features/create/queries.ts`)

**Files:** Create `src/features/create/queries.ts`; Test `src/features/create/queries.test.tsx` (render hooks with a QueryClientProvider wrapper).

Key factory + hooks per design §10.1:

```ts
export const createKeys = {
  formats: ['formats'] as const,
  taxonomy: { ages:['taxonomy','ages'], tones:['taxonomy','tones'], themes:['taxonomy','themes'], cultures:['taxonomy','cultures'], languages:['taxonomy','languages'] } as const,
  drafts: { list: ['create','drafts'] as const, detail: (id:number)=>['create','drafts',id] as const },
}
export function useFormats() // staleTime 1h
export function useAgeRatings(); useTones(); useContextTags(); useCultureTags(); useLanguages() // staleTime 1h each
export function useDrafts() // staleTime 30s
export function useDraft(id: number) // enabled: id>0, refetchOnMount:'always'
```

- [ ] Test (with `QueryClientProvider` + `renderHook` from RTL): `useFormats()` eventually returns 6 formats via the mock adapter; `useDrafts()` returns an array.
- [ ] FAIL → implement → PASS + tsc clean.
- [ ] Commit `feat: add content-creation query hooks`.

---

## Task 6: Mutation hooks (`src/features/create/mutations.ts`)

**Files:** Create `src/features/create/mutations.ts`; Test `src/features/create/mutations.test.tsx`.

```ts
export function useCreateDraft()  // createAdapter.createDraft(format); onSuccess: setQueryData(detail), invalidate drafts.list
export function usePatchDraft(id) // optimistic: cancel+snapshot+setQueryData(detail) merge, rollback onError, settle invalidate detail
export function useSubmitDraft()  // submitDraft(id); invalidate drafts.list + ['profile']
export function useDeleteDraft()  // deleteDraft(id); invalidate drafts.list
```

- [ ] Test: `useCreateDraft().mutateAsync('oneliner')` resolves a ContentDraft (mock) and writes the detail cache; `usePatchDraft` optimistically updates the detail cache.
- [ ] FAIL → implement → PASS + tsc clean.
- [ ] Commit `feat: add content-creation mutation hooks`.

---

## Task 7: Validation (`src/features/create/validation.ts`) + barrel

**Files:** Create `src/features/create/validation.ts`; Test `src/features/create/validation.test.ts`; Create `src/features/create/index.ts` (barrel re-exporting hooks, keys, types, validate).

Data-driven validator per product spec §11.1:

```ts
import type { JokePayload } from '@/components/JokeRenderer'
import type { FormatRule } from './types'
export function isBlank(v: unknown): boolean
export function validate(payload: JokePayload, rule: FormatRule): Record<string, string>
// required_fields blank → error; forbidden_fields non-blank → error;
// constraints: min_lines/max_lines/max_line_chars (knock), min_text_words (story, count text.trim().split(/\s+/))
```

- [ ] Tests: oneliner needs text; knock needs 4–8 lines each ≤200 chars; story needs ≥30 words; setup/anti need setup+punchline; forbidden field set produces error; valid payloads → `{}`.
- [ ] FAIL → implement → PASS + tsc clean.
- [ ] Commit `feat: add content-creation validation + module barrel`.

---

## Phase 2 done-when
- [ ] `npm test` green (all new create/* unit tests + existing).
- [ ] `npx tsc -b` clean; `npm run build` succeeds.
- [ ] `src/features/create/` exports working `useFormats/useTaxonomy*/useDrafts/useDraft`, `useCreateDraft/usePatchDraft/useSubmitDraft/useDeleteDraft`, `validate`, `createKeys`, and all types — all functioning against mocks by default.
- [ ] No change to legacy `features/drafts/` or other modules.

## Self-review notes
- Spec coverage: design §4 (types/mapping/keys/mutations/autosave-data) → T1,T3,T5,T6; §8 API contract → T2,T3; §11 validation → T7; mock-first toggle → T4.
- Reuses `JokePayload`/`FlowJokeFormat` from JokeRenderer (no duplicate format union).
- Autosave engine itself is Phase 3 (consumes `usePatchDraft` + `validate` from here).
