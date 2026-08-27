/**
 * The freemium paywall — and the P0 regression guard for it.
 *
 * A locked joke leaked its punchline through the denormalized `text` field on
 * every API path, for 121 of 314 live jokes, while the UI rendered a perfect
 * redaction. Every test that looked at the screen passed. So these specs assert
 * on the PAYLOAD, and check every format, because the leak was format-specific
 * and the one format sampled by hand happened to be a safe one.
 */
import { expect, test } from '@playwright/test'

import {
  apiGet,
  dailyReads,
  exhaustFreeReads,
  feedIds,
  unreadJokeId,
  type JokePayload,
} from './fixtures/api'
import { declineCookies, loginAsNewUser } from './fixtures/auth'

test.describe('free reader allowance', () => {
  test('grants exactly ten distinct reads, then locks', async ({ page }) => {
    await loginAsNewUser(page, 'paywall')

    const before = await dailyReads(page)
    expect(before.limit).toBe(10)
    expect(before.used).toBe(0)

    const consumed = await exhaustFreeReads(page)
    const after = await dailyReads(page)

    expect(consumed).toHaveLength(10)
    expect(after.used).toBe(10)
    expect(after.remaining).toBe(0)
    expect(after.over).toBe(true)

    const locked = await apiGet<JokePayload>(
      page,
      `/jokes/${await unreadJokeId(page, consumed)}/`,
    )
    expect(locked.is_locked).toBe(true)
  })

  test('re-opening a joke already read today stays free', async ({ page }) => {
    await loginAsNewUser(page, 'reread')
    const consumed = await exhaustFreeReads(page)

    const reread = await apiGet<JokePayload>(page, `/jokes/${consumed[0]}/`)
    const after = await dailyReads(page)

    expect(reread.is_locked).toBe(false)
    expect(after.used, 'a re-read must not consume a second read').toBe(10)
  })

  test('the daily joke stays readable past the cap', async ({ page }) => {
    await loginAsNewUser(page, 'daily')
    await exhaustFreeReads(page)

    const daily = await apiGet<{ joke: JokePayload }>(page, '/daily-jokes/today/')

    expect(daily.joke.is_locked).toBe(false)
    // Content lives in a different field per format — `lines` for knock-knock,
    // `text` for one-liners, `punchline` for two-part jokes — and the unused
    // ones are empty strings rather than null, so `??` would happily return "".
    const payoff = [
      daily.joke.punchline,
      daily.joke.text,
      daily.joke.lines?.join(' '),
    ].find((v) => v)
    expect(
      payoff,
      `the daily joke is the retention hook — it must survive the cap ` +
        `(format ${daily.joke.format?.slug}, got ${JSON.stringify(daily.joke).slice(0, 160)})`,
    ).toBeTruthy()
  })
})

test.describe('locked payloads withhold the payoff', () => {
  /**
   * THE regression test for F-021.
   *
   * `text` is a denormalized "<setup> <punchline>" on every two-part format, so
   * a strip keyed on the format slug leaked the payoff for setup / anti /
   * short-story while looking correct for one-liners. Asserting `punchline ===
   * null` is NOT enough — that is exactly what the old code did correctly while
   * shipping the same words in `text`.
   */
  test('no locked joke ships its punchline in ANY field, in any format', async ({ page }) => {
    await loginAsNewUser(page, 'leak')
    await exhaustFreeReads(page)
    expect((await dailyReads(page)).over).toBe(true)

    const seenFormats = new Set<string>()
    const leaks: Array<{ id: number; format?: string; field: string; value: string }> = []

    for (const pageNo of [1, 2, 3, 4]) {
      const body = await apiGet<{ results: JokePayload[] }>(page, `/jokes/?page=${pageNo}`)
      for (const joke of body.results ?? []) {
        if (!joke.is_locked) continue
        seenFormats.add(joke.format?.slug ?? 'unknown')
        for (const [field, value] of Object.entries({
          punchline: joke.punchline,
          text: joke.text,
          lines: joke.lines ? joke.lines.join(' ') : null,
        })) {
          if (value) {
            leaks.push({ id: joke.id, format: joke.format?.slug, field, value })
          }
        }
      }
    }

    expect(
      seenFormats.size,
      'the fixture must cover several formats or this test proves little',
    ).toBeGreaterThan(1)
    expect(
      leaks,
      `locked jokes leaked content: ${JSON.stringify(leaks.slice(0, 5), null, 2)}`,
    ).toEqual([])
  })

  test('the teaser survives so a locked card is still worth looking at', async ({ page }) => {
    await loginAsNewUser(page, 'teaser')
    const consumed = await exhaustFreeReads(page)
    const id = await unreadJokeId(page, consumed)

    const locked = await apiGet<JokePayload>(page, `/jokes/${id}/`)

    expect(locked.is_locked).toBe(true)
    // Withholding everything would be safe but useless — there'd be nothing to
    // convert on. Two-part jokes keep their setup.
    if (locked.format?.slug === 'setup' || locked.format?.slug === 'anti') {
      expect(locked.setup, 'two-part jokes must keep the setup as a teaser').toBeTruthy()
    }
  })

  test('every serving path applies the lock, not just detail', async ({ page }) => {
    await loginAsNewUser(page, 'paths')
    await exhaustFreeReads(page)

    // Search and random are separate code paths that each build their own
    // serializer context; a lock applied only in list() would miss them.
    for (const path of ['/jokes/?page=3', '/jokes/?q=joke', '/jokes/random/']) {
      const body = await apiGet<{ results?: JokePayload[] } & JokePayload>(page, path)
      const items = body.results ?? [body]
      for (const joke of items) {
        if (!joke?.is_locked) continue
        expect(joke.punchline, `${path} leaked a punchline`).toBeNull()
        expect(joke.text, `${path} leaked text`).toBeNull()
      }
    }
  })
})

test.describe('the paywall in the browser', () => {
  test('a capped reader sees the lock state and an upgrade path', async ({ page }) => {
    await loginAsNewUser(page, 'ui')
    const consumed = await exhaustFreeReads(page)
    const id = await unreadJokeId(page, consumed)

    await page.goto(`/jokes/${id}`)
    await declineCookies(page)

    // The payoff is absent from the DOM entirely, not merely blurred by CSS.
    const payload = await apiGet<JokePayload>(page, `/jokes/${id}/`)
    expect(payload.is_locked).toBe(true)

    await expect(
      page.getByText(/free daily jokes|unlock|supporter/i).first(),
    ).toBeVisible()
  })

  test('an anonymous reader gets the same ten-read wall', async ({ page }) => {
    await page.goto('/')
    await declineCookies(page)

    const ids = await feedIds(page, 2)
    for (const id of ids.slice(0, 11)) {
      await page.evaluate(async ([base, jokeId]) => {
        await fetch(`${base}/jokes/${jokeId}/reveal/`, {
          method: 'POST',
          credentials: 'include',
        })
      }, ['http://localhost:8011/api/v1', id] as const)
    }

    const state = await dailyReads(page)
    expect(state.over, 'the anonymous cookie ledger should also cap at ten').toBe(true)
  })
})
