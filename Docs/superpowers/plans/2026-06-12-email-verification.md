# Email Verification (Registration) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add registration email-verification: a 6-digit code-entry screen + the mutations/types/mode-detection so that when the backend flips `EMAIL_VERIFICATION_REQUIRED`, gated signups route to verification — while legacy signups keep working unchanged.

**Architecture:** Dual-mode detected from the registration response (no FE flag). New `useVerifyEmail`/`useResendVerification` mutations + a `VerifyEmailPage` at `/verify-email?email=…` using a reusable accessible `OtpInput`. Verify success establishes the session via `token/refresh` (verify returns `{user}` + cookies but no body access token), mirroring `AuthProvider`. Mock-/SDK-free; cheap no-op analytics.

**Tech Stack:** React 19, React Router 7, TS, TanStack Query, Zustand, axios (credentialed), Vitest + RTL.

**Branch:** `feat/email-verification`. **Spec:** `docs/superpowers/specs/2026-06-12-email-verification-design.md`. **Backend contract:** §7 of the backend integration guide.

---

## File structure
- Modify `src/lib/api.ts` — types (`EmailVerificationPending`, `VerifyEmailRequest`, `VerifyEmailResponse`), `register` return union, replace `verifyEmail`/`resendVerification` endpoints.
- Modify `src/features/auth/api.ts` — `useRegister` branch, new `useVerifyEmail`, repoint `useResendVerification`.
- Modify `src/features/auth/index.ts` — export `useVerifyEmail`.
- Create `src/features/auth/parseAuthError.ts` (+ test) — dual-shape error parser.
- Create `src/components/ui/otp-input.tsx` (+ test) — 6-box accessible OTP.
- Create `src/pages/VerifyEmailPage.tsx` (+ test).
- Modify `src/pages/index.ts`, `src/app/routes.tsx`, `src/pages/RegisterPage.tsx` — export, route, mode-branch.

---

## Task 1: API types + endpoints (`src/lib/api.ts`)

**Files:** Modify `src/lib/api.ts`.

- [ ] **Step 1: Add types** after `AuthResponse` (after line 27):

```ts
/** Gated-mode registration response (EMAIL_VERIFICATION_REQUIRED on): no session yet. */
export interface EmailVerificationPending {
  detail: string
  email: string
}

export interface VerifyEmailRequest {
  email: string
  code: string
}

export interface VerifyEmailResponse {
  user: User
}
```

- [ ] **Step 2: Change `register` return type** (line 65-66) to the union:

```ts
  register: (credentials: RegisterCredentials) =>
    api.post<AuthResponse | EmailVerificationPending>('/auth/registration/', credentials),
```

- [ ] **Step 3: Replace the stale `verifyEmail`/`resendVerification`** (lines 95-99) with the new contract:

```ts
  verifyEmail: (payload: VerifyEmailRequest) =>
    api.post<VerifyEmailResponse>('/auth/verify-email/', payload),

  resendVerification: (email: string) =>
    api.post<{ detail: string }>('/auth/resend-verification/', { email }),
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b`
Expected: errors in `features/auth/api.ts` (the old `verifyEmail(key)` / register `.user` access) — fixed in Task 2. If errors appear ONLY there, proceed; otherwise fix the unexpected ones.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat(auth): add email-verification types + endpoints; register response union"
```

---

## Task 2: Auth mutations (`src/features/auth/api.ts` + `index.ts`)

**Files:** Modify `src/features/auth/api.ts`, `src/features/auth/index.ts`. Test: `src/features/auth/api.verify.test.tsx`.

- [ ] **Step 1: Write the failing test** — create `src/features/auth/api.verify.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import { vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({
  authApi: {
    verifyEmail: vi.fn(),
    refreshToken: vi.fn(),
    getUser: vi.fn(),
    register: vi.fn(),
  },
}))

import { authApi } from '@/lib/api'
import { useVerifyEmail } from './api'
import { useAuthStore } from './store'

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

test('verify success establishes auth via refresh token + setAuth', async () => {
  const user = { pk: 12, username: 'a', email: 'a@b.com', first_name: '', last_name: '' }
  ;(authApi.verifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { user } })
  ;(authApi.refreshToken as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { access: 'tok123' } })

  const { result } = renderHook(() => useVerifyEmail(), { wrapper })
  result.current.mutate({ email: 'a@b.com', code: '135790' })

  await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
  expect(useAuthStore.getState().accessToken).toBe('tok123')
  expect(useAuthStore.getState().user?.email).toBe('a@b.com')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- api.verify`
Expected: FAIL — `useVerifyEmail` is not exported.

- [ ] **Step 3: Update `useRegister` onSuccess branch** in `src/features/auth/api.ts` (replace the existing `onSuccess` body in `useRegister`, lines ~64-72):

```ts
    onSuccess: (data) => {
      // Gated mode (EMAIL_VERIFICATION_REQUIRED on): no tokens — do NOT log in.
      // RegisterPage reads `data.email` and routes to /verify-email.
      if ('access' in data) {
        setAuth(data.user, data.access)
        queryClient.invalidateQueries({ queryKey: authKeys.user() })
      }
    },
```

- [ ] **Step 4: Add `useVerifyEmail`** in `src/features/auth/api.ts` (after `useRegister`). Add the type import `VerifyEmailRequest` to the existing `import type { … } from '@/lib/api'`:

```ts
// Verify email (6-digit code) → establishes a session.
export function useVerifyEmail() {
  const queryClient = useQueryClient()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: VerifyEmailRequest) => {
      const response = await authApi.verifyEmail(payload)
      return response.data // { user }
    },
    onSuccess: async (data) => {
      // verify-email sets HttpOnly cookies but returns NO access token in the
      // body. Pull a fresh access token into memory via the refresh cookie
      // (mirrors AuthProvider bootstrap), then establish auth state. setAuth()
      // syncs the token to the axios instance internally.
      const refresh = await authApi.refreshToken()
      const access = refresh.data.access
      const user = data.user ?? (await authApi.getUser()).data
      setAuth(user, access)
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
  })
}
```

- [ ] **Step 5: Repoint `useResendVerification`** — its `mutationFn` already calls `authApi.resendVerification(email)`; Task 1 changed the endpoint, so no code change is needed here. Verify it still reads:

```ts
export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await authApi.resendVerification(email)
      return response.data
    },
  })
}
```

- [ ] **Step 6: Export `useVerifyEmail`** — add it to the export block in `src/features/auth/index.ts` (alongside `useResendVerification`).

- [ ] **Step 7: Run to verify pass + typecheck**

Run: `npm test -- api.verify` → PASS. Then `npx tsc -b` → clean.

- [ ] **Step 8: Commit**

```bash
git add src/features/auth/api.ts src/features/auth/index.ts src/features/auth/api.verify.test.tsx
git commit -m "feat(auth): useVerifyEmail (refresh-then-setAuth) + register gated-mode branch"
```

---

## Task 3: `parseAuthError` util

**Files:** Create `src/features/auth/parseAuthError.ts`, `src/features/auth/parseAuthError.test.ts`.

- [ ] **Step 1: Write the failing test**:

```ts
import { parseAuthError } from './parseAuthError'

test('reads field-error shape { code: [...] }', () => {
  const e = { response: { status: 400, data: { code: ['Incorrect code.'] } } }
  expect(parseAuthError(e)).toEqual({ message: 'Incorrect code.', status: 400 })
})

test('reads flow-error shape { detail }', () => {
  const e = { response: { status: 400, data: { detail: 'This email is already verified. Please log in.' } } }
  expect(parseAuthError(e).message).toMatch(/already verified/)
})

test('surfaces 429 status', () => {
  const e = { response: { status: 429, data: { detail: 'Too many attempts. Request a new code.' } } }
  expect(parseAuthError(e).status).toBe(429)
})

test('falls back when no response (network error)', () => {
  expect(parseAuthError(new Error('Network Error')).message).toMatch(/something went wrong/i)
})
```

- [ ] **Step 2: Run → FAIL** (`npm test -- parseAuthError`).

- [ ] **Step 3: Implement** `src/features/auth/parseAuthError.ts`:

```ts
import type { AxiosError } from 'axios'

interface AuthErrorBody {
  detail?: string
  code?: string[]
  non_field_errors?: string[]
  email?: string[]
}

/** Reads both server error shapes — `{ code: [...] }` field errors and
 *  `{ detail: "..." }` flow errors — and returns a friendly message + status.
 *  Never distinguishes wrong-code vs unknown-email (anti-enumeration). */
export function parseAuthError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): { message: string; status?: number } {
  const ax = err as AxiosError<AuthErrorBody>
  const status = ax.response?.status
  const data = ax.response?.data
  const message =
    data?.detail ||
    data?.code?.[0] ||
    data?.non_field_errors?.[0] ||
    data?.email?.[0] ||
    fallback
  return { message, status }
}
```

- [ ] **Step 4: Run → PASS**; `npx tsc -b` clean.
- [ ] **Step 5: Commit** `feat(auth): add parseAuthError (dual error-shape parser)`.

---

## Task 4: `OtpInput` primitive

**Files:** Create `src/components/ui/otp-input.tsx`, `src/components/ui/otp-input.test.tsx`.

- [ ] **Step 1: Write the failing test**:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { OtpInput } from './otp-input'

function Harness({ onComplete }: { onComplete?: (v: string) => void }) {
  const [v, setV] = useState('')
  return <OtpInput value={v} onChange={setV} onComplete={onComplete} />
}

test('typing digits advances and fills the code', async () => {
  const user = userEvent.setup()
  const onComplete = vi.fn()
  render(<Harness onComplete={onComplete} />)
  const boxes = screen.getAllByRole('textbox')
  expect(boxes).toHaveLength(6)
  await user.click(boxes[0])
  await user.keyboard('135790')
  expect(onComplete).toHaveBeenCalledWith('135790')
})

test('non-digits are rejected', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  const boxes = screen.getAllByRole('textbox') as HTMLInputElement[]
  await user.click(boxes[0])
  await user.keyboard('a')
  expect(boxes[0].value).toBe('')
})

test('pasting the whole code distributes across boxes', async () => {
  const user = userEvent.setup()
  const onComplete = vi.fn()
  render(<Harness onComplete={onComplete} />)
  const boxes = screen.getAllByRole('textbox') as HTMLInputElement[]
  await user.click(boxes[0])
  await user.paste('135790')
  expect(boxes[5].value).toBe('0')
  expect(onComplete).toHaveBeenCalledWith('135790')
})
```

- [ ] **Step 2: Run → FAIL** (`npm test -- otp-input`).

- [ ] **Step 3: Implement** `src/components/ui/otp-input.tsx`:

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  invalid?: boolean
  describedById?: string
}

export function OtpInput({
  value, onChange, onComplete, length = 6, disabled, invalid, describedById,
}: OtpInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([])

  React.useEffect(() => { refs.current[0]?.focus() }, [])

  const chars = Array.from({ length }, (_, k) => value[k] ?? '')

  const emit = (next: string) => {
    const joined = next.slice(0, length)
    onChange(joined)
    if (joined.length === length) onComplete?.(joined)
    return joined
  }

  const setAt = (i: number, d: string) => {
    const arr = Array.from({ length }, (_, k) => value[k] ?? '')
    arr[i] = d
    // Re-pack to a contiguous prefix (OTP is always typed/pasted left-to-right).
    return emit(arr.join('').replace(/\s/g, ''))
  }

  const handleChange = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1)
    if (!d) return
    setAt(i, d)
    if (i < length - 1) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (chars[i]) setAt(i, '')
      else if (i > 0) { refs.current[i - 1]?.focus(); setAt(i - 1, '') }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    emit(pasted)
    refs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div role="group" aria-label="Verification code" className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={chars[i]}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedById}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            'w-12 h-14 text-center text-2xl font-semibold rounded-2xl border bg-white outline-none transition-colors',
            'border-[#E9E8E7] focus:border-[#6A1CF6] focus:ring-2 focus:ring-[#6A1CF6]/20',
            invalid && 'border-destructive',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run → PASS**; `npx tsc -b` clean.
- [ ] **Step 5: Commit** `feat(ui): add accessible OtpInput (6-box, paste, auto-advance)`.

---

## Task 5: `VerifyEmailPage`

**Files:** Create `src/pages/VerifyEmailPage.tsx`, `src/pages/VerifyEmailPage.test.tsx`.

- [ ] **Step 1: Write the failing test**:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import { vi } from 'vitest'

const mockVerify = vi.fn()
const mockResend = vi.fn()
vi.mock('@/features/auth', async (orig) => ({
  ...(await orig<typeof import('@/features/auth')>()),
  useVerifyEmail: () => ({ mutateAsync: mockVerify, isPending: false }),
  useResendVerification: () => ({ mutate: mockResend, isPending: false }),
}))

import { VerifyEmailPage } from './VerifyEmailPage'

function renderAt(path: string) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/register" element={<div>register-page</div>} />
          <Route path="/flow" element={<div>onboarding-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => vi.clearAllMocks())

test('shows the email being verified', () => {
  renderAt('/verify-email?email=a%40b.com')
  expect(screen.getByText(/a@b\.com/)).toBeInTheDocument()
})

test('redirects to register when email param is missing', () => {
  renderAt('/verify-email')
  expect(screen.getByText('register-page')).toBeInTheDocument()
})

test('entering the correct code verifies and redirects', async () => {
  const user = userEvent.setup()
  mockVerify.mockResolvedValue({ user: { email: 'a@b.com' } })
  renderAt('/verify-email?email=a%40b.com')
  await user.click(screen.getAllByRole('textbox')[0])
  await user.keyboard('135790')
  await waitFor(() => expect(mockVerify).toHaveBeenCalledWith({ email: 'a@b.com', code: '135790' }))
  await waitFor(() => expect(screen.getByText('onboarding-page')).toBeInTheDocument())
})

test('wrong code shows an inline error and does not redirect', async () => {
  const user = userEvent.setup()
  mockVerify.mockRejectedValue({ response: { status: 400, data: { code: ['Incorrect code.'] } } })
  renderAt('/verify-email?email=a%40b.com')
  await user.click(screen.getAllByRole('textbox')[0])
  await user.keyboard('000000')
  expect(await screen.findByText('Incorrect code.')).toBeInTheDocument()
  expect(screen.queryByText('onboarding-page')).not.toBeInTheDocument()
})

test('resend triggers the mutation and disables the button (cooldown)', async () => {
  const user = userEvent.setup()
  renderAt('/verify-email?email=a%40b.com')
  const resendBtn = screen.getByRole('button', { name: /resend/i })
  await user.click(resendBtn)
  expect(mockResend).toHaveBeenCalledWith('a@b.com')
  expect(resendBtn).toBeDisabled()
})
```

- [ ] **Step 2: Run → FAIL** (`npm test -- VerifyEmailPage`).

- [ ] **Step 3: Implement** `src/pages/VerifyEmailPage.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useVerifyEmail, useResendVerification } from '@/features/auth'
import { parseAuthError } from '@/features/auth/parseAuthError'
import { OtpInput } from '@/components/ui/otp-input'
import { Button } from '@/components/ui/button'

const COOLDOWN_SECONDS = 45

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const email = params.get('email')
  const sendFailed = params.get('sendFailed') === '1'

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false) // 429 on verify → must resend
  const [cooldown, setCooldown] = useState(sendFailed ? 0 : COOLDOWN_SECONDS)
  const submitting = useRef(false)

  const verify = useVerifyEmail()
  const resend = useResendVerification()

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  if (!email) return <Navigate to="/register" replace />

  const submit = async (value: string) => {
    if (submitting.current || locked) return
    if (!/^\d{6}$/.test(value)) { setError('Enter the 6-digit code.'); return }
    submitting.current = true
    setError(null)
    try {
      await verify.mutateAsync({ email, code: value })
      navigate('/flow', { replace: true }) // new user → onboarding
    } catch (err) {
      const { message, status } = parseAuthError(err, 'Sign-in failed. Please try again.')
      if (status === 429) { setLocked(true); setError('Too many attempts. Request a new code below.') }
      else if (/already verified/i.test(message)) { navigate('/login', { replace: true }); return }
      else setError(message)
      setCode('')
    } finally {
      submitting.current = false
    }
  }

  const onResend = () => {
    if (cooldown > 0) return
    resend.mutate(email, {
      onSuccess: () => { setCooldown(COOLDOWN_SECONDS); setLocked(false); setError(null) },
      onError: (err) => {
        const { status } = parseAuthError(err)
        if (status === 429) { setCooldown(COOLDOWN_SECONDS); setError('A few codes already sent — give it a couple of minutes.') }
        else setCooldown(COOLDOWN_SECONDS)
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F6] px-4">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-lg border border-[#E9E8E7] p-8">
        <button onClick={() => navigate('/register')} className="text-sm text-muted-foreground hover:text-foreground mb-4">← Back</button>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {sendFailed ? "We couldn't send your code — tap Resend below. " : 'We sent a 6-digit code to '}
          <span className="font-medium text-foreground">{email}</span>
        </p>

        <div className="mt-6">
          <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={locked || verify.isPending} invalid={!!error} describedById="otp-error" />
        </div>

        <div id="otp-error" aria-live="polite" className="mt-3 min-h-5 text-center text-sm text-destructive">
          {error}
        </div>

        <Button variant="pill" size="xl" className="w-full mt-2" disabled={locked || verify.isPending || code.length !== 6} onClick={() => submit(code)}>
          {verify.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
        </Button>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Didn't get it?{' '}
          <button onClick={onResend} disabled={cooldown > 0} className="font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed">
            Resend code{cooldown > 0 ? ` (${cooldown}s)` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run → PASS** (`npm test -- VerifyEmailPage`); `npx tsc -b` clean.

Note: the "resend disables button" test starts with `cooldown = COOLDOWN_SECONDS` (button already disabled on mount) — adjust the test to assert the button is disabled and shows a countdown on mount, OR start the page without an initial cooldown. Decision for the implementer: initial cooldown should be ON (a code was just sent by registration), so the test should click is not possible while disabled. Update the resend test to: assert the resend button is disabled and shows `(45s)` on mount; then for the "triggers mutation" behavior, render with `?sendFailed=1` (initial cooldown 0) and assert the click calls `resend` and then disables. Keep both behaviors covered.

- [ ] **Step 5: Commit** `feat(auth): add VerifyEmailPage (code entry, resend cooldown, error states)`.

---

## Task 6: Wire-up — route, page export, RegisterPage mode-branch

**Files:** Modify `src/pages/index.ts`, `src/app/routes.tsx`, `src/pages/RegisterPage.tsx`. Test: `src/pages/RegisterPage.verify.test.tsx`.

- [ ] **Step 1: Export the page** — add to `src/pages/index.ts`:

```ts
export { VerifyEmailPage } from './VerifyEmailPage'
```

- [ ] **Step 2: Add the route** — in `src/app/routes.tsx`, add `VerifyEmailPage` to the `@/pages` import, and add near `/register`:

```tsx
  { path: '/verify-email', element: <GuestOnlyRoute><VerifyEmailPage /></GuestOnlyRoute> },
```

- [ ] **Step 3: Failing test** — create `src/pages/RegisterPage.verify.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import { vi } from 'vitest'

const mockRegister = vi.fn()
vi.mock('@/features/auth', async (orig) => ({
  ...(await orig<typeof import('@/features/auth')>()),
  useRegister: () => ({ mutate: mockRegister, isPending: false }),
  useUpdateUser: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { RegisterPage } from './RegisterPage'

function setup() {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<div>verify-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

test('gated-mode registration routes to /verify-email with the email', async () => {
  const user = userEvent.setup()
  // simulate the mutation calling its onSuccess with a gated response
  mockRegister.mockImplementation((_vars, opts) => opts.onSuccess({ detail: 'Verification code sent to your email.', email: 'a@b.com' }))
  setup()
  // fill+submit the form (selectors per RegisterPage's actual fields)
  // ...the implementer fills email/password and submits...
  // After submit:
  await waitFor(() => expect(screen.getByText('verify-page')).toBeInTheDocument())
})
```

(The implementer adapts the form-fill to `RegisterPage`'s real inputs — the assertion that matters is: a gated `onSuccess` payload navigates to the verify page.)

- [ ] **Step 4: Run → FAIL**.

- [ ] **Step 5: Branch RegisterPage's success handler** — in `src/pages/RegisterPage.tsx`, change the `registerMutation.mutate(..., { onSuccess: () => {...} })` to receive `data` and branch FIRST on gated mode (before any `updateUser`/onboarding nav, which require a session):

```tsx
        onSuccess: (data) => {
          if (!('access' in data)) {
            // Gated mode: no session yet — go verify the email.
            navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, { replace: true })
            return
          }
          // Legacy mode (logged in): existing optional profile patch + onboarding.
          // ...keep the current updateUser + navigate('/flow') logic here...
        },
```

- [ ] **Step 6: Run → PASS**; full `npm test`; `npx tsc -b`; `npm run build`.
- [ ] **Step 7: Commit** `feat(auth): route + RegisterPage gated-mode branch to /verify-email`.

---

## Task 7: Analytics no-op stubs (optional, cheap)

**Files:** Create `src/features/auth/analytics.ts`; call from `VerifyEmailPage`.

- [ ] **Step 1:** Implement (mirrors `features/create/analytics.ts`):

```ts
export type VerifyEvent =
  | 'verify_screen_viewed' | 'verify_succeeded'
  | 'verify_failed' | 'resend_clicked' | 'resend_throttled'
export function trackVerify(event: VerifyEvent, props?: Record<string, unknown>): void {
  if (import.meta.env.DEV) console.debug('[analytics]', event, props ?? {})
}
```

- [ ] **Step 2:** Call `trackVerify('verify_screen_viewed')` on mount; `verify_succeeded`/`verify_failed` in submit; `resend_clicked`/`resend_throttled` in resend. **Never** pass the code or full email (pass `{ reason }` only).
- [ ] **Step 3:** `npx tsc -b`; `npm test`. Commit `feat(auth): no-op analytics stubs for verify funnel`.

---

## Phase done-when
- [ ] `npm test` green; `npx tsc -b` clean; `npm run build` succeeds.
- [ ] Legacy registration unchanged (no `access` branch fires only in gated mode).
- [ ] `/verify-email?email=…` renders, correct code logs in (refresh→setAuth), wrong/expired/429 handled, resend cooldown works, missing email → `/register`.
- [ ] Google OAuth path untouched.

## Self-review notes
- Spec coverage: §4 mode detection → T2+T6; §7 endpoints → T1; verify/refresh token subtlety → T2; OtpInput §6/§13 → T4; screen §6.1 → T5; errors §9/§12 → T3+T5; routing §6.3 → T6; analytics §14 → T7.
- Type consistency: `VerifyEmailRequest`/`VerifyEmailResponse`/`EmailVerificationPending` defined in T1, used in T2/T5; `parseAuthError` shape used in T5.
- The one runtime subtlety (verify returns no body token) is handled once, in `useVerifyEmail` (T2).
