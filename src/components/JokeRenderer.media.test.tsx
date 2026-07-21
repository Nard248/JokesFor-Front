import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JokeRenderer, type JokePayload } from './JokeRenderer'

function imagePayload(overrides: Partial<JokePayload> = {}): JokePayload {
  return {
    format: 'image', text: 'the caption', setup: 'the caption', punchline: '', lines: null,
    media: [{ kind: 'image', url: 'http://x/a.webp', width: 800, height: 600 }],
    ...overrides,
  }
}

describe('image joke rendering', () => {
  it('shows setup and a blurred media box; tap reveals and fires onReveal once', () => {
    const onReveal = vi.fn()
    render(<JokeRenderer payload={imagePayload()} onReveal={onReveal} />)
    expect(screen.getByText('the caption')).toBeInTheDocument()
    const box = screen.getByTestId('media-punchline')
    expect(box.className).toContain('punch-blur')
    expect(box.className).not.toContain('is-revealed')
    fireEvent.click(box)
    expect(screen.getByTestId('media-punchline').className).toContain('is-revealed')
    expect(onReveal).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('media-punchline'))
    expect(onReveal).toHaveBeenCalledTimes(1)
  })

  it('reserves aspect ratio from backend dimensions', () => {
    render(<JokeRenderer payload={imagePayload()} revealed />)
    const box = screen.getByTestId('media-punchline')
    expect(box.style.aspectRatio).toBe('800 / 600')
  })

  it('renders a scroll-snap carousel for multi-image jokes', () => {
    const payload = imagePayload({
      media: [
        { kind: 'image', url: 'http://x/a.webp', width: 800, height: 600 },
        { kind: 'image', url: 'http://x/b.webp', width: 800, height: 600 },
      ],
    })
    render(<JokeRenderer payload={payload} revealed />)
    expect(screen.getAllByRole('img')).toHaveLength(2)
    expect(screen.getByText('1/2')).toBeInTheDocument()
    // Keyboard-focusable scroll container.
    expect((screen.getByTestId('media-punchline') as HTMLElement).tabIndex).toBe(0)
  })

  it('updates the counter as the carousel is scrolled', () => {
    const payload = imagePayload({
      media: [
        { kind: 'image', url: 'http://x/a.webp', width: 800, height: 600 },
        { kind: 'image', url: 'http://x/b.webp', width: 800, height: 600 },
      ],
    })
    render(<JokeRenderer payload={payload} revealed />)
    const box = screen.getByTestId('media-punchline')
    Object.defineProperty(box, 'clientWidth', { value: 400, configurable: true })
    Object.defineProperty(box, 'scrollLeft', { value: 400, configurable: true })
    fireEvent.scroll(box)
    expect(screen.getByText('2/2')).toBeInTheDocument()
  })

  it('locked image joke renders NO img elements and shows the CTA', () => {
    const payload = imagePayload({ media: [{ kind: 'image', width: 800, height: 600 }] })
    render(<JokeRenderer payload={payload} locked />)
    expect(screen.queryAllByRole('img')).toHaveLength(0)
    expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument()
    expect(screen.getByText('the caption')).toBeInTheDocument()
  })

  it('locked CTA label is overridable (anon sign-up wall)', () => {
    render(<JokeRenderer payload={imagePayload()} locked ctaLabel="Sign up free" />)
    expect(screen.getByTestId('unlock-supporter-cta')).toHaveTextContent('Sign up free')
  })
})
