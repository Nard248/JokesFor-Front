# Email Verification (Registration) — Frontend Integration Design

**Status:** Approved design — 2026-06-12. Ready for `writing-plans`.
**Branch:** `feat/email-verification` (off `main`).

## Source of truth
- Backend integration guide (provided by backend, 2026-06-12): the precise API contract is §7; mode detection §4; error matrix §7.2/§9; security constraints §12. **That guide's §7 is non-negotiable; FE implementation is ours.**
- House conventions: `src/features/auth/` (mutations + store), `src/lib/api.ts` (`authApi`), `src/lib/axios.ts` (credentialed client + refresh interceptor), `src/components/ui/` (CVA primitives), Vitest+RTL.

## Decisions (locked)
| Decision | Choice |
|---|---|
| Code input | **Six segmented boxes** — reusable accessible `OtpInput` (paste-whole-code, autofocus, auto-submit on 6th digit, `one-time-code`/`numeric`). |
| Routing | **Dedicated route** `/verify-email?email=…` (refresh-resilient; pending email in query). |
| Delivery | **Feature branch + full TDD + two-stage review**; user merges. Invisible to users until backend flips `EMAIL_VERIFICATION_REQUIRED`. |
| Mode detection | From the **registration response** (`'access' in data` → legacy; `{email}` no tokens → gated). No FE flag. |
| Resend cooldown | 45s, local component state; keeps users under the 3-per-15-min server throttle. |
| Pending email | Query param (primary). No new global store. |
| Analytics | No-op `track()` stubs only (no SDK present), matching `features/create/analytics.ts`. |

## Reconciliation facts (verified in code)
- `authApi.register` (`api.ts:65`) is typed `AuthResponse`; must become a **union** `AuthResponse | EmailVerificationPending`.
- **Stale stubs to replace** (`api.ts:95-99`): `verifyEmail(key)`→`/auth/registration/verify-email/` `{key}` and `resendVerification(email)`→`/auth/registration/resend-email/` are **wrong** for the new contract and unused by UI. Repoint to `/auth/verify-email/` `{email,code}` and `/auth/resend-verification/` `{email}`.
- `useRegister.onSuccess` (`features/auth/api.ts:64`) assumes tokens; its `else` branch would `setAccessToken(undefined)` in gated mode → must branch on token presence.
- `verify-email` 200 returns `{user}` **+ cookies but no `access` in body** (§7.2). The axios interceptor uses an **in-memory** Bearer token, so verify's onSuccess must call `authApi.refreshToken()` (uses the just-set cookie) to populate memory, then `setAuth(user, access)` — mirroring `AuthProvider`'s bootstrap. (Login/register get `access` in the body; verify does not — this is the one non-obvious difference.)
- `User` type uses `pk` (not `id`); the guide's `{id,email}` is illustrative. Treat verify's `user` as the app `User`; re-fetch via `getUser()` if the returned shape is partial.

## Architecture / files
**Data layer**
- `src/lib/api.ts`: add types `EmailVerificationPending`, `VerifyEmailRequest`, `VerifyEmailResponse`; change `register` return type to the union; replace `verifyEmail`/`resendVerification` impls with the new endpoints.
- `src/features/auth/api.ts`: branch `useRegister.onSuccess`; add `useVerifyEmail` (refresh-then-setAuth); repoint `useResendVerification`. Export from `features/auth/index.ts` (add `useVerifyEmail`).

**UI**
- `src/components/ui/otp-input.tsx` — accessible 6-box OTP primitive (`value`, `onChange`, `onComplete`, `disabled`, `aria-label`, error wiring). Digits only; paste distributes; Backspace navigates.
- `src/pages/VerifyEmailPage.tsx` — the screen. Reads `email` from query (redirect to `/register` if absent). OtpInput + inline `aria-live` error + Verify button (also auto-fires on complete) + Resend with 45s cooldown countdown. Client-validates `^\d{6}$`. On success → post-login redirect (`returnTo` or `/flow-canvas`). Auth-page chrome matching `LoginPage`.
- `src/pages/index.ts`: export `VerifyEmailPage`.

**Routing**
- `src/app/routes.tsx`: `{ path: '/verify-email', element: <GuestOnlyRoute><VerifyEmailPage/></GuestOnlyRoute> }`.

**Mode-detection wiring**
- `RegisterPage` submit success: `'access' in data` → existing in-app redirect; else → `navigate('/verify-email?email=' + encodeURIComponent(data.email))`. Handle **502** (`{detail,email}`, send failed) identically but lead with a "couldn't send — Resend" hint (e.g. query flag `?sendFailed=1`).

## Error handling (§7.2/§9/§12)
A small `parseAuthError(err)` reads **both** shapes — `{code:[...]}` (field) and `{detail:"..."}` (flow):
- verify 400 `Incorrect code.` / `expired` / `No active code` → inline message + Resend nudge. **Never** distinguish wrong-code vs unknown-email (anti-enumeration).
- verify 400 `already verified` (`detail`) → toast + redirect `/login`.
- verify **429** → disable inputs, steer to Resend.
- resend **429** → start/extend cooldown, "give it a couple minutes."
- network/5xx → generic retry. No code/email to logs/analytics.

## Testing (Vitest + RTL)
- `otp-input.test.tsx`: type advances; Backspace navigates; paste `135790` fills all; non-digits rejected; `onComplete` fires at 6.
- `features/auth/api` (verify): success establishes auth via `refreshToken` then `setAuth`; error surfaces. Register branch: tokens→`setAuth`; `{email}`→no auth, returns pending.
- `VerifyEmailPage.test.tsx`: renders the email; correct code → verify called + redirect; wrong code → inline error, no redirect; missing email param → redirect to register; resend disables button for cooldown; verify-429 disables inputs.
- Google OAuth path unchanged (§11) — no edits to `GoogleCallbackPage` here.

## Out of scope (YAGNI)
No global verification store; no FE flag reading; no magic-link handling; analytics are no-op stubs.

## Acceptance (from guide §15)
Legacy mode unchanged · gated mode routes to code screen carrying email · mode from response (no redeploy on flip) · all verify error states friendly & anti-enumeration-safe · resend cooldown keeps under throttle · Google shows no code screen · mobile/accessible code entry · no code/email logged.
