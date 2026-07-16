# Responsive conventions (JokesFor web app)

Phase 1 built the **responsive foundation**. Phase 2 is the per-page sweep that
makes each page adapt. This is the contract that sweep follows — keep it exact.

## The mechanism: `useBreakpoint()`

The authenticated app is styled with **inline styles**, so CSS media queries
can't drive most layout. Switch layouts in JS with the hook:

```tsx
import { useBreakpoint } from '@/hooks/useBreakpoint'

const { isMobile, isTablet, isDesktop, width } = useBreakpoint()

<div style={{
  display: 'grid',
  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
  gap: isMobile ? 16 : 24,
}}>
```

**Breakpoints** (constants exported as `BREAKPOINTS`):

| Band      | Width        | Flag         |
| --------- | ------------ | ------------ |
| mobile    | `< 640px`    | `isMobile`   |
| tablet    | `640–1023px` | `isTablet`   |
| desktop   | `≥ 1024px`   | `isDesktop`  |

`useBreakpoint` is SSR-safe (defaults to desktop when there's no `window` /
`matchMedia`) and resize-aware (listeners cleaned up on unmount). `width` is the
live viewport width for the rare case a flag isn't enough.

## Rules for the per-page sweep

1. **Multi-column layouts collapse to one column on mobile.** Any grid/flex row
   with 2+ columns becomes a single column when `isMobile`. For pure-CSS grids,
   the `.resp-grid` utility (auto-fit on desktop, 1 col on mobile) is available.
2. **Use the shell's fluid container — don't fight it.** `FlowAppShell`'s
   `<main>` is already centered, capped at **1200px**, box-sizing: border-box,
   with a small responsive gutter and mobile bottom-bar clearance. Only add a
   page-level `maxWidth` if it's **narrower** than 1200 (e.g. a 720px reading
   column). Don't re-center or re-cap at ≥1200.
   - **First sweep step per page:** the per-page wrapper
     `<div style={{ padding: '40px clamp(24px, 4vw, 56px)', … }}>` currently
     supplies its own horizontal padding, which duplicates the container gutter.
     Drop the horizontal `clamp(...)` (keep vertical padding, e.g.
     `padding: '40px 0'`); let the container own horizontal spacing.
3. **Touch targets ≥ 44px on mobile.** Buttons, icon buttons, links, and rows
   must be at least 44×44px when `isMobile`.
4. **No horizontal scroll, ever.** The root already clips overflow-x and
   `img, svg, video` are capped at `max-width: 100%`. Don't set fixed pixel
   widths wider than the viewport; use `minmax(0, …)` grid tracks and
   `maxWidth: '100%'` on wide children (tables, code, images).
5. **Respect `prefers-reduced-motion`.** Handled globally in `index.css` — don't
   add JS animations that ignore it.
6. **Fluid type / spacing.** Prefer `clamp()` for large headings and section
   padding (see `LandingPage.tsx` and `ExplorePage.tsx` for the house style).

## Navigation (already done in the shell — reference only)

- **Mobile (`< 640`):** fixed **bottom tab bar** (`<nav aria-label="Primary">`) —
  Today · Explore · Search · Library · Profile (Profile → "Sign in" when
  anonymous). The desktop top nav is hidden; the header keeps the logo + a
  compact action cluster. `<main>` gets bottom padding so content clears the bar.
- **Tablet (`640–1023`):** top nav with tighter gaps/padding; streak chip hidden
  so right-side actions never overflow.
- **Desktop (`≥ 1024`):** full top nav + streak chip.

## Test every page at 375 / 768 / 1280px

375 (mobile), 768 (tablet), 1280 (desktop). Verify: no horizontal scroll,
nothing hidden behind the bottom bar, columns collapse, targets ≥ 44px.

## Known follow-up

`DailyReadsNudge` is `position: fixed; bottom: 20` and will sit on top of the
mobile tab bar — lift it above the bar (`bottom: calc(80px + safe-area)`) when
`isMobile` during the sweep.
