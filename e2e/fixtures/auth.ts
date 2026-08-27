/**
 * Account helpers.
 *
 * Every spec makes its own account rather than sharing a fixture user. That
 * costs a second or two and buys real isolation: the paywall, the streak and
 * the achievement engine are all per-user-per-day, so a shared account would
 * make specs order-dependent and quietly flaky — and a flaky E2E suite gets
 * muted, which would put us back where we started.
 *
 * Signup always runs the REAL gated flow (register → read the emailed code →
 * verify). Nothing here skips authentication.
 */
import { expect, request as playwrightRequest, type Page } from '@playwright/test'

import { API } from './api'
import { waitForVerificationCode } from './mail'

export interface Persona {
  email: string
  password: string
  displayName: string
  handle: string
}

let counter = 0

export function newPersona(tag = 'e2e'): Persona {
  counter += 1
  const unique = `${Date.now().toString(36)}${counter}`
  return {
    email: `${tag}.${unique}@test.local`,
    password: 'E2ePassw0rd!2026',
    displayName: `E2E ${tag} ${counter}`,
    handle: `e2e${unique}`.slice(0, 28).toLowerCase(),
  }
}

/** Dismiss the consent banner so it cannot intercept clicks.
 *  Specs whose SUBJECT is the banner must not call this. */
export async function declineCookies(page: Page): Promise<void> {
  const reject = page.getByRole('button', { name: 'Reject' })
  if (await reject.isVisible().catch(() => false)) {
    await reject.click()
  }
}

/**
 * Register + verify through the API, then land the session in the browser.
 *
 * For the many specs whose subject is NOT signup. The gated flow still runs
 * for real — including reading the code out of the message the API actually
 * sent — so no authentication step is skipped; only the clicking is.
 */
export async function loginAsNewUser(page: Page, tag = 'e2e'): Promise<Persona> {
  const persona = newPersona(tag)

  const reg = await page.request.post(`${API}/auth/registration/`, {
    data: {
      email: persona.email,
      password1: persona.password,
      password2: persona.password,
      date_of_birth: '1993-04-12',
    },
  })
  expect(
    reg.status(),
    `registration failed: ${reg.status()} ${await reg.text()}`,
  ).toBe(201)

  const code = await waitForVerificationCode(persona.email)
  const verify = await page.request.post(`${API}/auth/verify-email/`, {
    data: { email: persona.email, code },
  })
  expect(
    verify.status(),
    `verification failed: ${verify.status()} ${await verify.text()}`,
  ).toBe(200)

  // verify-email establishes the session via cookies on this request context,
  // which the browser context shares.
  await page.goto('/')
  await declineCookies(page)

  const me = await page.request.get(`${API}/auth/user/`)
  expect(me.status(), 'session did not carry into the browser context').toBe(200)

  return persona
}

/**
 * The same thing, driven entirely through the UI — the two-step signup form,
 * the OTP screen, the lot. Used by the signup spec so the age gate, the consent
 * copy and the auto-submit-on-sixth-digit behaviour are covered on every run.
 */
export async function registerThroughUi(page: Page, persona: Persona): Promise<void> {
  await page.goto('/register')

  await page.getByRole('textbox', { name: 'Alex', exact: true }).fill(persona.displayName)
  await page.getByRole('textbox', { name: '@alexq' }).fill(`@${persona.handle}`)
  await page.getByRole('textbox', { name: 'you@studio.com' }).fill(persona.email)
  await page.getByRole('textbox', { name: 'Date of birth' }).fill('1993-04-12')
  await page.getByRole('textbox', { name: 'At least 8 characters' }).fill(persona.password)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  await page.getByRole('button', { name: 'they/them' }).click()
  await page.getByRole('button', { name: '💼 Office / Slack' }).click()
  await page.getByRole('button', { name: 'Create account & start setup' }).click()

  await expect(page).toHaveURL(/\/verify-email/)
}

/** Type the emailed code into the OTP boxes. It auto-submits on the sixth digit. */
export async function verifyThroughUi(page: Page, persona: Persona): Promise<void> {
  const code = await waitForVerificationCode(persona.email)
  await page.getByRole('textbox', { name: 'Digit 1' }).pressSequentially(code)
}

/**
 * Create a verified account WITHOUT touching the browser.
 *
 * Uses an isolated request context, so the browser stays logged out and a
 * subsequent UI login starts from a genuinely clean slate. `loginAsNewUser`
 * cannot be used for that: it establishes a cookie session on the page's own
 * context, and /login is guest-only, so the form never renders.
 */
export async function createVerifiedPersona(tag = 'e2e'): Promise<Persona> {
  const persona = newPersona(tag)
  const ctx = await playwrightRequest.newContext({ baseURL: API })
  try {
    const reg = await ctx.post(`${API}/auth/registration/`, {
      data: {
        email: persona.email,
        password1: persona.password,
        password2: persona.password,
        date_of_birth: '1993-04-12',
      },
    })
    expect(reg.status(), `registration failed: ${await reg.text()}`).toBe(201)

    const code = await waitForVerificationCode(persona.email)
    const verify = await ctx.post(`${API}/auth/verify-email/`, {
      data: { email: persona.email, code },
    })
    expect(verify.status(), `verification failed: ${await verify.text()}`).toBe(200)
  } finally {
    await ctx.dispose()
  }
  return persona
}

/**
 * Sign in through the real form.
 *
 * Several features gate on the SPA's OWN auth state — an in-memory access token
 * plus its zustand store — rather than on the session cookie. Telemetry is the
 * clearest example: its gate needs `getAccessToken()`, `isAuthenticated` and the
 * user's date of birth, none of which exist until the app itself has logged in.
 *
 * Pair with `createVerifiedPersona`, which leaves the browser logged out.
 */
export async function loginThroughUi(page: Page, persona: Persona): Promise<void> {
  await page.goto('/login')
  await declineCookies(page)

  await page.getByRole('textbox', { name: 'you@studio.com' }).fill(persona.email)
  await page.locator('input[type="password"]').first().fill(persona.password)
  await page.getByRole('button', { name: /Sign in/i }).click()

  await expect(page, 'login did not leave the sign-in page').not.toHaveURL(/\/login/, {
    timeout: 15_000,
  })
}
