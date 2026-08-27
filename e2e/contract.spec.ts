/**
 * FE<->BE contract regressions.
 *
 * Every check here guards a bug that shipped while both unit suites were green,
 * because each side was tested against its own idea of the contract.
 */
import { expect, test } from '@playwright/test'

import { apiGet, apiSend, type JokePayload } from './fixtures/api'
import { declineCookies, loginAsNewUser } from './fixtures/auth'

interface Taxon {
  slug: string
}

test.describe('taxonomy catalogues', () => {
  /**
   * F-004. These are bounded reference tables the client reads once to fill
   * pickers, and they inherited the feed's PAGE_SIZE=10 with no page_size
   * override. Nine rows were simply unreachable in the UI — the creator
   * editor could not offer them and Explore could not filter by them — while
   * looking like a working feature.
   */
  const CATALOGUES = [
    'context-tags',
    'tones',
    'formats',
    'culture-tags',
    'languages',
    'age-ratings',
    'vibes',
  ]

  for (const name of CATALOGUES) {
    test(`/${name}/ returns the whole catalogue, not a first page`, async ({ page }) => {
      await page.goto('/')
      await declineCookies(page)

      const body = await apiGet<Taxon[] | { count: number; results: Taxon[] }>(
        page,
        `/${name}/`,
      )

      if (Array.isArray(body)) {
        // Unpaginated — the whole point. Nothing further to prove.
        expect(body.length).toBeGreaterThan(0)
        return
      }
      // Anything else means an error envelope (throttled, auth, 404). Say so
      // plainly rather than dying on `undefined.length` three lines down.
      expect(
        body,
        `/${name}/ did not return a catalogue: ${JSON.stringify(body).slice(0, 200)}`,
      ).toHaveProperty('results')
      expect(
        body.results.length,
        `/${name}/ is paginated and truncated: ${body.results.length} of ${body.count} ` +
          'rows reach the client, and the SPA only ever fetches page 1',
      ).toBe(body.count)
    })
  }

  test('context-tags exposes more than one page worth of rows', async ({ page }) => {
    await page.goto('/')
    await declineCookies(page)

    const body = await apiGet<Taxon[]>(page, '/context-tags/')

    expect(Array.isArray(body), 'lookup catalogues should be unpaginated').toBe(true)
    expect(
      body.length,
      'the seeded taxonomy has more than 10 themes; if this is 10 the cap is back',
    ).toBeGreaterThan(10)
  })
})

test.describe('feed filters', () => {
  /**
   * F-011. `joke_format` was an exact match while every sibling axis
   * (tones/themes/culture) comma-split into __in, so stacking two formats in
   * Explore returned an empty feed instead of the union.
   */
  test('stacking formats widens the feed instead of emptying it', async ({ page }) => {
    await page.goto('/')
    await declineCookies(page)

    const one = await apiGet<{ count: number }>(page, '/jokes/?joke_format=oneliner')
    const setup = await apiGet<{ count: number }>(page, '/jokes/?joke_format=setup')
    const both = await apiGet<{ count: number }>(page, '/jokes/?joke_format=oneliner,setup')

    expect(one.count).toBeGreaterThan(0)
    expect(setup.count).toBeGreaterThan(0)
    expect(
      both.count,
      'a multi-format filter returned fewer results than one format alone — ' +
        'it is matching the literal string again',
    ).toBeGreaterThanOrEqual(Math.max(one.count, setup.count))
  })

  test('an unknown format slug matches nothing rather than everything', async ({ page }) => {
    await page.goto('/')
    await declineCookies(page)

    const body = await apiGet<{ count: number }>(page, '/jokes/?joke_format=not-a-format')

    expect(body.count).toBe(0)
  })
})

test.describe('the daily ritual', () => {
  /**
   * F-012. `order_by('?')` re-rolled per request, so a logged-out reader saw a
   * different joke on every refresh and a shared "joke of the day" link showed
   * something different to each recipient.
   */
  test('the anonymous daily joke is the same all day', async ({ page }) => {
    await page.goto('/')
    await declineCookies(page)

    const ids: number[] = []
    for (let i = 0; i < 3; i++) {
      const body = await apiGet<{ joke: JokePayload }>(page, '/daily-jokes/today/')
      ids.push(body.joke.id)
    }

    expect(new Set(ids).size, `daily joke changed between requests: ${ids}`).toBe(1)
  })
})

test.describe('achievements', () => {
  /**
   * F-007. Twelve badges were seeded and rendered, but no code path ever wrote
   * a UserAchievement — `criteria_type`/`criteria_value` were decorative and
   * every badge read unlocked:false forever.
   */
  test('a badge unlocks once its threshold is crossed', async ({ page }) => {
    await loginAsNewUser(page, 'ach')

    const before = await apiGet<{ results: Array<{ unlocked: boolean }> }>(
      page,
      '/users/me/achievements/',
    )
    expect(before.results.length).toBeGreaterThan(0)
    expect(before.results.filter((a) => a.unlocked)).toHaveLength(0)

    const feed = await apiGet<{ results: JokePayload[] }>(page, '/jokes/')
    const saved = await apiSend(page, 'POST', '/saved-jokes/', {
      joke: feed.results[0].id,
    })
    expect([200, 201]).toContain(saved.status)

    const after = await apiGet<{ results: Array<{ unlocked: boolean }> }>(
      page,
      '/users/me/achievements/',
    )
    expect(
      after.results.filter((a) => a.unlocked).length,
      'saving a joke crossed a seeded threshold but unlocked nothing',
    ).toBeGreaterThan(0)
  })
})
