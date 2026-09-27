import { useRef } from 'react'
import { render, fireEvent } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
const trackWatch = vi.fn()
const flush = vi.fn()
let eligible = true
const listeners = new Set<() => void>()
vi.mock('@/lib/telemetry', () => ({ trackWatch: (...args: unknown[]) => trackWatch(...args), flush: () => flush() }))
vi.mock('./session', () => ({
  getTelemetrySession: () => ({ eligible }),
  subscribeTelemetrySession: (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb) },
}))
import { useWatchTracking } from './useWatchTracking'
function Player({ id = 42 }: { id?: number }) {
  const ref = useRef<HTMLVideoElement>(null)
  useWatchTracking(ref, id, 'feed')
  return <video ref={ref} data-testid="player" />
}
let nowMs = 0
beforeEach(() => { nowMs = 0; eligible = true; trackWatch.mockClear(); flush.mockClear(); vi.spyOn(performance, 'now').mockImplementation(() => nowMs) })
afterEach(() => vi.restoreAllMocks())
const player = () => {
  const view = render(<Player />)
  const el = view.getByTestId('player') as HTMLVideoElement
  Object.defineProperty(el, 'duration', { configurable: true, value: 100 })
  return { ...view, el }
}
const changeSession = (value: boolean) => { eligible = value; listeners.forEach((cb) => cb()) }

describe('elapsed media playback', () => {
  it('sends segment deltas after repeated play and pause instead of cumulative time', () => {
    const { el } = player()
    fireEvent.playing(el)
    nowMs = 2000
    fireEvent.pause(el)
    nowMs = 10000
    fireEvent.playing(el)
    nowMs = 13000
    fireEvent.pause(el)
    expect(trackWatch.mock.calls.map((call) => call[2])).toEqual([2000, 3000])
  })
  it('does not count seeking to the end as playback', () => {
    const { el } = player()
    el.currentTime = 99
    fireEvent.timeUpdate(el)
    fireEvent.pause(el)
    expect(trackWatch).not.toHaveBeenCalled()
  })
  it('excludes time spent seeking and buffering', () => {
    const { el } = player()
    fireEvent.playing(el)
    nowMs = 1000
    fireEvent.seeking(el)
    nowMs = 5000
    fireEvent.seeked(el)
    fireEvent.playing(el)
    nowMs = 6500
    fireEvent.waiting(el)
    nowMs = 10000
    fireEvent.playing(el)
    nowMs = 11000
    fireEvent.pause(el)
    expect(trackWatch.mock.calls.reduce((sum, call) => sum + call[2], 0)).toBe(3500)
  })
  it('counts replay time and never duplicates on ended, pause or unmount', () => {
    const { el, unmount } = player()
    fireEvent.playing(el)
    nowMs = 1000
    fireEvent.ended(el)
    fireEvent.pause(el)
    el.currentTime = 0
    fireEvent.playing(el)
    nowMs = 2000
    fireEvent.pause(el)
    unmount()
    expect(trackWatch.mock.calls.map((call) => call[2])).toEqual([1000, 1000])
  })
  it('flushes the last sample on pagehide after enqueueing', () => {
    const { el, unmount } = player()
    fireEvent.playing(el)
    nowMs = 2500
    window.dispatchEvent(new Event('pagehide'))
    unmount()
    expect(trackWatch).toHaveBeenCalledTimes(1)
    expect(trackWatch.mock.calls[0][2]).toBe(2500)
    expect(flush.mock.invocationCallOrder[0]).toBeGreaterThan(trackWatch.mock.invocationCallOrder[0])
  })
  it('discards pre-consent playback and resets an in-progress sample on account change', () => {
    eligible = false
    const { el } = player()
    fireEvent.playing(el)
    nowMs = 5000
    changeSession(true)
    nowMs = 6000
    changeSession(true) // same eligibility, different account session
    nowMs = 8000
    fireEvent.pause(el)
    expect(trackWatch.mock.calls.map((call) => call[2])).toEqual([2000])
  })
  it('omits completion rather than interpreting a seek position as watched coverage', () => {
    const { el } = player()
    fireEvent.playing(el)
    nowMs = 1000
    el.currentTime = 99
    fireEvent.pause(el)
    expect(trackWatch).toHaveBeenCalledWith(42, 'feed', 1000)
  })
})
