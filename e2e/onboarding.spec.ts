/**
 * Onboarding — the flow that used to persist nothing.
 *
 * It sent nine fields; the API handled four. Format slugs arrived in a TONE
 * field, matched nothing, and `.set([])` WIPED the reader's real preferences
 * behind a 200 OK. The one thing that did save (UserVibe) was read by no
 * serving path, while personalization read the field onboarding had just
 * emptied. Net: three screens of taste questions changed nothing about what the
 * reader was served, and `onboarding_completed` never flipped.
 *
 * So these specs do the UI flow and then check the DATABASE-BACKED state, which
 * is the only place the bug was visible.
 */
import { expect, test } from '@playwright/test'

import { apiGet, apiSend } from './fixtures/api'
import { declineCookies, loginAsNewUser } from './fixtures/auth'

interface Preferences {
  humor_types: string[]
  onboarding_completed: boolean
  notification_enabled: boolean
  notification_time: string | null
  notification_days: string[]
}

test.describe('the onboarding flow', () => {
  test('completing all three steps actually persists the choices', async ({ page }) => {
    await loginAsNewUser(page, 'onb')

    await page.goto('/flow')
    await declineCookies(page)

    // Step 1 — at least three vibes before Continue enables.
    const vibes = ['🧓 Dad jokes', '🎯 Puns', '⚡ One-liners']
    for (const label of vibes) {
      await page.getByRole('button', { name: new RegExp(label) }).click()
    }
    const cont = page.getByRole('button', { name: 'Continue', exact: true })
    await expect(cont).toBeEnabled()
    await cont.click()

    // Step 2 — formats.
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    // Step 3 — the daily ritual. Pick a distinctive time so persistence is
    // unambiguous rather than matching a default.
    await page.getByRole('button', { name: /21:00/ }).click()
    await page.getByRole('button', { name: "Done — show me today's joke" }).click()

    await expect(page).toHaveURL(/\/flow-canvas/)

    const prefs = await apiGet<Preferences>(page, '/users/me/preferences/')

    expect(
      prefs.onboarding_completed,
      'onboarding_completed never flipped, so the flow can re-trigger forever',
    ).toBe(true)
    expect(prefs.notification_time, 'the chosen ritual time was dropped').toBe('21:00:00')
    expect(prefs.notification_days.length).toBeGreaterThan(0)
  })

  test('choosing vibes drives what the reader is served', async ({ page }) => {
    await loginAsNewUser(page, 'vibes')

    const before = await apiGet<Preferences>(page, '/users/me/preferences/')
    expect(before.humor_types).toEqual([])

    const saved = await apiSend(page, 'PUT', '/users/me/vibes/', {
      slugs: ['dad', 'puns', 'office'],
    })
    expect(saved.status).toBe(200)

    const after = await apiGet<Preferences>(page, '/users/me/preferences/')

    // A Vibe is a filter recipe over Format/Theme/Category, and the daily joke
    // filters on preferred_tones. If saving vibes leaves this empty, the vibes
    // screen is decorative again.
    expect(
      after.humor_types.length,
      'vibes saved but preferred_tones stayed empty — personalization is inert',
    ).toBeGreaterThan(0)
  })
})

test.describe('the preferences contract', () => {
  test('an unknown key is rejected rather than silently ignored', async ({ page }) => {
    await loginAsNewUser(page, 'unknown')

    const res = await apiSend(page, 'PATCH', '/users/me/preferences/', {
      totally_made_up_field: 'x',
    })

    // Silently accepting unknown keys is how nine fields went missing for
    // months behind a 200 OK.
    expect(res.status).toBe(400)
  })

  test('an unresolvable tone slug does not wipe existing preferences', async ({ page }) => {
    await loginAsNewUser(page, 'wipe')

    await apiSend(page, 'PUT', '/users/me/vibes/', { slugs: ['dad', 'puns', 'office'] })
    const seeded = await apiGet<Preferences>(page, '/users/me/preferences/')
    expect(seeded.humor_types.length).toBeGreaterThan(0)

    // Format slugs in a tone field: exactly what the SPA used to send.
    const res = await apiSend(page, 'PATCH', '/users/me/preferences/', {
      humor_types: ['oneliner', 'setup'],
    })
    expect(res.status, 'unresolvable slugs must be refused, not applied').toBe(400)

    const after = await apiGet<Preferences>(page, '/users/me/preferences/')
    expect(
      after.humor_types,
      'a rejected update still erased the reader’s real preferences',
    ).toEqual(seeded.humor_types)
  })

  test('a malformed body is a client error, not a server error', async ({ page }) => {
    await loginAsNewUser(page, 'malformed')

    const status = await page.evaluate(async (api) => {
      const csrf = await fetch(`${api}/auth/csrf/`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d: { csrfToken?: string }) => d.csrfToken)
      const res = await fetch(`${api}/users/me/preferences/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
        body: JSON.stringify([{ theme: 'dark' }]),
      })
      return res.status
    }, 'http://localhost:8011/api/v1')

    expect(status, 'a JSON array body used to raise TypeError and 500').toBe(400)
  })
})
