import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'

const trackImpression = vi.fn()
vi.mock('@/lib/telemetry', () => ({
  trackImpression: (...args: unknown[]) => trackImpression(...args),
}))

import { useImpression } from './useImpression'

// Controllable IntersectionObserver double — captures the callback so a test
// can drive intersection events synchronously.
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
  const ref = useImpression<HTMLDivElement>(id, source)
  return <div ref={ref}>card</div>
}

beforeEach(() => {
  vi.useFakeTimers()
  trackImpression.mockClear()
  observe.mockClear()
  disconnect.mockClear()
  lastCallback = null
  vi.stubGlobal('IntersectionObserver', MockIO as unknown as typeof IntersectionObserver)
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useImpression', () => {
  it('fires once after the element is >=50% visible for ~1s', () => {
    render(<Card id={42} />)
    expect(observe).toHaveBeenCalledTimes(1)
    emit(0.6)
    expect(trackImpression).not.toHaveBeenCalled() // dwell not elapsed
    vi.advanceTimersByTime(1000)
    expect(trackImpression).toHaveBeenCalledTimes(1)
    expect(trackImpression).toHaveBeenCalledWith(42, 'feed')
  })

  it('does not fire if visibility drops before the dwell elapses', () => {
    render(<Card id={42} />)
    emit(0.6)
    vi.advanceTimersByTime(500)
    emit(0) // scrolled away
    vi.advanceTimersByTime(1000)
    expect(trackImpression).not.toHaveBeenCalled()
  })

  it('only fires once even if it re-enters the viewport', () => {
    render(<Card id={42} />)
    emit(0.6)
    vi.advanceTimersByTime(1000)
    emit(0)
    emit(0.9)
    vi.advanceTimersByTime(1000)
    expect(trackImpression).toHaveBeenCalledTimes(1)
  })

  it('is a no-op without a valid joke id', () => {
    render(<Card id={undefined} />)
    expect(observe).not.toHaveBeenCalled()
    emit(0.9)
    vi.advanceTimersByTime(2000)
    expect(trackImpression).not.toHaveBeenCalled()
  })
})
