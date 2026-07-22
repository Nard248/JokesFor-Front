/**
 * Wave-2 renderer branches: video, GIF autoplay, audio + locked variants.
 * Precedent: JokeRenderer.media.test.tsx (the image branch) — same blur/reveal
 * conventions, extended with native <video>/<audio> elements and the
 * reduced-motion-aware GIF path.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Watch-telemetry coupling: mock the telemetry client so the watchMeta tests
// below can observe trackWatch (same lazy-factory pattern as useDwell.test.tsx).
// useWatchTracking imports trackWatch + flush; JokeRenderer itself only imports
// the erased TelemetrySource type, so nothing else in this file is affected.
const trackWatch = vi.fn()
vi.mock('@/lib/telemetry', () => ({
  trackWatch: (...args: unknown[]) => trackWatch(...args),
  flush: vi.fn(),
}))

import { JokeRenderer, type JokePayload } from './JokeRenderer'

function setReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reduced : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

afterEach(() => {
  vi.restoreAllMocks()
  // @ts-expect-error — remove the stub so tests stay isolated (default: motion allowed).
  delete window.matchMedia
})

function videoPayload(overrides: Partial<JokePayload> = {}): JokePayload {
  return {
    format: 'video', text: 'the caption', setup: 'the caption', punchline: '', lines: null,
    media: [{
      kind: 'video', url: 'http://x/clip.mp4', poster_url: 'http://x/poster.jpg',
      width: 1080, height: 1920, duration_ms: 37000,
    }],
    ...overrides,
  }
}

function audioPayload(overrides: Partial<JokePayload> = {}): JokePayload {
  return {
    format: 'audio', text: 'the caption', setup: 'the caption', punchline: '', lines: null,
    media: [{ kind: 'audio', url: 'http://x/clip.mp3', duration_ms: 8000 }],
    ...overrides,
  }
}

describe('video joke rendering', () => {
  it('unrevealed: shows the poster img under blur, no <video> element', () => {
    render(<JokeRenderer payload={videoPayload()} />)
    const box = screen.getByTestId('media-punchline')
    expect(box.className).toContain('punch-blur')
    expect(box.className).not.toContain('is-revealed')
    const poster = screen.getByRole('img')
    expect(poster).toHaveAttribute('src', 'http://x/poster.jpg')
    expect(screen.queryByTestId('video-player')).not.toBeInTheDocument()
  })

  it('reveal: renders <video controls playsinline> in the same aspect box, fires onReveal once, shows the duration chip', () => {
    const onReveal = vi.fn()
    render(<JokeRenderer payload={videoPayload()} onReveal={onReveal} />)
    const box = screen.getByTestId('media-punchline')
    fireEvent.click(box)
    expect(screen.getByTestId('media-punchline').className).toContain('is-revealed')
    const video = screen.getByTestId('video-player') as HTMLVideoElement
    expect(video.tagName).toBe('VIDEO')
    expect(video.controls).toBe(true)
    expect(video).toHaveAttribute('playsinline')
    expect(video).toHaveAttribute('preload', 'metadata')
    expect(video).toHaveAttribute('poster', 'http://x/poster.jpg')
    expect(video).toHaveAttribute('src', 'http://x/clip.mp4')
    expect(onReveal).toHaveBeenCalledTimes(1)
    expect(screen.getByText('0:37')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('media-punchline'))
    expect(onReveal).toHaveBeenCalledTimes(1)
  })

  it('reserves aspect ratio from backend dimensions, falling back to 16/9', () => {
    render(<JokeRenderer payload={videoPayload()} revealed />)
    expect(screen.getByTestId('media-punchline').style.aspectRatio).toBe('1080 / 1920')

    render(<JokeRenderer payload={videoPayload({ media: [{ kind: 'video', url: 'http://x/clip.mp4' }] })} revealed />)
    expect(screen.getAllByTestId('media-punchline')[1].style.aspectRatio).toBe('16 / 9')
  })

  it('is_gif reveal: renders a muted, looping, autoplaying <video> with no controls', () => {
    const payload = videoPayload({
      media: [{ kind: 'video', url: 'http://x/clip.gif.mp4', poster_url: 'http://x/poster.jpg', width: 480, height: 480, is_gif: true }],
    })
    render(<JokeRenderer payload={payload} revealed />)
    const video = screen.getByTestId('video-player') as HTMLVideoElement
    expect(video.autoplay).toBe(true)
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.controls).toBe(false)
  })

  it('is_gif + prefers-reduced-motion: suppresses autoplay, shows poster + controls instead', () => {
    setReducedMotion(true)
    const payload = videoPayload({
      media: [{ kind: 'video', url: 'http://x/clip.gif.mp4', poster_url: 'http://x/poster.jpg', width: 480, height: 480, is_gif: true }],
    })
    render(<JokeRenderer payload={payload} revealed />)
    const video = screen.getByTestId('video-player') as HTMLVideoElement
    expect(video.autoplay).toBe(false)
    expect(video.muted).toBe(false)
    expect(video.controls).toBe(true)
    expect(video).toHaveAttribute('poster', 'http://x/poster.jpg')
  })

  it('locked video renders NO img/video elements and shows the CTA', () => {
    const payload = videoPayload({ media: [{ kind: 'video', width: 1080, height: 1920 }] })
    render(<JokeRenderer payload={payload} locked />)
    expect(screen.queryAllByRole('img')).toHaveLength(0)
    expect(screen.queryByTestId('video-player')).not.toBeInTheDocument()
    expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument()
    expect(screen.getByText('the caption')).toBeInTheDocument()
  })
})

describe('audio joke rendering', () => {
  it('unrevealed: shows a blurred fixed-height (88px) placeholder, no <audio> element', () => {
    render(<JokeRenderer payload={audioPayload()} />)
    const box = screen.getByTestId('media-punchline')
    expect(box.className).toContain('punch-blur')
    expect(box.className).not.toContain('is-revealed')
    expect(box.style.height).toBe('88px')
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()
  })

  it('reveal: renders <audio controls> full-width, fires onReveal once, shows the duration chip', () => {
    const onReveal = vi.fn()
    render(<JokeRenderer payload={audioPayload()} onReveal={onReveal} />)
    fireEvent.click(screen.getByTestId('media-punchline'))
    const audioEl = screen.getByTestId('audio-player') as HTMLAudioElement
    expect(audioEl.tagName).toBe('AUDIO')
    expect(audioEl.controls).toBe(true)
    expect(audioEl).toHaveAttribute('src', 'http://x/clip.mp3')
    expect(onReveal).toHaveBeenCalledTimes(1)
    expect(screen.getByText('0:08')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('media-punchline'))
    expect(onReveal).toHaveBeenCalledTimes(1)
  })

  it('locked audio (no dims) renders the 88px placeholder and the CTA, never an <audio> element', () => {
    const payload = audioPayload({ media: [{ kind: 'audio' }] })
    render(<JokeRenderer payload={payload} locked />)
    const placeholder = screen.getByTestId('locked-media-placeholder')
    expect(placeholder.style.height).toBe('88px')
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()
    expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument()
  })
})

describe('watch telemetry wiring (watchMeta)', () => {
  // Pins the reveal→mount→effect-attach coupling: useWatchTracking only gets a
  // real jokeId at the render where the player mounts (revealed flips true), so
  // this asserts the whole chain — reveal, <video> mount, listener attach,
  // playback events → trackWatch with watchMeta's identity.
  it('reveal + playback on a video with watchMeta reports trackWatch with the jokeId/source', () => {
    trackWatch.mockClear()
    render(<JokeRenderer payload={videoPayload()} watchMeta={{ jokeId: 1, source: 'feed' }} />)
    fireEvent.click(screen.getByTestId('media-punchline')) // reveal → player mounts

    const video = screen.getByTestId('video-player') as HTMLVideoElement
    Object.defineProperty(video, 'currentTime', { value: 5, configurable: true })
    Object.defineProperty(video, 'duration', { value: 60, configurable: true })
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)

    expect(trackWatch).toHaveBeenCalledTimes(1)
    expect(trackWatch).toHaveBeenCalledWith(1, 'feed', 5_000, 8)
  })

  it('without watchMeta (PreviewPane/detail paths) playback never reports watch telemetry', () => {
    trackWatch.mockClear()
    render(<JokeRenderer payload={videoPayload()} revealed />)
    const video = screen.getByTestId('video-player') as HTMLVideoElement
    Object.defineProperty(video, 'currentTime', { value: 5, configurable: true })
    Object.defineProperty(video, 'duration', { value: 60, configurable: true })
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)
    expect(trackWatch).not.toHaveBeenCalled()
  })
})
