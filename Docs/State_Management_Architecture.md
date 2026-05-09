# Jokes For — State Management Architecture

> **Decision:** Zustand (client state) + TanStack React Query (server state)
>
> **Status:** Implemented across all 14 pages and 10 feature modules

---

## 1. Why This Stack

We evaluated Redux Toolkit, Jotai, MobX, and React Context. The decision came down to two facts about our app:

1. **~80% of state is server data** (jokes, collections, profiles, trending). TanStack Query handles caching, refetching, pagination, and optimistic updates out of the box — no reducers, no action creators.

2. **~20% of state is client-only** (auth token, sidebar toggle, onboarding step). Zustand handles this with a single `create()` call per store — no providers, no boilerplate.

Adding Redux would mean writing reducers/thunks for the same operations TanStack Query does automatically. Adding Jotai would fragment our auth store into scattered atoms. Neither adds value over what we have.

---

## 2. The Data Flow

```
┌──────────┐     ┌──────────────────┐     ┌───────────────┐     ┌──────────────┐
│   Page   │────▸│  Feature Hook    │────▸│   Adapter      │────▸│ Mock or Real │
│Component │     │ (TanStack Query) │     │ (api-adapter)  │     │    API       │
└──────────┘     └──────────────────┘     └───────────────┘     └──────────────┘
                         │                         │
                    queryKey + staleTime      USE_MOCKS flag
                    cache + invalidation     in .env controls
```

**Example:** When `FavoritesPage` renders:
1. It calls `useFavorites({ tones: 'dad_joke', page: 1 })` from `features/favorites`
2. The hook calls `favoritesAdapter.list(params)` from `lib/api-adapter.ts`
3. The adapter checks `VITE_USE_MOCKS` — if true, calls `mockFavoritesApi.list()`; if false, calls the real API
4. TanStack Query caches the result with key `['favorites', 'list', { tones: 'dad_joke', page: 1 }]`
5. On next render within 5 minutes (staleTime), the cached data is returned instantly

---

## 3. Feature Modules

Each feature lives in `src/features/<name>/` with:

| File | Purpose |
|------|---------|
| `api.ts` | Query keys, useQuery/useMutation hooks |
| `index.ts` | Barrel export |
| `store.ts` | *(Only if client state needed)* Zustand store |
| `hooks.ts` | *(Only if convenience wrappers needed)* |
| `types.ts` | *(Only if type re-exports needed)* |

### Current Features

| Feature | Queries | Mutations | Optimistic Updates |
|---------|---------|-----------|-------------------|
| `auth` | — | login, register, logout | — |
| `jokes` | search, random, detail | rate | — |
| `daily-joke` | today, history | — | — |
| `collections` | list, collection-jokes | create, delete | — |
| `saved-jokes` | list | save, unsave | **Yes** — unsave removes from list cache immediately |
| `favorites` | list, stats | add, remove | **Yes** — remove decrements stats counter immediately |
| `trending` | jokes, tags, rising, jokesters, themes | — | — |
| `drafts` | list | create, update, submit, delete | — |
| `profile` | me, activity, achievements | update | **Yes** — update sets cache directly |
| `preferences` | get | update | **Yes** — update sets cache directly |

---

## 4. Invalidation Chains

When a mutation succeeds, it triggers cache invalidation across related features:

```
Save Joke ──▸ saved-jokes.all
           ──▸ collections.all (joke_count changes)
           ──▸ favorites.all
           ──▸ profile.all (stats.jokesSaved changes)

Remove Favorite ──▸ favorites.all (list + stats)
                ──▸ profile.all (stats change)

Submit Draft ──▸ drafts.all
             ──▸ profile.all (activity feed)

Update Preferences ──▸ preferences (cache set directly)
                   ──▸ daily-joke.today (personalization affected)
```

---

## 5. Zustand Stores

### Auth Store (`features/auth/store.ts`)
- **Persisted to:** `sessionStorage` (survives page refresh, dies on tab close)
- **Fields:** `user`, `accessToken`, `isAuthenticated`, `isLoading`
- **Rehydration:** On app load, restores token and syncs it to the Axios interceptor
- **Partialize:** Only persists `user`, `accessToken`, `isAuthenticated` — not `isLoading` or actions

### UI Store (`stores/ui.store.ts`)
- **Persisted:** No (ephemeral)
- **Fields:** `isMobileMenuOpen`, `isSidebarCollapsed`, `isSearchFocused`

### Onboarding Store (`stores/onboarding.store.ts`)
- **Persisted to:** `localStorage` (survives across sessions)
- **Fields:** `currentStep`, `totalSteps`, `selectedHumorTypes`, `isComplete`

---

## 6. Query Configuration (`lib/query-client.ts`)

Global defaults:
- `staleTime`: 0 (each hook overrides with appropriate value)
- `gcTime` (garbage collection): 5 minutes (default)
- `retry`: 3 (default)
- `refetchOnWindowFocus`: true (default — refreshes stale data when user returns to tab)

---

## 7. The Adapter Pattern (`lib/api-adapter.ts`)

```typescript
const USE_MOCKS = !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCKS === 'true'

export const featureAdapter = {
  list: (): Promise<PaginatedResponse<T>> =>
    USE_MOCKS
      ? mockFeatureApi.list()                    // Returns mock data
      : realFeatureApi.list().then((r) => r.data) // Unwraps Axios response
}
```

**To connect a feature to the real backend:**
1. Define API functions in `lib/api.ts` (Axios calls)
2. Add the real-API branch to the adapter in `lib/api-adapter.ts`
3. Set `VITE_USE_MOCKS=false` in `.env`
4. The hooks and pages need zero changes

Currently, `jokes`, `daily-joke`, `collections`, `saved-jokes`, and `auth` have both mock and real API branches in the adapter. The newer features (`trending`, `favorites`, `drafts`, `profile`, `preferences`) only have mock branches — real API calls should be added when the backend implements those endpoints (see `API_Specification_For_Frontend.md`).

---

## 8. Conventions

### Do
- Always go through a feature hook. `useFavorites()` not `favoritesAdapter.list()` directly.
- Use query key factories. `favoriteKeys.list(params)` not `['favorites', 'list', params]`.
- Invalidate broadly after mutations. Use `featureKeys.all` to catch all sub-queries.
- Use `setQueryData` for single-object updates (profile, preferences).
- Use optimistic `onMutate` → `onError` rollback for list removals.

### Don't
- Never import from `lib/mock-data.ts` in page components (except static display constants).
- Never call adapter functions outside of TanStack Query hooks.
- Never store server data in Zustand — that's TanStack Query's job.
- Never use `localStorage` for auth tokens — use `sessionStorage` only.
