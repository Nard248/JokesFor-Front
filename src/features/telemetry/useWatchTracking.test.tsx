import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRef } from 'react'
import { render, fireEvent } from '@testing-library/react'

const trackWatch = vi.fn()
vi.mock('@/lib/telemetry', () => ({
  trackWatch: (...args: unknown[]) => trackWatch(...args),
}))

import { useWatchTracking } from './useWatchTracking'

function setMediaState(el: HTMLVideoElement, currentTime: number, duration: number) {
  Object.defineProperty(el, 'currentTime', { value: currentTime, configurable: true })
  Object.defineProperty(el, 'duration', { value: duration, configurable: true })
}

// A harness that mirrors how JokeRenderer wires the hook: a ref shared between
// the hook call and the <video> element, jokeId/source passed straight
// through (JokeRenderer's own "undefined until revealed" gating is what
// re-triggers the effect in real usage; here the video is present from the
// first render, same as useDwell's test harness).
function Video({ jokeId, source = 'feed' as const }: { jokeId?: number; source?: 'feed' }) {
  const ref = useRef<HTMLVideoElement>(null)
  useWatchTracking(ref, jokeId, source)
  return <video ref={ref} data-testid="video" />
}

beforeEach(() => {
  trackWatch.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useWatchTracking', () => {
  it('sends accumulated watch time on pause', () => {
    const { getByTestId } = render(<Video jokeId={42} />)
    const video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 5.2, 60)
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)

    expect(trackWatch).toHaveBeenCalledTimes(1)
    expect(trackWatch).toHaveBeenCalledWith(42, 'feed', 5200, 9)
  })

  it('sends accumulated watch time on ended', () => {
    const { getByTestId } = render(<Video jokeId={7} />)
    const video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 60, 60)
    fireEvent.timeUpdate(video)
    fireEvent.ended(video)

    expect(trackWatch).toHaveBeenCalledTimes(1)
    expect(trackWatch).toHaveBeenCalledWith(7, 'feed', 60_000, 100)
  })

  it('sends unsent progress on unmount when the delta is >= 500ms', () => {
    const { getByTestId, unmount } = render(<Video jokeId={9} />)
    const video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 3, 60)
    fireEvent.timeUpdate(video)
    unmount()

    expect(trackWatch).toHaveBeenCalledTimes(1)
    expect(trackWatch).toHaveBeenCalledWith(9, 'feed', 3_000, 5)
  })

  it('does NOT send on unmount when the unsent delta is < 500ms', () => {
    const { getByTestId, unmount } = render(<Video jokeId={9} />)
    const video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 0.3, 60)
    fireEvent.timeUpdate(video)
    unmount()

    expect(trackWatch).not.toHaveBeenCalled()
  })

  it('omits watch_pct when duration is 0, NaN, or Infinity', () => {
    const { getByTestId, rerender } = render(<Video jokeId={1} />)
    let video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 2, 0)
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)
    expect(trackWatch).toHaveBeenLastCalledWith(1, 'feed', 2_000, undefined)

    rerender(<Video jokeId={2} />)
    video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 2, NaN)
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)
    expect(trackWatch).toHaveBeenLastCalledWith(2, 'feed', 2_000, undefined)

    rerender(<Video jokeId={3} />)
    video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 2, Infinity)
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)
    expect(trackWatch).toHaveBeenLastCalledWith(3, 'feed', 2_000, undefined)
  })

  it('does not send twice for the same accumulated value', () => {
    const { getByTestId } = render(<Video jokeId={42} />)
    const video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 5, 60)
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)
    expect(trackWatch).toHaveBeenCalledTimes(1)

    // Paused again with no further progress — must not resend.
    fireEvent.pause(video)
    expect(trackWatch).toHaveBeenCalledTimes(1)
  })

  it('sends a second sample once new progress accrues after a pause', () => {
    const { getByTestId } = render(<Video jokeId={42} />)
    const video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 5, 60)
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)
    expect(trackWatch).toHaveBeenCalledTimes(1)

    setMediaState(video, 10, 60)
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)
    expect(trackWatch).toHaveBeenCalledTimes(2)
    expect(trackWatch).toHaveBeenLastCalledWith(42, 'feed', 10_000, 17)
  })

  it('is a no-op without a valid joke id', () => {
    const { getByTestId } = render(<Video jokeId={undefined} />)
    const video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 5, 60)
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)
    expect(trackWatch).not.toHaveBeenCalled()
  })

  it('cleans up listeners on unmount (no further sends after teardown)', () => {
    const { getByTestId, unmount } = render(<Video jokeId={42} />)
    const video = getByTestId('video') as HTMLVideoElement
    setMediaState(video, 5, 60)
    fireEvent.timeUpdate(video)
    unmount()
    trackWatch.mockClear()

    // Dispatch further events on the now-unmounted element — must be inert.
    setMediaState(video, 20, 60)
    fireEvent.timeUpdate(video)
    fireEvent.pause(video)
    expect(trackWatch).not.toHaveBeenCalled()
  })
})
