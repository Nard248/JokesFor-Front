import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'

const trackDwell = vi.fn()
vi.mock('@/lib/telemetry', () => ({
  trackDwell: (...args: unknown[]) => trackDwell(...args),
}))

import { useDwell } from './useDwell'

// Controllable IntersectionObserver double — captures the callback so a test
// can drive viewport enter/leave synchronously.
let lastCallback: IntersectionObserverCallback | null = null
const observe = vi.fn()
const disconnect = vi.fn()

class MockIO {
  constructor(cb: IntersectionObserverCallback) {
    lastCallback = cb
  }
  observe = observe
  disconnect = disconnect
  unobserve = vi.fn()
  takeRecords = vi.fn()
}

function emit(ratio: number) {
  lastCallback?.(
    [{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  )
}

function Card({ id, source = 'feed' as const }: { id?: number; source?: 'feed' }) {
  const ref = useDwell<HTMLDivElement>(id, source, { trackScroll: false })
  return <div ref={ref}>card</div>
}

// performance.now() is driven off a manual clock so accumulation is deterministic.
let nowMs = 0

beforeEach(() => {
  trackDwell.mockClear()
  observe.mockClear()
  disconnect.mockClear()
  lastCallback = null
  nowMs = 0
  vi.stubGlobal('IntersectionObserver', MockIO as unknown as typeof IntersectionObserver)
  vi.spyOn(performance, 'now').mockImplementation(() => nowMs)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useDwell', () => {
  it('accumulates visible time and flushes on viewport leave', () => {
    render(<Card id={42} />)
    expect(observe).toHaveBeenCalledTimes(1)

    emit(0.6) // enters viewport — start counting at t=0
    nowMs = 3_000
    emit(0) // leaves viewport — bank 3000ms and flush

    expect(trackDwell).toHaveBeenCalledTimes(1)
    expect(trackDwell).toHaveBeenCalledWith(42, 'feed', 3_000, undefined)
  })

  it('passes the raw accumulated ms through (sub-1s gating lives in trackDwell)', () => {
    render(<Card id={42} />)
    emit(0.6) // enter at t=0
    nowMs = 400
    emit(0) // leave at t=400 — hook flushes the real 400ms; trackDwell drops it.
    expect(trackDwell).toHaveBeenCalledWith(42, 'feed', 400, undefined)
  })

  it('pauses while the tab is hidden and resumes when visible', () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get')
    visibility.mockReturnValue('visible')

    render(<Card id={7} />)
    emit(0.7) // start at t=0
    nowMs = 1_000

    // Tab hidden → pause (banks 1000ms so far).
    visibility.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    nowMs = 5_000 // time passes while hidden — must NOT count

    // Tab visible again → resume.
    visibility.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    nowMs = 5_500 // +500ms visible

    emit(0) // leave viewport → flush. Total visible = 1000 + 500 = 1500ms.
    expect(trackDwell).toHaveBeenCalledWith(7, 'feed', 1_500, undefined)
  })

  it('flushes accumulated time on unmount', () => {
    const { unmount } = render(<Card id={9} />)
    emit(0.8)
    nowMs = 2_500
    unmount()
    expect(trackDwell).toHaveBeenCalledWith(9, 'feed', 2_500, undefined)
  })

  it('is a no-op without a valid joke id', () => {
    render(<Card id={undefined} />)
    expect(observe).not.toHaveBeenCalled()
    emit(0.9)
    expect(trackDwell).not.toHaveBeenCalled()
  })
})
