/**
 * The consent banner must not cover the app underneath it.
 *
 * It is `position: fixed` at `bottom: 0` with `z-index: 9999`, and nothing used
 * to reserve room for it — so at 375x812 it completely covered
 * `nav.flow-tabbar` and a first-time visitor could not press a single primary
 * navigation tab. On desktop it covered onboarding's "Continue", which is the
 * last element on a scrolling page.
 *
 * Both hit ONLY users who had not dismissed the banner yet — every new user, on
 * the activation path — and neither was visible to any component test, because
 * jsdom has no layout engine. Geometry is the only thing that can catch this,
 * so these assertions are geometric: `elementFromPoint` at the centre of the
 * control, not "is it in the DOM".
 *
 * Runs under the Pixel 5 project (see the .mobile.spec.ts suffix).
 */
import { expect, test } from '@playwright/test'

import { createVerifiedPersona, loginThroughUi } from './fixtures/auth'


/** Signing in dismisses the banner on the way past; bring it back, because an
 *  undismissed banner is precisely the state under test. */
async function restoreUndismissedBanner(page: import('@playwright/test').Page) {
  await page.evaluate(() => window.localStorage.removeItem('jokesfor-consent'))
}

/** Deliberately NOT dismissing the banner — that is the condition under test. */
test.describe('undismissed consent banner', () => {
  test('leaves the mobile tab bar usable', async ({ page }) => {
    const persona = await createVerifiedPersona('consent')
    await loginThroughUi(page, persona)

    await restoreUndismissedBanner(page)
    await page.goto('/flow-canvas')
    await page.waitForTimeout(1200)

    const geometry = await page.evaluate(() => {
      const banner = document.querySelector('[aria-label="Cookie consent"]')
      const tabbar = document.querySelector('nav.flow-tabbar')
      if (!banner || !tabbar) {
        return { banner: !!banner, tabbar: !!tabbar, missing: true as const }
      }
      const br = banner.getBoundingClientRect()
      const tr = tabbar.getBoundingClientRect()
      const firstTab = tabbar.querySelector('a,button') as HTMLElement | null
      const lr = firstTab?.getBoundingClientRect()
      const atCentre =
        lr && document.elementFromPoint(lr.left + lr.width / 2, lr.top + lr.height / 2)
      return {
        missing: false as const,
        consentVar: getComputedStyle(document.documentElement)
          .getPropertyValue('--consent-h')
          .trim(),
        overlaps: br.top < tr.bottom && br.bottom > tr.top,
        firstTabLabel: firstTab?.textContent?.trim() ?? null,
        blockedBy: atCentre ? (atCentre.textContent ?? '').trim().slice(0, 24) : null,
        tabIsReachable: !!(atCentre && firstTab && (firstTab === atCentre || firstTab.contains(atCentre))),
      }
    })

    expect(geometry.missing, 'expected both the banner and the tab bar on screen').toBe(
      false,
    )
    if (geometry.missing) return

    expect(
      geometry.consentVar,
      'the banner should publish its height so layouts can reserve room',
    ).not.toBe('')
    expect(
      geometry.overlaps,
      'the consent banner is sitting on top of the navigation again',
    ).toBe(false)
    expect(
      geometry.tabIsReachable,
      `the first tab (${geometry.firstTabLabel}) is not clickable — ` +
        `"${geometry.blockedBy}" is on top of it`,
    ).toBe(true)
  })

  test('tapping a tab actually navigates', async ({ page }) => {
    // The geometric check above is the precise one; this is the behavioural
    // proof that it means what it claims.
    const persona = await createVerifiedPersona('consent-nav')
    await loginThroughUi(page, persona)

    await restoreUndismissedBanner(page)
    await page.goto('/flow-canvas')
    await page.waitForTimeout(1000)

    await page.locator('nav.flow-tabbar a', { hasText: /Search/i }).first().click()

    await expect(page).toHaveURL(/\/search/)
  })
})

test.describe('mobile layout', () => {
  test('no horizontal scroll on the core reading surfaces', async ({ page }) => {
    for (const route of ['/', '/search', '/daily', '/trending']) {
      await page.goto(route)
      await page.waitForTimeout(700)

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }))

      expect(
        overflow.scrollWidth,
        `${route} scrolls horizontally at ${overflow.innerWidth}px ` +
          `(content is ${overflow.scrollWidth}px)`,
      ).toBeLessThanOrEqual(overflow.innerWidth + 1)
    }
  })
})
