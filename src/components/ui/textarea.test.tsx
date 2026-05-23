import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Textarea } from './textarea'

test('forwards onChange when the user types', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<Textarea aria-label="joke" onChange={onChange} />)
  await user.type(screen.getByLabelText('joke'), 'hi')
  expect(onChange).toHaveBeenCalled()
})

test('applies pill variant classes', () => {
  render(<Textarea aria-label="joke" variant="pill" />)
  expect(screen.getByLabelText('joke').className).toMatch(/rounded-\[18px\]/)
})
