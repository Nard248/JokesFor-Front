# Main User Flow Redesign — Plan & Rationale

> **Status**: Iteration 2, in feature branch `feat/redesign-user-flow`. Not merged.
> **Iteration 1** was built blind (without the Claude design files I couldn't fetch). **Iteration 2** is built against the actual designs the user saved at `Docs/JokesFor/` — including `Flow.html`, `Flow Canvas.html`, `parts/flow-screens.jsx`, and the broader Design Book. The design system is `Direction A` (per `index.html` the design book's recommended direction) — its tokens are now reflected in `src/index.css` additively.

---

## 1. What we're trying to solve

**Current state**: After a user logs in, they land on `/` (HomePage). HomePage exists, but the journey from login → first meaningful action lacks intentional shape. Every page is a separate destination; there's no "this is your space" moment, and no guided onboarding for new users to set their tone/age/language preferences before being thrown at the joke catalog.

**Desired state**: A coherent flow where:
- **New users** complete a brief onboarding ("Flow") that sets their preferences so the rest of the app can be personalized from minute one.
- **Returning users** land on a personalized hub ("Flow Canvas") that surfaces what's relevant to them today: daily joke, trending in their tones, recent saves, drafts, quick paths to search/submit.
- The existing destinations (Search, Library, Trending, Daily, Drafts, Favorites, Profile, Settings, Submit) remain reachable but feel like *extensions* of the hub rather than parallel competitors to it.

**Out of scope for iteration 1**:
- Reskinning existing pages (Login/Register, Layout shell, etc.). Wait for visual designs.
- Changing the post-auth redirect target. New routes are reachable directly; we'll flip the default after review.
- Replacing or removing existing routes (Onboarding, HomePage, etc.). Per explicit ask.

---

## 2. Mapping: design intent → existing code

| Design concept | Existing code that maps | Status |
|---|---|---|
| **Flow Canvas** (post-login hub) | No equivalent today. HomePage is the closest, but its role is unclear. | **New page** at `/flow-canvas` |
| **Flow** (onboarding journey) | `/onboarding` exists with `OnboardingPage`. Likely overlaps in intent but not visually. | **New page** at `/flow`. Old route stays — different journey, may consolidate later. |
| Search experience | `SearchPage` (`/search`) | Reuse. The Flow Canvas hero embeds a glassmorphic search bar that deep-links into `/search?q=...`. |
| Daily joke | `DailyJokePage` (`/daily`), `DailyJokeCard`, `JokeOfTheDayCard` | Reuse. Flow Canvas surfaces today's joke as a hero card linking to `/daily`. |
| Trending | `TrendingPage` (`/trending`) | Reuse. Flow Canvas pulls from trending data filtered to user's preferred tones. |
| Saved jokes | `LibraryPage`, `FavoritesPage`, `SavedJokeRow` | Reuse. Flow Canvas surfaces "Recent saves" linking to `/library`. |
| Drafts | `DraftsPage`, `draftsAdapter` (mock-only today) | Reuse. Flow Canvas surfaces "In progress" linking to `/drafts`. |
| Submit | `SubmitJokePage` (`/submit`) | Reuse. Flow Canvas has a "Share your own" CTA. |
| Profile / Settings | `ProfilePage`, `SettingsPage` | Reuse, accessible from existing nav. Not in hub. |

---

## 3. The user-flow graph (revised)

```
                   ┌──────────────┐
       new user →  │ /register    │ ──┐
                   └──────────────┘   │
                                      ▼
                   ┌──────────────┐ first sign-in
       returning → │ /login       │ ──┐  no prefs?
                   │ Google OAuth │   │       │
                   └──────────────┘   │       ▼
                                      │   ┌─────────────┐
                                      │   │  /flow      │  4-step onboarding
                                      │   │ welcome →   │  (skippable)
                                      │   │ tones →     │
                                      │   │ age rating →│
                                      │   │ languages   │
                                      │   └─────────────┘
                                      │       │
                                      ▼       ▼
                              ┌──────────────────────┐
                              │  /flow-canvas        │ ← post-login hub
                              │                      │
                              │  • Today's joke      │
                              │  • For your mood     │
                              │  • Recent saves      │
                              │  • Drafts            │
                              │  • Discover          │
                              └──────────────────────┘
                                       │
        existing destinations  ─────── ┴ ──── ────────►
        (/search /library /trending /daily /drafts
         /favorites /profile /settings /submit)
```

**Iteration 1 caveat**: the post-auth redirect to `/flow-canvas` is **not yet wired**. After login/register, users still land on `/` (HomePage). New routes are reachable directly. The auth-redirect flip is a planned follow-up (1-line change in `LoginPage.tsx` + `RegisterPage.tsx` `onSuccess`).

---

## 4. Visual language

Anchored entirely to existing tokens in `src/index.css` so the new pages feel native:

| Surface | Treatment |
|---------|-----------|
| Page background | Soft gradient: `--color-purple-tint` (#F7F0FF) → `--color-page-bg` (#F8F6F6), top to bottom |
| Hero bands | `bg-gradient-purple` (135° #6A1CF6 → #AC8EFF) with white type |
| Headlines | `font-display` (Epilogue), `clamp(2.5rem, 5vw, 4.5rem)` for hero, lighter for sections |
| Body | `font-sans` (Plus Jakarta Sans) |
| Hero card / sectional cards | `rounded-[48px]` (`--radius-card`), white bg, `shadow-card` |
| Glassmorphic chrome | `.glass` utility (rgba(255,255,255,0.80) + 24px backdrop-blur) for the embedded search bar |
| Primary CTA | `Button variant="pill-lime"` (#CAFD00 lime, #3A4A00 text — high-contrast accent) |
| Secondary CTA | `Button variant="pill"` (#6A1CF6 solid purple) |
| Tertiary | `Button variant="pill-ghost"` (purple text on purple-tint hover) |
| Chip selectors (Flow steps) | Pill-shaped, `--color-purple-tint` bg when selected, `--color-border-light` outline when not |

This is one direction within the brand book. When real design files arrive, swap visual specifics; structural code stays.

---

## 5. Implementation map (this iteration)

```
src/
├─ pages/
│  ├─ FlowPage.tsx           NEW   /flow         — onboarding journey
│  ├─ FlowCanvasPage.tsx     NEW   /flow-canvas  — post-login hub
│  └─ index.ts               edit  — export the two
├─ app/
│  └─ routes.tsx             edit  — add /flow + /flow-canvas behind ProtectedRoute
└─ Docs/
   ├─ Redesign_Plan.md       NEW   — this doc
   └─ Designs/               NEW   — empty, where future design files will live
```

Both new pages compose the existing `Button` variants and import from existing `@/features/*` hooks where data is available. Where backend wiring isn't done yet (e.g., trending, drafts in real-API mode), the pages call the adapter (`@/lib/api-adapter`) which returns mocks today and will return real data when those endpoints are wired without changing the page code.

---

## 6. Decision log

| Decision | Why |
|---|---|
| Feature branch instead of direct-to-main | Tonight's auth integration is demo-critical and live; redesign is post-demo. Branch keeps the demo path clean. |
| Don't change auth redirect in iteration 1 | Lets you reach `/flow` and `/flow-canvas` directly for review without committing the rest of the app to a new default. One-line follow-up flip after approval. |
| Keep `/onboarding` route | Explicit "do not remove" instruction. `/flow` is a parallel implementation; pick a winner later. |
| Keep `HomePage` at `/` | Same reason. Eventually `/flow-canvas` could become `/`. Not yet. |
| Adapter pattern over direct API calls | Two of the hub's data sources (trending, drafts) don't have real API wiring yet. Adapter routes through mocks now, swaps to real later, no page-code change. |
| `pill-lime` for primary "go" CTAs in this flow | The lime accent is the most distinctive token in the palette; using it for the actionable moment in onboarding gives the journey a visual identity separate from the rest of the app's purple-default. |
| Glassmorphic search bar in hub hero | The brand book calls out glassmorphism but the existing app barely uses `.glass`. The search bar is a natural place: it lets the hero gradient show through, signals "this is a moment of utility." |

---

## 7. What changes when real design files arrive

Most likely:
- **Visual specifics will change**: card composition, spacing, illustration usage, exact gradient/shadow values, micro-interactions.
- **Section composition might change**: the hub may have different sections than I picked (e.g., different ordering, an "explore by mood" treatment I didn't anticipate, an illustration system I don't know about).
- **The Flow steps might differ**: I picked tones / age / language because those are the existing preference dimensions in the API. Real design might add fewer or more steps, different copy, different selection patterns.

Most likely won't change:
- **Routes**: `/flow` and `/flow-canvas` are sensible names; happy to rename.
- **Data wiring**: the hub will need today's joke, trending, saves, drafts, regardless of visual.
- **Auth integration**: ProtectedRoute wrapping is correct; redirect flip after-approval pattern is correct.

---

## 8. How to review

1. Pull this branch: `git checkout feat/redesign-user-flow && npm run dev`
2. Sign in (any of the auth methods — see `Docs/Hosting_Setup.md`)
3. Manually navigate to `/flow-canvas` — review the hub layout
4. Manually navigate to `/flow` — step through the onboarding (skip or fill)
5. Compare against the actual `Flow Canvas.html` and `Flow.html` design files (if available)
6. Open issues / iterate

Or open a PR on GitHub — the PR workflow will deploy this branch to a preview channel automatically (URL posted as a PR comment).

---

## 9. Follow-ups (not in this branch)

### What's now COMPLETE on this branch (iteration 3)

All 8 designed screens are implemented:

- ✅ `/login` — LoginScreen split-canvas with embedded JOTD preview + streak nudge
- ✅ `/register` — RegisterScreen 2-step + Hooked-loop preview pane
- ✅ `/auth/google/callback` — OAuth code-exchange landing
- ✅ `/flow` — 3-step onboarding (Vibes / Formats / Ritual)
- ✅ `/flow-canvas` — Today hub, FULL: hero JOTD with reveal, streak rail, mystery box, tomorrow teaser, "you stopped mid-sip", 3-up "Three you'll probably save", 7-day archive newspaper strip, mixed-format showcase, top jokesters + weekly special, stats + themes + test-on-a-friend, brand pull-quote countdown footer
- ✅ `/explore` — 3-axis chip filter + masonry
- ✅ `/search` — Sentence Builder + masonry

Post-auth redirects wired:
- ✅ Login success → `/flow-canvas`
- ✅ Register success → `/flow` → (on finish) `/flow-canvas`

API surface:
- ✅ Endpoint methods defined in `src/lib/api.ts` for: `favoritesApi`, `draftsApi`, `profileApi`, `preferencesApi`, `trendingApi` (with TODO-marked types)
- ⏳ Adapter routing stays mock-only until per-feature response shapes are confirmed in production

### What's still NOT in this branch

- **Decide between `/flow` and `/onboarding`** — both routes work in parallel; pick a winner. `/onboarding` (legacy `OnboardingPage`) probably should retire once `/flow` is approved.
- **Real-API wiring for `preferencesAdapter`/`favoritesAdapter`/`draftsAdapter`/`profileAdapter`/`trendingAdapter`** — the methods exist in `api.ts`, but each adapter still routes to mocks. Per-feature flip = one-line change once the corresponding response shape is verified.
- **Reskin existing pages still on legacy Layout**: HomePage, DailyJokePage, FavoritesPage, DraftsPage, ProfilePage, SettingsPage, SubmitJokePage, TrendingPage, LibraryPage. Each gets its own focused redesign PR; not opportunistically updated to `FlowAppShell` because their internal content is styled for the old design language and would visually clash.
- **Consolidate `JokeCard` + `FlowJokeCard`** — once the redesign is approved across all consumers, retire the old `JokeCard`. Today they're parallel and that's the right state.
- **Consolidate `Layout` + `FlowAppShell`** — same as above.
- **Mobile / tablet adaptive breakpoints** — Flow pages target the design's 1440px desktop baseline. Mobile-down responsiveness is partially handled via `clamp()` but not designed for. Each page needs explicit mobile treatment.

## 10. Iteration history

### Iteration 1 (blind — designs unfetchable)
v1 used brand book + guess. Built `/flow` (generic 4-step preferences) and `/flow-canvas` (generic mood-lane hub).

### Iteration 2 (designs received)
v2 rewrote to match `Docs/JokesFor/`:
- Added `Fraunces` italic (`.wink`) and `JetBrains Mono` (`.eyebrow-mono`) tokens
- New `FlowJokeCard` with 6 format rhythms + reveal-on-tap interaction
- `/flow` rewritten as Vibes / Formats / Ritual (12 rich vibe chips, format demos, slot picker)
- `/flow-canvas` rewritten as Today scoped (hero + right rail + 3-up + footer)
- New `/explore` (three-axis filter masonry)

### Iteration 3 (current — feature-complete)
- Login / Register / Search rewrites per design
- Post-auth redirects wired (Login → `/flow-canvas`, Register → `/flow`)
- 4 deferred Today sections built (7-day archive, mixed-format showcase, top jokesters + weekly special, stats + themes + test-on-a-friend)
- Real-API endpoint methods defined for favorites/drafts/profile/preferences/trending in `api.ts` (adapter routing still mock-only)
- Extracted `FlowAppShell` shared chrome
- All 8 designed screens implemented end-to-end

### Iteration 4 (current — on `dev` branch)

The work formerly described as "post-merge" is now happening on `dev`. The branch was created by fast-forwarding from `feat/redesign-user-flow` (which is a strict superset of `main`); `main` is untouched. The `dev` branch is our integration trunk going forward — feature branches PR into `dev`, and `dev` → `main` is the release event.

**Done:**
- ✅ `dev` branch established and tracking origin
- ✅ Reskinned `LibraryPage` to use `FlowAppShell` + new visual language (collection tiles, recent saves masonry, search)
- ✅ Reskinned `DailyJokePage` to use `FlowAppShell` + reveal-on-tap hero + history grid
- ✅ Hoisted `/library` and `/daily` out of the legacy `Layout`-wrapped subtree (they have their own chrome now)
- ✅ Retired `/onboarding` route — now redirects to `/flow` (legacy `OnboardingPage` component stays in code, no longer routed)
- ✅ Wired `preferencesAdapter` to optionally route through real `/users/me/preferences/` via `VITE_USE_REAL_PREFERENCES` flag (default off; converter handles camelCase ↔ snake_case mismatch)

**Still in flight:**
- Reskin remaining legacy pages: `FavoritesPage`, `DraftsPage`, `ProfilePage`, `SettingsPage`, `TrendingPage`, `SubmitJokePage`, `HomePage` — each needs its own focused PR
- Adapter flips for the other features once shapes are confirmed: `favoritesAdapter`, `draftsAdapter`, `profileAdapter`, `trendingAdapter`
- Consolidate `JokeCard` (still used by `HomePage`/`FavoritesPage`/`SubmitJokePage`) with `FlowJokeCard`
- Consolidate `Layout` (still used by `HomePage`/`TrendingPage` and protected pages still inside that subtree) with `FlowAppShell`
- Mobile/tablet breakpoints — Flow pages are designed for 1440px desktop; smaller screens partially handled via `clamp()`
