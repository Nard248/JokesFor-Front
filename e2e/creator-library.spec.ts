import { expect, test } from '@playwright/test'
import { API, apiGet, apiSend } from './fixtures/api'
import { declineCookies } from './fixtures/auth'

test('creator prepares private material and requests reviewed metadata through the real API', async ({ page }, testInfo) => {
  const login = await page.request.post(`${API}/auth/login/`, { data: { email: 'creator-workbench@e2e.invalid', password: 'E2E-local-only-2026!' } })
  expect(login.status()).toBe(200)
  await page.goto('/create/library')
  await declineCookies(page)
  await expect(page.getByRole('heading', { name: 'Your working library' })).toBeVisible()
  await page.getByRole('button', { name: 'New collection' }).click()
  const name = `Friday opener ${Date.now()}`
  await page.getByLabel('Collection name').fill(name)
  await page.getByLabel('Description', { exact: true }).fill('Start slowly; end with a callback.')
  const add = page.getByRole('button', { name: /^Add \[e2e\] Creator workbench item/ })
  await add.nth(0).click()
  await add.nth(1).click()
  const created = page.waitForResponse((response) => response.url().endsWith('/creators/me/collections/') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Create collection' }).click()
  const response = await created
  expect(response.status()).toBe(201)
  expect(response.headers()['cache-control']).toBe('private, no-store')
  const collection = await response.json()
  expect(collection.joke_ids).toHaveLength(2)
  await page.getByRole('button', { name: `Open ${name}` }).click()
  await page.getByRole('button', { name: `Move ${collection.items[1].display_text} up` }).click()
  const reordered = page.waitForResponse((res) => res.url().endsWith(`/collections/${collection.id}/`) && res.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Save collection' }).click()
  expect((await (await reordered).json()).joke_ids).toEqual([...collection.joke_ids].reverse())
  await expect(page.getByRole('status')).toContainText('Collection saved')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: testInfo.outputPath('creator-library-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('creator-library-mobile.png'), fullPage: true })

  const jokeId = collection.joke_ids[0]
  await page.goto(`/create/library?joke=${jokeId}`)
  await page.getByLabel('Private note').fill('A private rehearsal cue: pause twice.')
  await page.getByRole('button', { name: 'Save note' }).click()
  await expect(page.getByRole('status')).toContainText('Note saved')
  await page.reload()
  await expect(page.getByLabel('Private note')).toHaveValue('A private rehearsal cue: pause twice.')
  const publicJoke = await apiGet(page, `/jokes/${jokeId}/`)
  expect(JSON.stringify(publicJoke)).not.toContain('A private rehearsal cue')

  // Choose a seeded joke without a pending request so rerunning this spec is safe.
  const history = await apiGet<{ results: { joke_id: number; status: string }[] }>(page, '/creators/me/content/metadata-requests/?page_size=100')
  const content = await apiGet<{ results: { id: number }[] }>(page, '/creators/me/content/?page_size=100')
  const available = content.results.find((item) => !history.results.some((row) => row.joke_id === item.id && row.status === 'pending'))!
  expect(available).toBeTruthy()
  await page.goto(`/create/library?joke=${available.id}&tab=review`)
  await expect(page.getByLabel('Replace themes')).toBeEnabled()
  await page.getByLabel('Replace themes').check()
  await page.getByLabel('Reason for change').fill('Review whether this material needs a more specific theme.')
  const submitted = page.waitForResponse((res) => res.url().endsWith('/content/metadata-requests/') && res.request().method() === 'POST')
  await page.getByRole('button', { name: 'Request review' }).click()
  const review = await submitted
  expect(review.status()).toBe(201)
  expect((await review.json()).results[0].status).toBe('pending')
  await expect(page.getByRole('status')).toContainText('sent for review')
  expect((await apiSend(page, 'DELETE', `/creators/me/collections/${collection.id}/`)).status).toBe(204)
  expect((await apiSend(page, 'DELETE', `/creators/me/content/${jokeId}/workspace/`)).status).toBe(204)
})
