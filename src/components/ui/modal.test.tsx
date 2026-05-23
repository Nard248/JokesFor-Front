import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { Modal } from './modal'

test('renders children when open', () => {
  render(<Modal open onClose={() => {}} title="Change format?"><p>body</p></Modal>)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByText('Change format?')).toBeInTheDocument()
})

test('does not render when closed', () => {
  render(<Modal open={false} onClose={() => {}} title="x"><p>body</p></Modal>)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('Escape calls onClose', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<Modal open onClose={onClose} title="x"><p>body</p></Modal>)
  await user.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledOnce()
})

test('focuses the first focusable element on open', () => {
  render(<Modal open onClose={() => {}} title="t"><button>First</button><button>Second</button></Modal>)
  expect(screen.getByText('First')).toHaveFocus()
})

test('backdrop mousedown calls onClose', () => {
  const onClose = vi.fn()
  render(<Modal open onClose={onClose} title="t"><p>body</p></Modal>)
  fireEvent.mouseDown(screen.getByRole('presentation'))
  expect(onClose).toHaveBeenCalled()
})

test('restores focus to the trigger when closed', async () => {
  const user = userEvent.setup()
  function Harness() {
    const [open, setOpen] = React.useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>Open</button>
        <Modal open={open} onClose={() => setOpen(false)} title="t"><button>Inside</button></Modal>
      </>
    )
  }
  render(<Harness />)
  const openBtn = screen.getByText('Open')
  openBtn.focus()
  await user.click(openBtn)
  expect(screen.getByText('Inside')).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(screen.getByText('Open')).toHaveFocus()
})
