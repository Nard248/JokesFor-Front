import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { OtpInput } from './otp-input'

function Harness({ onComplete }: { onComplete?: (v: string) => void }) {
  const [v, setV] = useState('')
  return <OtpInput value={v} onChange={setV} onComplete={onComplete} />
}

test('typing digits advances and fills the code', async () => {
  const user = userEvent.setup()
  const onComplete = vi.fn()
  render(<Harness onComplete={onComplete} />)
  const boxes = screen.getAllByRole('textbox')
  expect(boxes).toHaveLength(6)
  await user.click(boxes[0])
  await user.keyboard('135790')
  expect(onComplete).toHaveBeenCalledWith('135790')
})

test('non-digits are rejected', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  const boxes = screen.getAllByRole('textbox') as HTMLInputElement[]
  await user.click(boxes[0])
  await user.keyboard('a')
  expect(boxes[0].value).toBe('')
})

test('pasting the whole code distributes across boxes', async () => {
  const user = userEvent.setup()
  const onComplete = vi.fn()
  render(<Harness onComplete={onComplete} />)
  const boxes = screen.getAllByRole('textbox') as HTMLInputElement[]
  await user.click(boxes[0])
  await user.paste('135790')
  expect(boxes[5].value).toBe('0')
  expect(onComplete).toHaveBeenCalledWith('135790')
})
