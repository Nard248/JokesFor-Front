import { render, screen } from '@testing-library/react'

test('vitest + RTL harness works', () => {
  render(<div>hello</div>)
  expect(screen.getByText('hello')).toBeInTheDocument()
})
