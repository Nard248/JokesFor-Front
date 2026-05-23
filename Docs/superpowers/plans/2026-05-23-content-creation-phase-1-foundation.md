# Content Creation — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared rendering + UI-primitive foundation that every later Content Creation phase depends on — a pure `<JokeRenderer>` extracted from `FlowJokeCard`, plus five new design-system primitives (Textarea, Modal, RadioGroup, Skeleton, Toast), and a Vitest+RTL unit-test harness.

**Architecture:** Extract `FlowJokeCard`'s format-specific `Body` into a standalone, reveal-parameterized `<JokeRenderer payload .../>` so the card and the future editor preview render identically. Add the missing primitives in the existing CVA + `@theme`-token style (NOT shadcn). Introduce Vitest + React Testing Library for pure-logic/component unit tests (the repo currently has Playwright e2e only).

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4 (`@theme`), class-variance-authority, `@radix-ui/react-slot`, `cn()` (clsx + tailwind-merge), Vitest, @testing-library/react, jsdom.

**Companion docs:** product spec `Docs/API/Frontend_Content_Creation_Spec.md`; design doc `docs/superpowers/specs/2026-05-23-content-creation-frontend-design.md`.

**Branch:** `feat/content-creation` (already created).

---

## File structure (created/modified in this phase)

- Create: `vitest.config.ts` — Vitest config (jsdom env, globals).
- Create: `src/test/setup.ts` — RTL/jest-dom setup.
- Create: `src/components/JokeRenderer.tsx` — pure renderer + `JokePayload`, `SKIN`, `FORMAT_LABEL`, `formatLabelFor()`.
- Create: `src/components/JokeRenderer.test.tsx` — renderer unit tests.
- Modify: `src/components/FlowJokeCard.tsx` — consume `JokeRenderer`; re-export nothing new.
- Create: `src/components/ui/textarea.tsx` + `.test.tsx`
- Create: `src/components/ui/modal.tsx` + `.test.tsx`
- Create: `src/components/ui/radio-group.tsx` + `.test.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/toast.tsx` + `.test.tsx`
- Modify: `package.json` — add devDeps + `test` scripts.

---

## Task 1: Set up Vitest + React Testing Library

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install dev dependencies**

```bash
npm i -D vitest@^2 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14 jsdom@^25
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright specs live in e2e/ and must not be picked up by Vitest.
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
```

Note: confirm `@vitejs/plugin-react` is already a devDependency (it is, via the Vite React template). If not, add it: `npm i -D @vitejs/plugin-react`.

- [ ] **Step 3: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Add test scripts to `package.json`**

Add to the `"scripts"` object (keep existing `e2e*` scripts unchanged):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Add a smoke test to verify the harness**

Create `src/test/harness.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'

test('vitest + RTL harness works', () => {
  render(<div>hello</div>)
  expect(screen.getByText('hello')).toBeInTheDocument()
})
```

- [ ] **Step 6: Run it**

Run: `npm test`
Expected: PASS (1 test). If alias `@` fails to resolve, recheck `vitest.config.ts` resolve.alias.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/
git commit -m "test: add vitest + react-testing-library harness"
```

---

## Task 2: Extract `<JokeRenderer>` from `FlowJokeCard`

The renderer must produce byte-identical output to today's `FlowJokeCard` body, but as a pure component that also supports an always-revealed, non-interactive mode for the editor preview.

**Files:**
- Create: `src/components/JokeRenderer.tsx`
- Test: `src/components/JokeRenderer.test.tsx`
- Modify: `src/components/FlowJokeCard.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/JokeRenderer.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { JokeRenderer, type JokePayload } from './JokeRenderer'

const base: JokePayload = { format: 'oneliner', text: '', setup: '', punchline: '', lines: null }

test('oneliner renders its text', () => {
  render(<JokeRenderer payload={{ ...base, format: 'oneliner', text: 'I put down a book on anti-gravity.' }} />)
  expect(screen.getByText(/anti-gravity/)).toBeInTheDocument()
})

test('setup is revealed (no blur gate) when revealed=true', () => {
  render(
    <JokeRenderer
      payload={{ ...base, format: 'setup', setup: 'Why did the scarecrow win?', punchline: 'Outstanding in his field.' }}
      revealed
    />,
  )
  expect(screen.getByText('Outstanding in his field.')).toBeInTheDocument()
  // No "tap to reveal" affordance when already revealed.
  expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
})

test('knock renders all lines when interactive=false', () => {
  render(
    <JokeRenderer
      payload={{ ...base, format: 'knock', lines: ['Knock, knock.', "Who's there?", 'Olive.', 'Olive who?'] }}
      revealed
      interactive={false}
    />,
  )
  expect(screen.getByText('Olive who?')).toBeInTheDocument()
})

test('anti renders the auto footer', () => {
  render(
    <JokeRenderer
      payload={{ ...base, format: 'anti', setup: 'Why did the chicken cross the road?', punchline: 'To get to the other side.' }}
      revealed
    />,
  )
  expect(screen.getByText(/That's it\. That's the joke\./i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- JokeRenderer`
Expected: FAIL — cannot resolve `./JokeRenderer`.

- [ ] **Step 3: Create `src/components/JokeRenderer.tsx`**

Move `SKIN`, `FORMAT_LABEL`, `tagToneFor`, and the `Body` rendering logic out of `FlowJokeCard.tsx` into this file, generalized to a `JokePayload` and an explicit `revealed`/`interactive` contract. (`interactive` only affects knock step-through and setup tap-to-reveal; the editor preview passes `revealed interactive={false}`.)

```tsx
import { useState } from 'react'
import { Sparkles } from 'lucide-react'

export type FlowJokeFormat = 'setup' | 'oneliner' | 'observ' | 'anti' | 'knock' | 'story'

/** The canonical render payload — identical shape the editor preview and the card both build. */
export interface JokePayload {
  format: FlowJokeFormat
  text: string
  setup: string
  punchline: string
  lines: string[] | null
}

export interface SkinSpec { bg: string; fg: string; border: string; divider: string }

export const SKIN: Record<FlowJokeFormat, SkinSpec> = {
  setup:    { bg: '#FFFFFF',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  oneliner: { bg: '#CAFD00',  fg: '#3A4A00', border: 'none',              divider: 'rgba(58,74,0,0.18)' },
  observ:   { bg: '#FBFAF7',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  anti:     { bg: '#1A1A1A',  fg: '#FFFFFF', border: 'none',              divider: 'rgba(255,255,255,0.14)' },
  knock:    { bg: '#FFFFFF',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  story:    { bg: '#FFC965',  fg: '#5F4200', border: 'none',              divider: 'rgba(95,66,0,0.2)' },
}

export const FORMAT_LABEL: Record<FlowJokeFormat, string> = {
  setup: 'Setup → Punchline', oneliner: 'One-liner', observ: 'Observational',
  anti: 'Anti-joke', knock: 'Knock-knock', story: 'Story',
}

export function formatLabelFor(fmt: FlowJokeFormat): string { return FORMAT_LABEL[fmt] }

export function tagToneFor(fmt: FlowJokeFormat): string {
  switch (fmt) {
    case 'oneliner':
    case 'anti': return 'dark'
    case 'observ':
    case 'knock':
    case 'story': return 'amber'
    case 'setup':
    default: return ''
  }
}

interface JokeRendererProps {
  payload: JokePayload
  big?: boolean
  /** Force the punchline/all-knock-lines visible. Editor preview passes true. */
  revealed?: boolean
  /** When false, disables tap-to-reveal and knock step-through (preview mode). */
  interactive?: boolean
  /** Story reading-time label (e.g. "2 min"). Optional. */
  read?: string
  storyReadLabel?: string
  className?: string
}

/**
 * Pure, format-aware joke body renderer. Single source of rendering truth shared by
 * FlowJokeCard (reader) and the creator editor PreviewPane (always-revealed preview).
 */
export function JokeRenderer({
  payload, big = false, revealed: revealedProp, interactive = true, read, className,
}: JokeRendererProps) {
  const { format: fmt } = payload
  const skin = SKIN[fmt] ?? SKIN.setup
  const [localRevealed, setLocalRevealed] = useState(fmt !== 'setup')
  const [knockStep, setKnockStep] = useState(0)

  const revealed = revealedProp ?? localRevealed
  const lines = payload.lines ?? []
  const visibleKnock = interactive ? lines.slice(0, knockStep + 1) : lines

  if (fmt === 'setup') {
    const titleSize = big ? 24 : 16
    const punchSize = big ? 44 : 22
    const canReveal = interactive && !revealed
    return (
      <div className={className} onClick={() => canReveal && setLocalRevealed(true)} style={{ cursor: canReveal ? 'pointer' : 'default' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: titleSize, color: skin.fg, lineHeight: 1.3, marginTop: 14 }}>
          {payload.setup}
        </div>
        <div className={`punch-blur ${revealed ? 'is-revealed' : ''}`}
          style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: punchSize, letterSpacing: '-0.02em', color: skin.fg, lineHeight: 1.05 }}>
          {payload.punchline}
        </div>
        {canReveal && <div className="eyebrow-mono" style={{ marginTop: 14, color: '#6A1CF6' }}>Tap to reveal punchline →</div>}
      </div>
    )
  }

  if (fmt === 'oneliner') {
    const sz = big ? 38 : 22
    return (
      <div className={className} style={{ marginTop: 14, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: sz, letterSpacing: '-0.02em', color: skin.fg, lineHeight: 1.05, textWrap: 'balance' as const }}>
        {payload.text}
      </div>
    )
  }

  if (fmt === 'observ') {
    const sz = big ? 26 : 18
    return (
      <div className={className} style={{ marginTop: 14, position: 'relative' }}>
        <span aria-hidden style={{ position: 'absolute', top: -12, left: -6, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 60, lineHeight: 1, color: '#6A1CF6', opacity: 0.35 }}>“</span>
        <div style={{ paddingLeft: 24, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: sz, color: skin.fg, lineHeight: 1.3, textWrap: 'balance' as const }}>
          {payload.text}
        </div>
      </div>
    )
  }

  if (fmt === 'anti') {
    const sz = big ? 30 : 20
    return (
      <div className={className} style={{ marginTop: 14 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: big ? 17 : 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>{payload.setup}</div>
        <div style={{ marginTop: 10, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: sz, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.1 }}>{payload.punchline}</div>
        <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>* That's it. That's the joke.</div>
      </div>
    )
  }

  if (fmt === 'knock') {
    const canAdvance = interactive && knockStep < lines.length - 1
    return (
      <div className={className} onClick={() => canAdvance && setKnockStep((s) => Math.min(s + 1, lines.length - 1))}
        style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, cursor: canAdvance ? 'pointer' : 'default' }}>
        {visibleKnock.map((l, i) => (
          <div key={i} style={{ alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', maxWidth: '82%', padding: '7px 11px', borderRadius: 13, background: i % 2 === 0 ? '#F2E9FF' : '#1A1A1A', color: i % 2 === 0 ? '#6A1CF6' : '#fff', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: i === lines.length - 1 ? 800 : 600 }}>
            {l}
          </div>
        ))}
        {canAdvance && <div className="eyebrow-mono" style={{ marginTop: 6, color: '#6A1CF6' }}>Tap to advance · {knockStep + 1}/{lines.length}</div>}
      </div>
    )
  }

  if (fmt === 'story') {
    return (
      <div className={className} style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="tag-flow" style={{ background: '#5F4200', color: '#FFC965' }}>
            <Sparkles size={10} style={{ marginRight: 4 }} />{read ?? '30 sec read'}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: big ? 17 : 14, color: skin.fg, lineHeight: 1.55, textWrap: 'pretty' as const }}>
          {payload.text}
        </div>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- JokeRenderer`
Expected: PASS (4 tests).

- [ ] **Step 5: Refactor `FlowJokeCard.tsx` to consume `JokeRenderer`**

In `src/components/FlowJokeCard.tsx`:

1. Delete the local `FlowJokeFormat` type, `SkinSpec`, `SKIN`, `FORMAT_LABEL`, the entire `Body` function, and the local `tagToneFor`.
2. Add the import: `import { JokeRenderer, SKIN, FORMAT_LABEL, tagToneFor, type FlowJokeFormat } from './JokeRenderer'`.
3. Keep `FlowJokeData` and `jokeToFlowData` in `FlowJokeCard.tsx` (display extras like `themeLabel`/`laughs` belong to the card, not the renderer). Re-export the format type: `export type { FlowJokeFormat } from './JokeRenderer'`.
4. Replace the `<Body .../>` mount inside the `<article>` with:

```tsx
<JokeRenderer
  payload={{
    format: joke.fmt,
    text: joke.text ?? '',
    setup: joke.setup ?? '',
    punchline: joke.punch ?? '',
    lines: joke.lines ?? null,
  }}
  big={big}
  read={joke.read}
/>
```

(The card still owns the surrounding `<article>`, header, `ReactionRow`, and footer — only the body delegates to `JokeRenderer`.)

- [ ] **Step 6: Verify no consumer breaks (typecheck + build)**

Run: `npx tsc -b`
Expected: no errors. Then run: `npm test`
Expected: all PASS.

- [ ] **Step 7: Visually verify no regression via existing Playwright e2e**

Run: `npm run dev` in one shell, then `npm run e2e` in another (the example spec hits the running app).
Expected: existing e2e still passes; FlowJokeCard pages (Explore/Home/Search) render unchanged.

- [ ] **Step 8: Commit**

```bash
git add src/components/JokeRenderer.tsx src/components/JokeRenderer.test.tsx src/components/FlowJokeCard.tsx
git commit -m "refactor: extract pure JokeRenderer from FlowJokeCard"
```

---

## Task 3: `Textarea` primitive (auto-resize)

**Files:**
- Create: `src/components/ui/textarea.tsx`
- Test: `src/components/ui/textarea.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from './textarea'

test('renders value and forwards onChange', async () => {
  const user = userEvent.setup()
  let val = ''
  render(<Textarea aria-label="joke" value={val} onChange={(e) => (val = e.target.value)} />)
  const ta = screen.getByLabelText('joke')
  await user.type(ta, 'hi')
  expect(ta).toBeInTheDocument()
})

test('applies pill variant classes', () => {
  render(<Textarea aria-label="joke" variant="pill" />)
  expect(screen.getByLabelText('joke').className).toMatch(/rounded-\[18px\]|rounded/)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- textarea`
Expected: FAIL — cannot resolve `./textarea`.

- [ ] **Step 3: Implement `src/components/ui/textarea.tsx`**

```tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textareaVariants = cva(
  "placeholder:text-muted-foreground border-input w-full min-w-0 border bg-transparent text-base transition-[color,box-shadow] outline-none resize-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'rounded-md px-3 py-2 shadow-xs focus-visible:border-ring focus-visible:ring-ring/50',
        pill: 'rounded-[18px] px-5 py-4 bg-white border-[#E9E8E7] focus-visible:border-[#6A1CF6] focus-visible:ring-[#6A1CF6]/20',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface TextareaProps
  extends React.ComponentProps<'textarea'>, VariantProps<typeof textareaVariants> {
  /** Auto-grow to fit content. Default true. */
  autoResize?: boolean
}

export function Textarea({ className, variant, autoResize = true, onChange, ...props }: TextareaProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  const resize = React.useCallback(() => {
    const el = ref.current
    if (!el || !autoResize) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [autoResize])

  React.useEffect(() => { resize() }, [resize, props.value])

  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      rows={props.rows ?? 3}
      className={cn(textareaVariants({ variant, className }))}
      onChange={(e) => { resize(); onChange?.(e) }}
      {...props}
    />
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- textarea`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/textarea.tsx src/components/ui/textarea.test.tsx
git commit -m "feat: add Textarea ui primitive with auto-resize"
```

---

## Task 4: `Modal` primitive (focus-trap + Escape)

**Files:**
- Create: `src/components/ui/modal.tsx`
- Test: `src/components/ui/modal.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './modal'

test('renders children when open', () => {
  render(<Modal open onClose={() => {}} title="Change format?"><p>body</p></Modal>)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByText('Change format?')).toBeInTheDocument()
})

test('does not render when closed', () => {
  render(<Modal open={false} onClose={() => {}} title="x"><p>body</p></Modal>)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('Escape calls onClose', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<Modal open onClose={onClose} title="x"><p>body</p></Modal>)
  await user.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- modal`
Expected: FAIL — cannot resolve `./modal`.

- [ ] **Step 3: Implement `src/components/ui/modal.tsx`**

```tsx
import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Footer actions row (buttons). */
  footer?: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const lastFocused = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    lastFocused.current = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') trapFocus(e, panelRef.current)
    }
    document.addEventListener('keydown', onKey)
    // Focus first focusable element in the panel.
    panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      lastFocused.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,26,26,0.45)', padding: 16 }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('dropdown-enter', className)}
        style={{ background: '#fff', borderRadius: 24, maxWidth: 420, width: '100%', padding: 24, boxShadow: '0 30px 60px -15px rgba(46,47,47,0.25)' }}
      >
        {title && <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#1A1A1A', marginBottom: 12 }}>{title}</h2>}
        <div>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

function trapFocus(e: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- modal`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/modal.tsx src/components/ui/modal.test.tsx
git commit -m "feat: add Modal ui primitive with focus trap and Escape"
```

---

## Task 5: `RadioGroup` primitive

**Files:**
- Create: `src/components/ui/radio-group.tsx`
- Test: `src/components/ui/radio-group.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RadioGroup } from './radio-group'

const opts = [
  { value: 'kid-safe', label: 'Kid-safe' },
  { value: 'teen', label: 'Teen' },
]

test('renders options and reflects selection', () => {
  render(<RadioGroup name="age" value="teen" onChange={() => {}} options={opts} label="Age rating" />)
  expect(screen.getByRole('radio', { name: 'Teen' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Kid-safe' })).not.toBeChecked()
})

test('fires onChange with the selected value', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<RadioGroup name="age" value="teen" onChange={onChange} options={opts} label="Age rating" />)
  await user.click(screen.getByRole('radio', { name: 'Kid-safe' }))
  expect(onChange).toHaveBeenCalledWith('kid-safe')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- radio-group`
Expected: FAIL — cannot resolve `./radio-group`.

- [ ] **Step 3: Implement `src/components/ui/radio-group.tsx`**

```tsx
import { cn } from '@/lib/utils'

export interface RadioOption { value: string; label: string; description?: string }

export interface RadioGroupProps {
  name: string
  value: string | null
  onChange: (value: string) => void
  options: RadioOption[]
  label: string
  className?: string
}

export function RadioGroup({ name, value, onChange, options, label, className }: RadioGroupProps) {
  return (
    <fieldset className={cn('flex flex-col gap-2', className)} role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <label
            key={opt.value}
            className={cn(
              'flex items-start gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors',
              checked ? 'border-[#6A1CF6] bg-[#F7F0FF]' : 'border-[#E9E8E7] bg-white hover:border-[#AC8EFF]',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="mt-1 accent-[#6A1CF6]"
            />
            <span className="flex flex-col">
              <span className="font-medium text-[#2E2F2F]">{opt.label}</span>
              {opt.description && <span className="text-sm text-[#6B7280]">{opt.description}</span>}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- radio-group`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/radio-group.tsx src/components/ui/radio-group.test.tsx
git commit -m "feat: add RadioGroup ui primitive"
```

---

## Task 6: `Skeleton` primitive

**Files:**
- Create: `src/components/ui/skeleton.tsx`
- Test: `src/components/ui/skeleton.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react'
import { Skeleton } from './skeleton'

test('renders with merged className and a11y hint', () => {
  const { container } = render(<Skeleton className="h-24 rounded-xl" />)
  const el = container.firstChild as HTMLElement
  expect(el.className).toMatch(/animate-pulse/)
  expect(el.className).toMatch(/h-24/)
  expect(el).toHaveAttribute('aria-hidden', 'true')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- skeleton`
Expected: FAIL — cannot resolve `./skeleton`.

- [ ] **Step 3: Implement `src/components/ui/skeleton.tsx`**

```tsx
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div aria-hidden="true" data-slot="skeleton" className={cn('animate-pulse rounded-md bg-[#F2F0F0]', className)} {...props} />
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- skeleton`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/skeleton.tsx src/components/ui/skeleton.test.tsx
git commit -m "feat: add Skeleton ui primitive"
```

---

## Task 7: `Toast` system (provider + `useToast` + `Toaster`)

**Files:**
- Create: `src/components/ui/toast.tsx`
- Test: `src/components/ui/toast.test.tsx`
- Modify: `src/main.tsx` (wrap app with `<ToastProvider>`)

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './toast'

function Trigger() {
  const { toast } = useToast()
  return <button onClick={() => toast({ message: 'Sent for review.' })}>fire</button>
}

test('shows a toast when triggered', async () => {
  const user = userEvent.setup()
  render(<ToastProvider><Trigger /></ToastProvider>)
  await user.click(screen.getByText('fire'))
  expect(screen.getByText('Sent for review.')).toBeInTheDocument()
})

test('useToast throws outside provider', () => {
  function Bad() { useToast(); return null }
  expect(() => render(<Bad />)).toThrow(/ToastProvider/)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- toast`
Expected: FAIL — cannot resolve `./toast`.

- [ ] **Step 3: Implement `src/components/ui/toast.tsx`**

```tsx
import * as React from 'react'

type ToastVariant = 'default' | 'success' | 'error'
interface ToastInput { message: string; variant?: ToastVariant; durationMs?: number }
interface ToastItem extends Required<Omit<ToastInput, 'durationMs'>> { id: number; durationMs: number }

interface ToastContextValue { toast: (input: ToastInput) => void }
const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

const BG: Record<ToastVariant, string> = { default: '#1A1A1A', success: '#3A4A00', error: '#7f1d1d' }
const FG: Record<ToastVariant, string> = { default: '#fff', success: '#CAFD00', error: '#fff' }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])
  const idRef = React.useRef(0)

  const remove = React.useCallback((id: number) => setItems((xs) => xs.filter((t) => t.id !== id)), [])

  const toast = React.useCallback((input: ToastInput) => {
    const item: ToastItem = { id: ++idRef.current, message: input.message, variant: input.variant ?? 'default', durationMs: input.durationMs ?? 4000 }
    setItems((xs) => [...xs, item])
    window.setTimeout(() => remove(item.id), item.durationMs)
  }, [remove])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div role="region" aria-live="polite" aria-label="Notifications"
        style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((t) => (
          <div key={t.id} role="status" className="dropdown-enter"
            style={{ background: BG[t.variant], color: FG[t.variant], padding: '10px 16px', borderRadius: 9999, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, boxShadow: '0 10px 30px rgba(26,26,26,0.25)' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- toast`
Expected: PASS (2 tests).

- [ ] **Step 5: Wrap the app in `src/main.tsx`**

Import `ToastProvider` and wrap the existing root tree (inside any QueryClientProvider, outside the router is fine). Example diff — wrap the top-level `<App/>` / `<RouterProvider/>`:

```tsx
import { ToastProvider } from '@/components/ui/toast'
// ...
<ToastProvider>
  {/* existing providers + router */}
</ToastProvider>
```

(Open `src/main.tsx`, locate the outermost render tree, and nest the existing content inside `<ToastProvider>…</ToastProvider>`.)

- [ ] **Step 6: Verify build + tests**

Run: `npx tsc -b && npm test`
Expected: typecheck clean, all unit tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/toast.tsx src/components/ui/toast.test.tsx src/main.tsx
git commit -m "feat: add Toast system (provider + useToast) and mount in app root"
```

---

## Phase 1 done-when

- [ ] `npm test` passes (harness + JokeRenderer + 4 primitives + toast).
- [ ] `npx tsc -b` is clean.
- [ ] `npm run e2e` still passes (no regression on FlowJokeCard pages).
- [ ] `JokeRenderer` is the only place format bodies are rendered; `FlowJokeCard` delegates to it.
- [ ] Five new primitives exist in `src/components/ui/` in the CVA/token style; `<ToastProvider>` mounted at the app root.

---

## Self-review notes (author)

- **Spec coverage (Phase-1 scope):** §9.3 renderer extraction → Task 2; "build missing primitives" (reconciliation §2) → Tasks 3–7; test harness gap → Task 1. Phases 2–6 (data layer, autosave, editors, pages, extras) are deliberately out of this plan and get their own phase-plans.
- **Placeholders:** none — every code step contains full code; the only prose-only step (main.tsx wrap) names the exact file and the exact wrapper to add.
- **Type consistency:** `JokePayload`/`FlowJokeFormat` defined in Task 2 and reused verbatim; `Textarea`/`Modal`/`RadioGroup`/`Skeleton`/`useToast` signatures match their tests.
- **Open dependency to confirm at execution:** `@vitejs/plugin-react` present as a devDependency (Step 1/Task 1 note).
