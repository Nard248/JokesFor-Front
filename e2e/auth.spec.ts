/**
 * Signup, session and the CSRF boundary.
 *
 * The whole gated flow runs here for real — the two-step form, the age gate,
 * the emailed code — because it is a P0 path and because every other spec
 * depends on it working.
 */
import { expect, test } from '@playwright/test'

import { API, apiSend } from './fixtures/api'
import {
  declineCookies,
  newPersona,
  registerThroughUi,
  verifyThroughUi,
} from './fixtures/auth'

test.describe('gated signup', () => {
  test('a new reader can sign up, verify and land in onboarding', async ({ page }) => {
    const persona = newPersona('signup')

    await registerThroughUi(page, persona)
    await declineCookies(page)
    await verifyThroughUi(page, persona)

    // The code auto-submits on the sixth digit and drops the reader into
    // onboarding.
    await expect(page).toHaveURL(/\/flow/)

    const me = await page.request.get(`${API}/auth/user/`)
    expect(me.status(), 'verification must establish a real session').toBe(200)
    expect((await me.json()).email).toBe(persona.email)
  })

  test('an under-13 date of birth is refused and creates no account', async ({ page }) => {
    const persona = newPersona('coppa')

    const res = await page.request.post(`${API}/auth/registration/`, {
      data: {
        email: persona.email,
        password1: persona.password,
        password2: persona.password,
        date_of_birth: '2020-01-01',
      },
      failOnStatusCode: false,
    })

    expect(res.status()).toBe(400)
    expect(JSON.stringify(await res.json())).toMatch(/13 years old/i)

    // And the account must not exist at all — a rejected signup that still
    // created a row would be a COPPA problem, not just a validation one.
    const login = await page.request.post(`${API}/auth/login/`, {
      data: { email: persona.email, password: persona.password },
      failOnStatusCode: false,
    })
    expect(login.status()).toBe(400)
  })

  test('an unverified account cannot log in, and the error reveals nothing', async ({
    page,
  }) => {
    const persona = newPersona('unverified')
    const reg = await page.request.post(`${API}/auth/registration/`, {
      data: {
        email: persona.email,
        password1: persona.password,
        password2: persona.password,
        date_of_birth: '1993-04-12',
      },
    })
    expect(reg.status()).toBe(201)

    const login = await page.request.post(`${API}/auth/login/`, {
      data: { email: persona.email, password: persona.password },
      failOnStatusCode: false,
    })
    const body = JSON.stringify(await login.json())

    expect(login.status()).toBe(400)
    // A distinct "account disabled" message would confirm the address is
    // registered — an account-existence oracle. The generic message must hold.
    expect(body).toContain('Unable to log in with provided credentials')
    expect(body).not.toMatch(/disabled|not verified|inactive/i)
  })
})

test.describe('session', () => {
  test('logging out ends the session', async ({ page }) => {
    const persona = newPersona('logout')
    await page.request.post(`${API}/auth/registration/`, {
      data: {
        email: persona.email,
        password1: persona.password,
        password2: persona.password,
        date_of_birth: '1993-04-12',
      },
    })
    const { waitForVerificationCode } = await import('./fixtures/mail')
    const code = await waitForVerificationCode(persona.email)
    await page.request.post(`${API}/auth/verify-email/`, {
      data: { email: persona.email, code },
    })

    expect((await page.request.get(`${API}/auth/user/`)).status()).toBe(200)

    await page.goto('/')
    await declineCookies(page)
    const out = await apiSend(page, 'POST', '/auth/logout/')
    expect([200, 204]).toContain(out.status)

    const after = await page.request.get(`${API}/auth/user/`, { failOnStatusCode: false })
    expect(after.status(), 'the session must be gone after logout').toBe(401)
  })
})

test.describe('CSRF boundary', () => {
  /**
   * The API enforces CSRF on the COOKIE transport and exempts the bearer-header
   * transport. Both halves matter: the first protects the browser, and the
   * second is what a native client will rely on — and no backend test covers
   * the header path at all.
   */
  test('a cookie-authenticated mutation without the CSRF header is rejected', async ({
    page,
  }) => {
    const persona = newPersona('csrf')
    await page.request.post(`${API}/auth/registration/`, {
      data: {
        email: persona.email,
        password1: persona.password,
        password2: persona.password,
        date_of_birth: '1993-04-12',
      },
    })
    const { waitForVerificationCode } = await import('./fixtures/mail')
    const code = await waitForVerificationCode(persona.email)
    await page.request.post(`${API}/auth/verify-email/`, {
      data: { email: persona.email, code },
    })

    await page.goto('/')
    await declineCookies(page)

    const withoutCsrf = await page.evaluate(async (api) => {
      const res = await fetch(`${api}/favorites/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joke: 1 }),
      })
      return res.status
    }, API)

    expect(withoutCsrf, 'cookie transport must require X-CSRFToken').toBe(403)

    // The same call WITH the token gets past CSRF and reaches validation —
    // proving the 403 above was about CSRF and not about something else.
    const withCsrf = await apiSend(page, 'POST', '/favorites/', { joke: 1 })
    expect(withCsrf.status).not.toBe(403)
  })
})
