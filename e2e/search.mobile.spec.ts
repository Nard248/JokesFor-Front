import { expect, test, type Locator, type Page } from '@playwright/test'

import { declineCookies } from './fixtures/auth'

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1)
}

async function expectTouchTarget(control: Locator) {
  await expect(control).toBeVisible()
  const bounds = await control.boundingBox()
  expect(bounds, 'the search control must have a visible hit target').not.toBeNull()
  expect(bounds!.width).toBeGreaterThanOrEqual(44)
  expect(bounds!.height).toBeGreaterThanOrEqual(44)
}

test('phone search fits the viewport and its input, submit and clear controls have 44px targets', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/search?language=en')
  await declineCookies(page)

  const form = page.getByRole('search')
  const searchbox = form.getByRole('searchbox', { name: 'Search jokes', exact: true })
  await expectTouchTarget(searchbox)
  await expectTouchTarget(form.getByRole('button', { name: 'Search', exact: true }))
  const filters = page.locator('summary').filter({ hasText: 'Refine your search' })
  await expectTouchTarget(filters)
  await expectNoHorizontalOverflow(page)

  await filters.tap()
  const format = page.getByRole('checkbox', { name: 'One-liner', exact: true })
  await expect(format).toBeVisible()
  await expectTouchTarget(format.locator('..'))
  await expectNoHorizontalOverflow(page)
  await filters.tap()

  await searchbox.fill('E2E Creator Category')
  await form.getByRole('button', { name: 'Search', exact: true }).tap()
  await expect(page.locator('a[href^="/jokes/"][href$="?source=search"]').filter({
    hasText: '[e2e] Creator workbench: timing is everything.',
  })).toBeVisible()

  const clear = form.getByRole('button', { name: /Clear/ })
  await expectTouchTarget(clear)
  await expectNoHorizontalOverflow(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: testInfo.outputPath('search-mobile.png'), fullPage: true })
  await clear.tap()
  await expect(searchbox).toHaveValue('')
  await expect(page).toHaveURL((url) => !url.searchParams.has('q'))
  await expectNoHorizontalOverflow(page)
})
