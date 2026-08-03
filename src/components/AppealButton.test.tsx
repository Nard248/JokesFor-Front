import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockMutate = vi.fn()
const mockReset = vi.fn()
let mutationState: { isPending: boolean; isError: boolean; error: unknown }

vi.mock('@/features/appeals', () => ({
  useCreateAppeal: () => ({ mutate: mockMutate, reset: mockReset, ...mutationState }),
}))

import { AppealButton } from './AppealButton'

beforeEach(() => {
  mockMutate.mockReset()
  mockReset.mockReset()
  mutationState = { isPending: false, isError: false, error: undefined }
})

describe('AppealButton', () => {
  it('opens the modal on click', () => {
    render(<AppealButton jokeId={5} />)
    fireEvent.click(screen.getByTestId('appeal-button'))
    expect(screen.getByText('Appeal this decision', { selector: 'h2' })).toBeTruthy()
  })

  it('does not submit an empty reason', () => {
    render(<AppealButton jokeId={5} />)
    fireEvent.click(screen.getByTestId('appeal-button'))
    fireEvent.click(screen.getByTestId('appeal-submit'))
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('posts the reason for a takedown appeal and shows success/closes on 201', () => {
    mockMutate.mockImplementation((_data, opts) => opts?.onSuccess?.())
    render(<AppealButton jokeId={5} />)
    fireEvent.click(screen.getByTestId('appeal-button'))
    fireEvent.change(screen.getByTestId('appeal-reason'), { target: { value: 'This was a mistake.' } })
    fireEvent.click(screen.getByTestId('appeal-submit'))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate.mock.calls[0][0]).toEqual({
      joke_id: 5,
      submission_id: undefined,
      reason_text: 'This was a mistake.',
    })
    // Modal closed + success indicator shown
    expect(screen.queryByText('Appeal this decision', { selector: 'h2' })).toBeNull()
    expect(screen.getByTestId('appeal-submitted')).toBeTruthy()
  })

  it('posts the reason for a rejection appeal with submissionId', () => {
    mockMutate.mockImplementation((_data, opts) => opts?.onSuccess?.())
    render(<AppealButton submissionId={42} />)
    fireEvent.click(screen.getByTestId('appeal-button'))
    fireEvent.change(screen.getByTestId('appeal-reason'), { target: { value: 'Please reconsider.' } })
    fireEvent.click(screen.getByTestId('appeal-submit'))

    expect(mockMutate.mock.calls[0][0]).toEqual({
      joke_id: undefined,
      submission_id: 42,
      reason_text: 'Please reconsider.',
    })
  })

  it('surfaces a 400 duplicate/window error and keeps the modal open', () => {
    mutationState = {
      isPending: false,
      isError: true,
      error: { response: { data: { non_field_errors: ['An appeal is already pending for this joke.'] } } },
    }
    render(<AppealButton jokeId={5} />)
    fireEvent.click(screen.getByTestId('appeal-button'))
    fireEvent.change(screen.getByTestId('appeal-reason'), { target: { value: 'Again please.' } })
    fireEvent.click(screen.getByTestId('appeal-submit'))

    expect(screen.getByTestId('appeal-error').textContent).toBe(
      'An appeal is already pending for this joke.',
    )
    // Still open — mutate didn't call onSuccess since it's mocked to no-op here
    expect(screen.getByText('Appeal this decision', { selector: 'h2' })).toBeTruthy()
  })

  it('falls back to a generic message when the error has no recognizable shape', () => {
    mutationState = { isPending: false, isError: true, error: new Error('network down') }
    render(<AppealButton jokeId={5} />)
    fireEvent.click(screen.getByTestId('appeal-button'))
    fireEvent.change(screen.getByTestId('appeal-reason'), { target: { value: 'x' } })
    fireEvent.click(screen.getByTestId('appeal-submit'))

    expect(screen.getByTestId('appeal-error').textContent).toBe(
      'Could not submit your appeal. Please try again.',
    )
  })
})
