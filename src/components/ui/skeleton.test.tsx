import { render } from '@testing-library/react'
import { Skeleton } from './skeleton'

test('renders with merged className and a11y hint', () => {
  const { container } = render(<Skeleton className="h-24 rounded-xl" />)
  const el = container.firstChild as HTMLElement
  expect(el.className).toMatch(/animate-pulse/)
  expect(el.className).toMatch(/h-24/)
  expect(el).toHaveAttribute('aria-hidden', 'true')
})
