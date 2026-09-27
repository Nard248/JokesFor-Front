import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { API, apiGet, type JokePayload } from './fixtures/api'
import { declineCookies, loginAsNewUser } from './fixtures/auth'

test('free accounts see the creator-tool upgrade state while reading remains free', async ({ page }) => {
  await loginAsNewUser(page, 'free-workbench')
  const denied = page.waitForResponse((response) => response.url().includes('/creators/me/content/?') && response.request().method() === 'GET')
  await page.goto('/create/content')
  expect((await denied).status()).toBe(403)
  await expect(page.getByRole('heading', { name: 'Explore your content with creator tools' })).toBeVisible()
  await expect(page.getByText('Reading and basic creator insights remain free.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Basic insights' })).toHaveAttribute('href', '/create/insights')
  expect((await apiGet<JokePayload>(page, '/jokes/random/')).is_locked).toBe(false)
  await page.getByRole('link', { name: 'View creator plans' }).click()
  await expect(page.getByRole('button', { name: 'Purchases unavailable' })).toBeDisabled()
  await expect(page.getByTestId('subscribe-btn-creator_pro')).toHaveCount(0)
})

// Seeded only by the guarded DEBUG + loopback seed_e2e command. No checkout.
test('creator workbench filters owned content and exports the same selected material', async ({ page }, testInfo) => {
  const login = await page.request.post(`${API}/auth/login/`, { data: {
    email: 'creator-workbench@e2e.invalid', password: 'E2E-local-only-2026!',
  } })
  expect(login.status(), 'local seed creator must be able to sign in').toBe(200)
  await page.goto('/create/content')
  await declineCookies(page)
  await expect(page.getByText('26 jokes', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Creator workbench item/ }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('Page 2 of 2')).toBeVisible()

  await page.getByLabel('Format', { exact: true }).selectOption('oneliner')
  await page.getByLabel('Language', { exact: true }).selectOption('en')
  await page.getByLabel('Theme', { exact: true }).selectOption('e2e-creator-theme')
  await page.getByLabel('Category', { exact: true }).selectOption('e2e-creator-category')
  await page.getByLabel('Search content', { exact: true }).fill('timing is everything')
  const filtered = page.waitForResponse((response) => response.url().includes('/creators/me/content/?') && response.url().includes('theme=e2e-creator-theme'))
  await page.getByRole('button', { name: 'Apply filters' }).click()
  const filteredResponse = await filtered
  expect(filteredResponse.status()).toBe(200)
  const body = await filteredResponse.json()
  expect(body.count).toBe(1)
  expect(body.results[0]).toMatchObject({
    text: '[e2e] Creator workbench: timing is everything.',
    format: { slug: 'oneliner' }, language: { code: 'en' }, metadata_completeness: 100,
  })
  expect(body.measurement_notes.length).toBeGreaterThan(0)
  await expect(page.getByText('Page 1 of 1')).toBeVisible()
  await expect(page.getByRole('link', { name: '[e2e] Creator workbench: timing is everything.' })).toBeVisible()
  const downloadReady = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export CSV' }).click()
  const download = await downloadReady
  expect(download.suggestedFilename()).toBe('jokesfor-creator-content.csv')
  const csv = await readFile((await download.path())!, 'utf8')
  expect(csv).toContain('metadata_completeness')
  expect(csv).toContain('[e2e] Creator workbench: timing is everything.')
  expect(csv).not.toContain('Creator workbench item ')
  await page.screenshot({ path: testInfo.outputPath('creator-workbench-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Apply filters' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('creator-workbench-mobile.png'), fullPage: true })
})
