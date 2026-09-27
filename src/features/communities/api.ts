import type { Snapshot } from './types'

const base = '/api/v1/community-lab/'

export async function communityRequest(
  endpoint: string,
  body?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Snapshot> {
  const csrf = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('community_lab_csrf='))
    ?.slice('community_lab_csrf='.length)
  let response: Response
  try {
    response = await fetch(`${base}${endpoint}/`, {
      method: body ? 'POST' : 'GET',
      credentials: 'same-origin',
      signal,
      headers: body
        ? {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrf ? decodeURIComponent(csrf) : '',
          }
        : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new Error(
      'The community server could not be reached. Check the connection and try again.',
    )
  }
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object'
        ? 'error' in payload
          ? payload.error
          : 'detail' in payload
            ? payload.detail
            : null
        : null
    throw new Error(
      typeof detail === 'string'
        ? detail
        : `The server could not complete this action (${response.status}). Try again.`,
    )
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('subjects' in payload) ||
    !('graph' in payload)
  ) {
    throw new Error(
      'The server returned an unexpected response. Reload the community data to try again.',
    )
  }
  return payload as Snapshot
}
