/** Free audience contract, including compatibility with older quota endpoints. */
import { expect, test } from '@playwright/test'
import { apiGet, apiSend, dailyReads, feedIds, type JokePayload } from './fixtures/api'
import { declineCookies, loginAsNewUser } from './fixtures/auth'

for (const signedIn of [false, true]) {
  test(`reading stays free beyond the old quota (signed in: ${signedIn})`, async ({ page }) => {
    if (signedIn) await loginAsNewUser(page, 'free-reader')
    else await page.goto('/')
    await declineCookies(page)

    const ids = await feedIds(page, 2)
    expect(ids.length, 'seed enough eligible jokes to cross the old ten-read quota').toBeGreaterThan(10)
    for (const id of ids.slice(0, 11)) {
      const joke = await apiGet<JokePayload>(page, `/jokes/${id}/`)
      expect(joke.is_locked).toBe(false)
      if (!signedIn) {
        const reveal = await apiSend(page, 'POST', `/jokes/${id}/reveal/`)
        expect(reveal.status).toBe(200)
        expect(reveal.body).toMatchObject({ used: 0, limit: null, remaining: null, over: false })
      }
    }
    expect(await dailyReads(page)).toMatchObject({ limit: null, remaining: null, over: false })
    await page.goto(`/jokes/${ids[10]}`)
    await expect(page.getByRole('button', { name: /unlock with supporter|subscribe/i })).toHaveCount(0)
    await expect(page.getByText(/free daily jokes|reveals left today/i)).toHaveCount(0)
  })
}

test('mystery discovery is available beyond the old three-roll quota', async ({ page }) => {
  await loginAsNewUser(page, 'free-mystery')
  for (let i = 0; i < 4; i++) {
    const result = await apiSend<{ joke: JokePayload; rolls_remaining_today: number | null }>(page, 'POST', '/mystery-box/roll/')
    expect(result.status).toBe(200)
    expect(result.body.rolls_remaining_today).toBeNull()
    expect(result.body.joke.is_locked).toBe(false)
  }
  expect(await apiGet(page, '/mystery-box/status/')).toMatchObject({ max_per_day: null, rolls_remaining_today: null })
})

test('eligible catalog, random and daily responses do not withhold content for payment', async ({ page }) => {
  await loginAsNewUser(page, 'free-formats')
  for (const path of ['/jokes/', '/jokes/?search=joke', '/jokes/random/']) {
    const body = await apiGet<{ results?: JokePayload[] } & JokePayload>(page, path)
    const items = body.results ?? [body]
    expect(items.length).toBeGreaterThan(0)
    for (const joke of items) expect(joke.is_locked).toBe(false)
  }
  const daily = await apiGet<{ joke: JokePayload }>(page, '/daily-jokes/today/')
  expect(daily.joke.is_locked).toBe(false)
})
