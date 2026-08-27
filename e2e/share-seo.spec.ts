/**
 * Bot-facing surfaces: the share page, the sitemap, the liveness probe.
 *
 * These are fetched by crawlers and uptime checks, not driven by a person, so
 * they are tested with a plain request context rather than a browser.
 */
import { expect, test } from '@playwright/test'

import { API_ORIGIN, raw, type JokePayload } from './fixtures/api'

const BOT = { 'User-Agent': 'Twitterbot/1.0' }

/** A published two-part joke — the shape that leaked.
 *  Pages through the feed rather than passing `page_size`, which the jokes
 *  endpoint ignores. */
async function twoPartJoke(request: Parameters<typeof raw>[0]): Promise<JokePayload> {
  for (let page = 1; page <= 6; page++) {
    const res = await request.get(`${API_ORIGIN}/api/v1/jokes/?page=${page}`)
    if (!res.ok()) break
    const body = (await res.json()) as { results: JokePayload[] }
    if (!body.results?.length) break
    const joke = body.results.find((j) => j.punchline && j.setup && !j.is_locked)
    if (joke) return joke
  }
  throw new Error(
    'No unlocked two-part joke in the first 6 pages — run `manage.py seed_e2e`.',
  )
}

test.describe('share page', () => {
  test('serves real per-joke metadata to a crawler', async ({ request }) => {
    const joke = await twoPartJoke(request)

    const res = await raw(request, `/jokes/${joke.id}/share/`, { headers: BOT })
    const html = await res.text()

    expect(res.status()).toBe(200)
    expect(html).toContain('<meta property="og:title"')
    expect(html).toContain('<meta property="og:description"')
    expect(html).toContain('application/ld+json')
    expect(html, 'canonical must point at the SPA, not the API').toContain(
      '<link rel="canonical"',
    )
  })

  /**
   * THE regression test for F-000.
   *
   * The view builds a punchline-free teaser for the meta tags and its own
   * comment says "NEVER the punchline" — but the page BODY rendered
   * `{{ joke.text }}`, which on a two-part joke is the denormalized
   * "<setup> <punchline>". So the meta tags were clean and the page still gave
   * the joke away, to anyone, with no auth and sequential ids.
   *
   * Checking the meta tags alone is exactly the mistake the previous tests
   * made. This asserts against the whole response.
   */
  test('never renders the punchline anywhere, meta tags or body', async ({ request }) => {
    const joke = await twoPartJoke(request)
    expect(joke.punchline, 'need a joke with a punchline to prove anything').toBeTruthy()

    const res = await raw(request, `/jokes/${joke.id}/share/`, { headers: BOT })
    const html = await res.text()

    // The teaser is expected — it is what makes the link worth clicking.
    expect(html).toContain(escapeHtml(joke.setup ?? ''))
    // The payoff is not.
    expect(
      html,
      'the share page gave away the punchline — the freemium model is bypassed',
    ).not.toContain(escapeHtml(joke.punchline ?? '__never__'))
  })

  test('bounces a human into the SPA', async ({ request }) => {
    const joke = await twoPartJoke(request)
    const res = await raw(request, `/jokes/${joke.id}/share/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) Chrome/140 Safari/537.36' },
    })
    const html = await res.text()

    // Client-side by design: one page serves both audiences, so crawlers read
    // the tags and browsers redirect.
    expect(html).toMatch(/http-equiv="refresh"|location\.replace/)
  })
})

test.describe('crawlable surfaces', () => {
  test('sitemap is valid XML listing frontend routes', async ({ request }) => {
    const res = await raw(request, '/sitemap.xml')
    const xml = await res.text()

    expect(res.status()).toBe(200)
    expect(xml).toContain('<urlset')
    expect(xml).toContain('<loc>')
    expect(xml.match(/<loc>/g)?.length ?? 0).toBeGreaterThan(3)
  })

  test('liveness probe answers on a path the edge does not claim', async ({ request }) => {
    // /healthz is intercepted by Google's frontend on the public run.app URL and
    // never reaches Django, so external uptime checks must target /livez.
    const res = await raw(request, '/livez')

    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })
})

/** Django escapes template output; match what actually lands in the HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
