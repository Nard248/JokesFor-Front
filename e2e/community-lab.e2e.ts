import { expect, test, type APIRequestContext } from '@playwright/test'

// Dedicated config only: the ordinary app suite discovers *.spec.ts.

const endpoint = '/api/v1/community-lab/'

async function csrf(request: APIRequestContext) {
  const response = await request.get(`${endpoint}snapshot/`)
  expect(response.ok()).toBeTruthy()
  const state = await request.storageState()
  const token = state.cookies.find((cookie) => cookie.name === 'community_lab_csrf')?.value
  expect(token).toBeTruthy()
  return token!
}

test('persists a share cascade and does not replay duplicate events', async ({ request }) => {
  const token = await csrf(request)
  const before = await (await request.get(`${endpoint}snapshot/`)).json()
  const forming = before.subjects.find((subject: { status: string }) => subject.status === 'forming')
  const content = before.content.find((item: { subject_id: string }) => item.subject_id === forming?.id) ?? before.content[0]
  const data = { content_id: content.id, event_id: crypto.randomUUID() }
  const headers = { 'X-CSRFToken': token, Origin: 'http://127.0.0.1:5187' }
  const response = await request.post(`${endpoint}share/`, { data, headers })
  expect(response.ok()).toBeTruthy()
  const after = await response.json()
  expect(after.meta.is_demo).toBe(true)
  expect(after.stats.shares).toBeGreaterThan(before.stats.shares)
  expect(after.stats.interactions).toBeGreaterThan(before.stats.interactions)
  if (forming) {
    expect(after.subjects.find((subject: { id: string }) => subject.id === forming.id).status).toBe('active')
  }
  const replay = await request.post(`${endpoint}share/`, { data, headers })
  expect(replay.ok()).toBeTruthy()
  const repeated = await replay.json()
  expect(repeated.stats.interactions).toBe(after.stats.interactions)
  expect(repeated.stats.shares).toBe(after.stats.shares)
  const persisted = await (await request.get(`${endpoint}snapshot/`)).json()
  expect(persisted.stats.interactions).toBe(after.stats.interactions)
})

test('requires CSRF and bounds simulation input', async ({ request }) => {
  const denied = await request.post(`${endpoint}simulate/`, { data: { steps: 1 } })
  expect(denied.status()).toBe(403)
  const token = await csrf(request)
  const invalid = await request.post(`${endpoint}simulate/`, {
    data: { steps: 1000000 },
    headers: { 'X-CSRFToken': token, Origin: 'http://127.0.0.1:5187' },
  })
  expect(invalid.status()).toBe(400)
})

test('join and leave survive reload without being restored by inference', async ({ request }) => {
  const token = await csrf(request)
  const snapshot = await (await request.get(`${endpoint}snapshot/`)).json()
  const subject = snapshot.subjects[0]
  const headers = { 'X-CSRFToken': token, Origin: 'http://127.0.0.1:5187' }
  for (const action of ['join', 'leave']) {
    const response = await request.post(`${endpoint}membership/`, {
      data: { subject_id: subject.id, action }, headers,
    })
    expect(response.ok()).toBeTruthy()
    const persisted = await (await request.get(`${endpoint}snapshot/`)).json()
    expect(persisted.subjects.find((item: { id: string }) => item.id === subject.id).joined).toBe(action === 'join')
  }
})

test('renders a real graph and backend counts without console errors', async ({ page, request }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const snapshot = await (await request.get(`${endpoint}snapshot/`)).json()
  await page.goto('/communities.html')
  await expect(page.getByRole('heading', { name: 'Find your kind of funny.' })).toBeVisible()
  await expect(page.locator('svg').filter({ has: page.locator('circle') }).first()).toBeVisible()
  await expect(page.getByText(snapshot.subjects[0].name, { exact: true }).first()).toBeVisible()
  expect(errors).toEqual([])
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    await expect(page.getByRole('button', { name: 'Simulate activity' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Search communities' })).toBeVisible()
  }
})

test('sharing, membership and search work through the visible UI', async ({ page }) => {
  await page.goto('/communities.html')
  await expect(page.getByRole('heading', { name: 'Find your kind of funny.' })).toBeVisible()
  const search = page.getByRole('textbox', { name: 'Search communities' })
  await search.fill('no-such-community-123')
  await expect(page.getByText('No matching communities. Try another subject.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear community search' }).click()

  const inspector = page.getByRole('complementary', { name: 'Selected community details' })
  const subjectName = await inspector.getByRole('heading', { level: 2 }).innerText()
  const shareResponse = page.waitForResponse((response) => response.url().endsWith('/community-lab/share/') && response.request().method() === 'POST')
  await page.getByRole('button', { name: /^Share joke:/ }).first().click()
  expect((await shareResponse).ok()).toBeTruthy()
  await expect(page.getByRole('status')).toContainText('Joke shared with synthetic friends')

  const membership = page.getByRole('button', { name: /^(Join|Leave) community$/ })
  const actionBefore = await membership.getAttribute('aria-label')
  const membershipResponse = page.waitForResponse((response) => response.url().endsWith('/community-lab/membership/') && response.request().method() === 'POST')
  await membership.click()
  expect((await membershipResponse).ok()).toBeTruthy()
  const expectedLabel = actionBefore === 'Join community' ? 'Leave community' : 'Join community'
  await expect(page.getByRole('button', { name: expectedLabel, exact: true })).toBeVisible()
  await page.reload()
  await search.fill(subjectName)
  await page.getByRole('complementary', { name: 'Community navigation' }).getByRole('button').filter({ hasText: subjectName }).click()
  await expect(page.getByRole('button', { name: expectedLabel, exact: true })).toBeVisible()

  const simulateResponse = page.waitForResponse((response) => response.url().endsWith('/community-lab/simulate/') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Simulate activity' }).click()
  expect((await simulateResponse).ok()).toBeTruthy()
  await expect(page.getByRole('status')).toContainText('Synthetic reactions recorded')
})

test('advancing the demo clock visibly applies the seven-day half-life', async ({ page, request }) => {
  const before = await (await request.get(`${endpoint}snapshot/`)).json()
  await page.goto('/communities.html')
  await expect(page.getByRole('heading', { name: 'Find your kind of funny.' })).toBeVisible()
  const advanced = page.waitForResponse((response) => response.url().endsWith('/community-lab/advance/') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Advance 7 days' }).click()
  const response = await advanced
  expect(response.ok()).toBeTruthy()
  const after = await response.json()
  expect(Date.parse(after.meta.simulated_at) - Date.parse(before.meta.simulated_at)).toBe(7 * 24 * 60 * 60 * 1000)
  for (const subject of before.subjects) {
    const changed = after.subjects.find((item: { id: string }) => item.id === subject.id)
    expect(changed.score).toBeCloseTo(subject.score / 2, 1)
  }
  await expect(page.getByRole('status')).toContainText('moved forward 7 days')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Find your kind of funny.' })).toBeVisible()
  const persisted = await (await request.get(`${endpoint}snapshot/`)).json()
  expect(persisted.meta.simulated_at).toBe(after.meta.simulated_at)
})
