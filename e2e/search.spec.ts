/** Search is exercised through the real SPA, API and PostgreSQL index. */
import { expect, test, type Page } from '@playwright/test'

import { declineCookies } from './fixtures/auth'

const PUNCHLINE_QUERY = 'every reader can reach'
const PUNCHLINE_SETUP = '[e2e] Why did the two-part joke cross the road?'
const CATEGORY_QUERY = 'E2E Creator Category'
const CATEGORY_JOKE = '[e2e] Creator workbench: timing is everything.'
const NO_MATCH_QUERY = 'quartzblimpnoresultzz'

function results(page: Page) {
  return page.locator('a[href^="/jokes/"][href$="?source=search"]')
}

/** Inspect the same response that the page consumes, without replacing it. */
function searchResponse(page: Page, query: string, pageNumber = '1') {
  return page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/v1/jokes/' &&
      url.searchParams.get('q') === query &&
      (url.searchParams.get('page') ?? '1') === pageNumber &&
      response.request().method() === 'GET'
  }, { timeout: 10_000 })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/search?language=en')
  await declineCookies(page)
})

test('typing a remembered punchline finds its joke without submitting', async ({ page }) => {
  const searchbox = page.getByRole('searchbox', { name: 'Search jokes', exact: true })
  await searchbox.fill('every ')
  // A pause between words must not trim the live input and join the next word.
  await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'every')
  await expect(searchbox).toHaveValue('every ')
  const responsePromise = searchResponse(page, PUNCHLINE_QUERY)
  await searchbox.pressSequentially('reader can reach')

  const response = await responsePromise
  expect(response.ok()).toBe(true)
  const payload = await response.json()
  expect(payload.results).toEqual(expect.arrayContaining([
    expect.objectContaining({ setup: PUNCHLINE_SETUP, is_locked: false }),
  ]))
  await expect(results(page).filter({ hasText: PUNCHLINE_SETUP })).toBeVisible()
  await expect(page).toHaveURL((url) => url.searchParams.get('q') === PUNCHLINE_QUERY)
})

test('a category label finds a joke whose content does not contain that label', async ({ page }, testInfo) => {
  const responsePromise = searchResponse(page, CATEGORY_QUERY)
  await page.getByRole('searchbox', { name: 'Search jokes', exact: true }).fill(CATEGORY_QUERY)
  await page.getByRole('searchbox', { name: 'Search jokes', exact: true }).press('Enter')

  const response = await responsePromise
  expect(response.ok()).toBe(true)
  const payload = await response.json()
  expect(payload.results).toEqual(expect.arrayContaining([
    expect.objectContaining({ text: CATEGORY_JOKE }),
  ]))
  await expect(results(page).filter({ hasText: CATEGORY_JOKE })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('search-desktop.png'), fullPage: true })
})

test('an unmatched query shows an empty state and removes previous results', async ({ page }) => {
  const searchbox = page.getByRole('searchbox', { name: 'Search jokes', exact: true })
  await searchbox.fill(CATEGORY_QUERY)
  await expect(results(page).filter({ hasText: CATEGORY_JOKE })).toBeVisible()

  const responsePromise = searchResponse(page, NO_MATCH_QUERY)
  await searchbox.fill(NO_MATCH_QUERY)
  const response = await responsePromise
  expect(response.ok()).toBe(true)
  expect(await response.json()).toMatchObject({ count: 0, results: [] })
  await expect(page.getByText(/No jokes (?:found|match|for)/i).first()).toBeVisible()
  await expect(results(page)).toHaveCount(0)
})

test('category checkboxes constrain results and combine with text search', async ({ page }) => {
  await page.locator('summary').filter({ hasText: 'Refine your search' }).click()
  const category = page.getByRole('checkbox', { name: CATEGORY_QUERY, exact: true })
  await category.click()
  await expect(category).toBeChecked()
  await expect(page).toHaveURL((url) => url.searchParams.get('categories') === 'e2e-creator-category')
  await expect(results(page)).toHaveCount(1)
  await expect(results(page).filter({ hasText: CATEGORY_JOKE })).toBeVisible()

  const responsePromise = searchResponse(page, 'Filler joke')
  await page.getByRole('searchbox', { name: 'Search jokes', exact: true }).fill('Filler joke')
  const response = await responsePromise
  expect(new URL(response.url()).searchParams.get('categories')).toBe('e2e-creator-category')
  expect(await response.json()).toMatchObject({ count: 0, results: [] })
  await expect(results(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'No jokes found' })).toBeVisible()
})

test('a query survives reload and browser Back restores the previous query and results', async ({ page }) => {
  await page.goto(`/search?language=en&q=${encodeURIComponent(PUNCHLINE_QUERY)}`)
  const searchbox = page.getByRole('searchbox', { name: 'Search jokes', exact: true })
  await expect(searchbox).toHaveValue(PUNCHLINE_QUERY)
  await expect(results(page).filter({ hasText: PUNCHLINE_SETUP })).toBeVisible()

  await searchbox.fill(CATEGORY_QUERY)
  await searchbox.press('Enter')
  await expect(page).toHaveURL((url) => url.searchParams.get('q') === CATEGORY_QUERY)
  await expect(results(page).filter({ hasText: CATEGORY_JOKE })).toBeVisible()

  await page.reload()
  await expect(searchbox).toHaveValue(CATEGORY_QUERY)
  await expect(results(page).filter({ hasText: CATEGORY_JOKE })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL((url) => url.searchParams.get('q') === PUNCHLINE_QUERY)
  await expect(searchbox).toHaveValue(PUNCHLINE_QUERY)
  await expect(results(page).filter({ hasText: PUNCHLINE_SETUP })).toBeVisible()
  await expect(results(page).filter({ hasText: CATEGORY_JOKE })).toHaveCount(0)
})

test('load more appends unique matches and a new query discards all accumulated pages', async ({ page }) => {
  const firstResponsePromise = searchResponse(page, 'e2e')
  await page.getByRole('searchbox', { name: 'Search jokes', exact: true }).fill('e2e')
  const firstResponse = await firstResponsePromise
  expect(firstResponse.ok()).toBe(true)
  const firstPayload = await firstResponse.json()
  expect(firstPayload.results.length).toBeGreaterThan(0)
  expect(firstPayload.next).not.toBeNull()
  await expect(results(page)).toHaveCount(firstPayload.results.length)
  await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'e2e')
  await expect(page.getByRole('region', { name: 'Search results' })).toHaveAttribute('aria-busy', 'false')
  const firstPage = await results(page).evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  const responsePromise = searchResponse(page, 'e2e', '2')
  await page.getByRole('button', { name: /^Load more/ }).click()
  const secondResponse = await responsePromise
  expect(secondResponse.ok()).toBe(true)
  const secondPayload = await secondResponse.json()
  const expectedCount = firstPayload.results.length + secondPayload.results.length
  await expect(results(page)).toHaveCount(expectedCount)
  const loaded = await results(page).evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  expect(new Set(loaded).size).toBe(expectedCount)
  expect(loaded.slice(0, firstPage.length)).toEqual(firstPage)

  await page.getByRole('searchbox', { name: 'Search jokes', exact: true }).fill(CATEGORY_QUERY)
  await expect(results(page)).toHaveCount(1)
  await expect(results(page).filter({ hasText: CATEGORY_JOKE })).toBeVisible()
  await expect(results(page).filter({ hasText: 'Filler joke' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Load more/ })).toHaveCount(0)
})
