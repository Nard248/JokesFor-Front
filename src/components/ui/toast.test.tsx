import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './toast'

function Trigger() {
  const { toast } = useToast()
  return <button onClick={() => toast({ message: 'Sent for review.' })}>fire</button>
}

test('shows a toast when triggered', async () => {
  const user = userEvent.setup()
  render(<ToastProvider><Trigger /></ToastProvider>)
  await user.click(screen.getByText('fire'))
  expect(screen.getByText('Sent for review.')).toBeInTheDocument()
})

test('useToast throws outside provider', () => {
  function Bad() { useToast(); return null }
  expect(() => render(<Bad />)).toThrow(/ToastProvider/)
})
