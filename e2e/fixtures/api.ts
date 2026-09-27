/**
 * A thin, typed client for the REAL API, used for test setup and for asserting
 * on the wire.
 *
 * Two rules this encodes:
 *
 * 1. **Set up through the API, assert through the UI — or vice versa.** Use the API
 *    for repeatable setup and assert the resulting behavior in the browser.
 *
 * 2. **Assert on payloads, not just pixels.** The paywall leak that reached
 *    production rendered a correct redaction on screen while shipping the
 *    punchline in the JSON. Any spec that only looked at the page would have
 *    passed. `apiGet` exists so specs can look at what actually crossed the
 *    wire.
 */
import type { APIRequestContext, Page } from '@playwright/test'

export const API_ORIGIN = process.env.E2E_API_ORIGIN ?? 'http://localhost:8011'
export const API = `${API_ORIGIN}/api/v1`

export interface JokePayload {
  id: number
  text: string | null
  setup: string | null
  punchline: string | null
  lines: string[] | null
  is_locked: boolean
  format?: { slug: string }
}

export interface DailyReads {
  limit: number | null
  used: number
  remaining: number | null
  over: boolean
  reset_at: string
}

/** Read an endpoint using the BROWSER's own cookies/session.
 *  This is what makes payload assertions trustworthy: it is the same session
 *  the page is using, not a parallel one that might be in a different state. */
export async function apiGet<T = unknown>(page: Page, path: string): Promise<T> {
  return page.evaluate(async ([base, p]) => {
    const res = await fetch(`${base}${p}`, { credentials: 'include' })
    return res.json()
  }, [API, path] as const) as Promise<T>
}

/** Same, for mutations. Bootstraps CSRF because the cookie transport enforces it. */
export async function apiSend<T = unknown>(
  page: Page,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<{ status: number; body: T }> {
  return page.evaluate(
    async ([base, m, p, payload]) => {
      const csrf = await fetch(`${base}/auth/csrf/`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d: { csrfToken?: string }) => d.csrfToken)
        .catch(() => undefined)
      const res = await fetch(`${base}${p}`, {
        method: m as string,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
        ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      })
      let parsed: unknown = null
      try {
        parsed = await res.json()
      } catch {
        /* 204 and friends */
      }
      return { status: res.status, body: parsed }
    },
    [API, method, path, body] as const,
  ) as Promise<{ status: number; body: T }>
}

/** Server-side request context (no browser). For share pages, sitemap, probes —
 *  anything where a bot, not a person, is the client. */
export async function raw(
  request: APIRequestContext,
  path: string,
  init?: { headers?: Record<string, string> },
) {
  const url = path.startsWith('http') ? path : `${API_ORIGIN}${path}`
  return request.get(url, init)
}

/** Every joke the feed will serve, newest first, across `pages` pages. */
export async function feedIds(page: Page, pages = 3): Promise<number[]> {
  const ids: number[] = []
  for (let p = 1; p <= pages; p++) {
    const body = await apiGet<{ results: JokePayload[] }>(page, `/jokes/?page=${p}`)
    ids.push(...(body.results ?? []).map((j) => j.id))
  }
  return ids
}

export async function dailyReads(page: Page): Promise<DailyReads> {
  return apiGet<DailyReads>(page, '/jokes/daily-reads/')
}
