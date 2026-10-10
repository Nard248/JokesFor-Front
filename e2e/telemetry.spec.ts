/**
 * That audience telemetry actually arrives.
 *
 * It used to go out via `navigator.sendBeacon`, which can carry neither
 * `Authorization` nor `X-CSRFToken` but does send cookies — putting it on the
 * CSRF-enforced transport, where the API rejected it. The beacon returns `true`
 * as soon as the browser queues it, so the code returned early and the working
 * fetch fallback never ran. Every impression, reveal, dwell and watch event was
 * dropped, and the unit tests were green because they asserted that
 * `sendBeacon` HAD BEEN CALLED — proving a broken transport fired, never that
 * an event was accepted.
 *
 * So this spec asserts on the RESPONSE STATUS. That is the only thing that
 * distinguishes "sent" from "delivered".
 */
import { expect, test, type Response } from '@playwright/test'

import { createVerifiedPersona, loginThroughUi } from './fixtures/auth'
import { API, apiSend } from './fixtures/api'

const CONSENT_KEY = 'jokesfor-consent'
const TELEMETRY = /\/api\/v1\/telemetry\/events/

/** Consent must be in place BEFORE the app boots, or the gate reads it as absent. */
async function withConsent(page: import('@playwright/test').Page, analytics: boolean) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key as string, value as string)
    },
    [CONSENT_KEY, JSON.stringify({ version: 1, analytics, ts: Date.now() })] as const,
  )
}

test.describe('telemetry delivery', () => {
  test('events are ACCEPTED, not merely sent', async ({ page }) => {
    // The gate reads the SPA's own auth state, not the cookie, so the account is
    // made off-browser and the app signs itself in.
    const persona = await createVerifiedPersona('telem')
    await withConsent(page, true)
    await loginThroughUi(page, persona)
    expect((await apiSend(page, 'PATCH', '/users/me/preferences/', { privacy: { share_analytics: true } })).status).toBe(200)

    const responses: Response[] = []
    page.on('response', (res) => {
      if (TELEMETRY.test(res.url())) responses.push(res)
    })

    // A detail view emits an impression after sustained visibility. A reveal
    // is only captured when the reader actually reveals a hidden punchline.
    const first = await page.evaluate(async (api) => {
      const body = await fetch(`${api}/jokes/`, { credentials: 'include' }).then((r) => r.json())
      return body.results[0].id as number
    }, API)

    await page.goto(`/jokes/${first}`)
    await page.waitForTimeout(2000)

    // pagehide flushes unconditionally (visibilitychange only fires when the
    // document really is hidden, which a synthetic event cannot fake).
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
    await page.waitForTimeout(2000)

    expect(
      responses.length,
      'no telemetry request was made at all — is the consent gate open?',
    ).toBeGreaterThan(0)

    const statuses = responses.map((r) => r.status())
    expect(
      statuses.every((s) => s === 202),
      `telemetry rejected: ${statuses.join(', ')} — 403 means the credential-less ` +
        'beacon transport is back and every event is being dropped',
    ).toBe(true)

    const delivery = responses[0]
    const payload = delivery.request().postDataJSON()
    expect(payload.events.length).toBeGreaterThan(0)
    for (const event of payload.events) {
      expect(event).toMatchObject({ schema_version: 2, platform: 'web', event_id: expect.any(String), session_id: expect.any(String), occurred_at: expect.any(String) })
      expect(Number.isNaN(Date.parse(event.occurred_at))).toBe(false)
      expect(event.user_id).toBeUndefined()
    }
    expect((await delivery.json()).accepted).toBeGreaterThan(0)
    const retry = await apiSend<{ accepted: number; duplicates: number }>(page, 'POST', '/telemetry/events', payload)
    expect(retry.status).toBe(202)
    expect(retry.body).toMatchObject({ accepted: 0, duplicates: payload.events.length })
    expect((await apiSend(page, 'PATCH', '/users/me/preferences/', { privacy: { share_analytics: false } })).status).toBe(200)
    const afterWithdrawal = await apiSend<{ accepted: number; rejected: number }>(page, 'POST', '/telemetry/events', payload)
    expect(afterWithdrawal.body).toMatchObject({ accepted: 0, rejected: payload.events.length })
  })

  test('declining analytics sends nothing at all', async ({ page }) => {
    const persona = await createVerifiedPersona('noconsent')
    await withConsent(page, false)
    await loginThroughUi(page, persona)

    let attempted = 0
    page.on('request', (req) => {
      if (TELEMETRY.test(req.url())) attempted += 1
    })

    const first = await page.evaluate(async (api) => {
      const body = await fetch(`${api}/jokes/`, { credentials: 'include' }).then((r) => r.json())
      return body.results[0].id as number
    }, API)

    await page.goto(`/jokes/${first}`)
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
    await page.waitForTimeout(1500)

    expect(
      attempted,
      'telemetry was sent despite analytics consent being declined',
    ).toBe(0)
  })
})
