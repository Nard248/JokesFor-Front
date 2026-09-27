import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunityApp } from './CommunityApp'
import type { Snapshot } from './types'

function fixture(): Snapshot {
  return {
    meta: {
      is_demo: true,
      simulated_at: '2026-09-27T12:00:00Z',
      revision: 1,
      sampled_nodes: 4,
      total_members: 17,
      caption: 'Anonymous synthetic people.',
    },
    stats: {
      participants: 1600,
      active_communities: 1,
      emerging_communities: 1,
      interactions: 1234,
      shares: 500,
      bridges: 13,
    },
    viewer: { id: 'demo-you', name: 'Demo you' },
    subjects: [
      {
        id: 'work',
        name: 'Work & meetings',
        description: 'Another meeting about meetings.',
        color: '#c78443',
        emoji: '💼',
        members: 14,
        active_members: 14,
        growth: 3,
        score: 60,
        status: 'active',
        joined: true,
        affinity: 12,
        explanation: 'Independent people engaged with different jokes.',
        activity: [1, 4, 3, 4, 7, 6, 8],
      },
      {
        id: 'space',
        name: 'Space oddities',
        description: 'Humor beyond the atmosphere.',
        color: '#8367c9',
        emoji: '🪐',
        members: 3,
        active_members: 3,
        growth: 1,
        score: 14,
        status: 'forming',
        joined: false,
        affinity: 0,
        explanation: 'Three people independently engaged.',
        activity: [1, 0, 2, 0, 0, 1, 2],
      },
    ],
    graph: {
      nodes: [
        {
          id: 'work',
          kind: 'subject',
          subject_id: 'work',
          label: 'Work & meetings',
          color: '#c78443',
        },
        {
          id: 'space',
          kind: 'subject',
          subject_id: 'space',
          label: 'Space oddities',
          color: '#8367c9',
        },
        { id: 'p1', kind: 'member', subject_id: 'work', label: 'Person 1', color: '#c78443' },
        { id: 'p2', kind: 'member', subject_id: 'space', label: 'Person 2', color: '#8367c9' },
      ],
      edges: [
        { source: 'work', target: 'p1', weight: 8, kind: 'affinity' },
        { source: 'space', target: 'p2', weight: 8, kind: 'affinity' },
      ],
    },
    activity: [
      {
        id: 'e1',
        actor: 'Friend 1',
        kind: 'like',
        subject_id: 'space',
        subject_name: 'Space oddities',
        content_title: 'A moon joke',
        created_at: '2026-09-27T11:00:00Z',
        description: 'Friend 1 enjoyed a moon joke.',
      },
    ],
    content: [
      {
        id: 'c-space',
        subject_id: 'space',
        title: 'A moon joke',
        punchline: 'The atmosphere was missing.',
        format: 'One-liner',
        creator: 'Demo creator',
        likes: 5,
        shares: 2,
        trending_score: 11,
      },
      {
        id: 'c-work',
        subject_id: 'work',
        title: 'Another meeting',
        punchline: 'We agreed to meet again.',
        format: 'One-liner',
        creator: 'Demo creator',
        likes: 9,
        shares: 4,
        trending_score: 17,
      },
    ],
    methodology: {
      half_life_days: 7,
      membership_threshold: 6,
      minimum_members: 5,
      minimum_content: 2,
      weights: { share: 3, like: 2 },
      description: 'Positive affinity with decay.',
    },
  }
}

function response(data: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => data } as Response
}

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(response(fixture()))
  vi.stubGlobal('fetch', fetchMock)
  document.cookie = 'community_lab_csrf=demo-csrf; path=/'
})
afterEach(() => {
  vi.unstubAllGlobals()
})

async function ready() {
  render(<CommunityApp />)
  await screen.findByRole('heading', { name: /Find your kind of funny/ })
}

describe('CommunityApp', () => {
  it('loads actual server aggregates and selects the emerging community for exploration', async () => {
    await ready()
    expect(screen.getByText('1,600')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Space oddities' })).toBeInTheDocument()
    expect(screen.getByText('A moon joke')).toBeInTheDocument()
    expect(
      screen.getByText(/2 sampled people in the full graph · 17 distinct community members/),
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/community-lab/snapshot/')
  })

  it('joins with the isolated CSRF cookie and updates only from the server response', async () => {
    await ready()
    const updated = fixture()
    updated.subjects[1].joined = true
    updated.subjects[1].members = 4
    fetchMock.mockResolvedValueOnce(response(updated))
    await userEvent.click(screen.getByRole('button', { name: 'Join community' }))
    expect(await screen.findByRole('button', { name: 'Leave community' })).toBeInTheDocument()
    const [, request] = fetchMock.mock.calls[1]
    expect(request.headers['X-CSRFToken']).toBe('demo-csrf')
    expect(request.credentials).toBe('same-origin')
    expect(JSON.parse(request.body)).toEqual({ subject_id: 'space', action: 'join' })
    expect(
      screen.getByRole('button', { name: 'Space oddities, 4 members, forming' }),
    ).toBeInTheDocument()
  })

  it('shows mutation failures without pretending membership changed', async () => {
    await ready()
    fetchMock.mockResolvedValueOnce(response({ error: 'The demo is temporarily read-only.' }, 403))
    await userEvent.click(screen.getByRole('button', { name: 'Join community' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The demo is temporarily read-only.')
    expect(screen.getByRole('button', { name: 'Join community' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Leave community' })).not.toBeInTheDocument()
  })

  it('blocks duplicate mutations while a request is pending', async () => {
    await ready()
    let complete!: (value: Response) => void
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          complete = resolve
        }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Join community' }))
    expect(screen.getByRole('button', { name: 'Join community' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Simulate activity' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Share joke: A moon joke' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Advance 7 days' })).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await act(async () => {
      complete(response(fixture()))
    })
    expect(screen.getByRole('button', { name: 'Join community' })).toBeEnabled()
  })

  it('keeps the share event identity after an uncertain failure so retries are idempotent', async () => {
    await ready()
    fetchMock.mockRejectedValueOnce(new TypeError('Connection reset'))
    await userEvent.click(screen.getByRole('button', { name: 'Share joke: A moon joke' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be reached')
    fetchMock.mockResolvedValueOnce(response(fixture()))
    await userEvent.click(screen.getByRole('button', { name: 'Share joke: A moon joke' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    const first = JSON.parse(fetchMock.mock.calls[1][1].body)
    const retry = JSON.parse(fetchMock.mock.calls[2][1].body)
    expect(first.content_id).toBe('c-space')
    expect(first.event_id).toEqual(expect.any(String))
    expect(retry.event_id).toBe(first.event_id)
  })

  it('filters graph subjects using search and supports keyboard selection of a different circle', async () => {
    await ready()
    const graph = screen.getByRole('group', { name: /Community constellation/ })
    const work = within(graph).getByRole('button', { name: 'Work & meetings, 14 members, active' })
    fireEvent.keyDown(work, { key: 'Enter' })
    expect(screen.getByRole('heading', { name: 'Work & meetings' })).toBeInTheDocument()
    expect(screen.getByText('Another meeting')).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: 'Search communities' }), 'space')
    expect(within(graph).queryByRole('button', { name: /Work & meetings/ })).not.toBeInTheDocument()
    expect(within(graph).getByRole('button', { name: /Space oddities/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Joined' }))
    expect(within(graph).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('No communities match this view.')).toBeInTheDocument()
  })

  it('sends time advancement to the backend and renders the returned demo clock', async () => {
    await ready()
    const advanced = fixture()
    advanced.meta.simulated_at = '2026-10-04T12:00:00Z'
    fetchMock.mockResolvedValueOnce(response(advanced))
    await userEvent.click(screen.getByRole('button', { name: 'Advance 7 days' }))
    expect(await screen.findByText(/Demo clock: Oct 4/)).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/community-lab/advance/')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ days: 7 })
  })

  it('provides a connection retry when the initial snapshot fails', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Server down'))
    render(<CommunityApp />)
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be reached')
    await userEvent.click(screen.getByRole('button', { name: 'Retry connection' }))
    expect(
      await screen.findByRole('heading', { name: /Find your kind of funny/ }),
    ).toBeInTheDocument()
  })
})
