import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockUseTodaysJoke = vi.fn()
const mockUseHistory = vi.fn()
vi.mock('@/features/daily-joke', () => ({
  useTodaysJoke: () => mockUseTodaysJoke(),
  useDailyJokeHistory: () => mockUseHistory(),
}))

// JotdHero pulls in save/telemetry hooks — stub them so the page renders without
// query/router-dependent side effects.
vi.mock('@/features/saved-jokes', () => ({ useSaveJoke: () => ({ mutate: vi.fn() }) }))
vi.mock('@/features/telemetry', () => ({ recordShare: vi.fn(), useDwell: () => ({ current: null }) }))
vi.mock('@/lib/telemetry', () => ({ trackReveal: vi.fn() }))

import { DailyJokePage } from './DailyJokePage'

const TODAY = {
  joke: { id: 5, text: 'A one-liner about mornings.', setup: null, punchline: null },
  date: '2026-07-13',
  issue_label: 'Vol. I · No. 042',
}
const TODAY_MEDIA = {
  joke: {
    id: 6,
    text: '',
    setup: 'A cat wearing sunglasses',
    punchline: null,
    media: [{ kind: 'image', url: 'https://cdn.example.com/daily-6.jpg', width: 800, height: 600 }],
  },
  date: '2026-07-13',
  issue_label: 'Vol. I · No. 043',
}
const TODAY_VIDEO = {
  joke: {
    id: 7,
    text: '',
    setup: 'A dog skateboarding',
    punchline: null,
    media: [{
      kind: 'video',
      url: 'https://cdn.example.com/daily-7.mp4',
      poster_url: 'https://cdn.example.com/daily-7-poster.jpg',
      width: 1280,
      height: 720,
    }],
  },
  date: '2026-07-13',
  issue_label: 'Vol. I · No. 044',
}
const TODAY_AUDIO = {
  joke: {
    id: 8,
    text: '',
    setup: 'A very punny podcast clip',
    punchline: null,
    media: [{ kind: 'audio', url: 'https://cdn.example.com/daily-8.mp3' }],
  },
  date: '2026-07-13',
  issue_label: 'Vol. I · No. 045',
}
const HISTORY = {
  results: [
    { joke: { id: 1, text: 'History joke one.' }, date: '2026-07-12' },
    { joke: { id: 2, text: 'History joke two.' }, date: '2026-07-11' },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DailyJokePage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseTodaysJoke.mockReturnValue({ data: TODAY, isLoading: false })
  mockUseHistory.mockReturnValue({ data: HISTORY, isLoading: false })
})

describe('DailyJokePage', () => {
  it('renders the REAL issue_label from the /daily-jokes/today/ response', () => {
    renderPage()
    // The label is now data-driven ("Daily · " + the response's issue_label),
    // not the previously hardcoded "Daily · Vol. I · No. 042" literal.
    expect(screen.getByText('Daily · Vol. I · No. 042')).toBeDefined()
  })

  it('falls back to a plain "Daily" label when issue_label is absent (no fabricated number)', () => {
    mockUseTodaysJoke.mockReturnValue({ data: { ...TODAY, issue_label: undefined }, isLoading: false })
    renderPage()
    expect(screen.getByText('Daily')).toBeDefined()
    // No fabricated "No. NNN" edition number anywhere.
    expect(screen.queryByText(/No\.\s*\d/)).toBeNull()
  })

  it('history tiles keep the real weekday but drop the fabricated "No. NNN" edition number', () => {
    // Use a today label without a "No." so any "No. NNN" match can only come
    // from the (now-removed) history-tile fabrication.
    mockUseTodaysJoke.mockReturnValue({ data: { ...TODAY, issue_label: 'Vol. II' }, isLoading: false })
    renderPage()
    expect(screen.getByText('History joke one.', { exact: false })).toBeDefined()
    expect(screen.queryByText(/No\.\s*\d/)).toBeNull()
  })

  it('renders the media hero (Image eyebrow + img) when the daily joke carries media', () => {
    mockUseTodaysJoke.mockReturnValue({ data: TODAY_MEDIA, isLoading: false })
    renderPage()
    expect(screen.getByText('Image')).toBeDefined()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/daily-6.jpg')
  })

  it('video-media daily joke renders an img with the POSTER url, never the raw mp4 url', () => {
    mockUseTodaysJoke.mockReturnValue({ data: TODAY_VIDEO, isLoading: false })
    renderPage()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/daily-7-poster.jpg')
    expect(img.getAttribute('src')).not.toMatch(/\.mp4$/)
  })

  it('audio-media daily joke renders no img and shows the static audio placeholder', () => {
    mockUseTodaysJoke.mockReturnValue({ data: TODAY_AUDIO, isLoading: false })
    renderPage()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('daily-audio-placeholder')).toBeInTheDocument()
  })
})
