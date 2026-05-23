import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RadioGroup } from './radio-group'

const opts = [
  { value: 'kid-safe', label: 'Kid-safe' },
  { value: 'teen', label: 'Teen' },
]

test('renders options and reflects selection', () => {
  render(<RadioGroup name="age" value="teen" onChange={() => {}} options={opts} label="Age rating" />)
  expect(screen.getByRole('radio', { name: 'Teen' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Kid-safe' })).not.toBeChecked()
})

test('fires onChange with the selected value', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<RadioGroup name="age" value="teen" onChange={onChange} options={opts} label="Age rating" />)
  await user.click(screen.getByRole('radio', { name: 'Kid-safe' }))
  expect(onChange).toHaveBeenCalledWith('kid-safe')
})
