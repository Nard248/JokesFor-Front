import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FormatTile } from './FormatTile'
import type { FormatRule } from '@/features/create'

const mockFormat: FormatRule = {
  id: 1,
  slug: 'oneliner',
  name: 'One-liner',
  description: 'A single punchy line.',
  required_fields: ['text'],
  forbidden_fields: [],
  constraints: {},
}

describe('FormatTile', () => {
  it('renders format name, description, and example text', () => {
    render(
      <FormatTile
        format={mockFormat}
        example="Why did the chicken cross the road?"
        onClick={vi.fn()}
      />
    )
    expect(screen.getByText('One-liner')).toBeInTheDocument()
    expect(screen.getByText('A single punchy line.')).toBeInTheDocument()
    expect(screen.getByText('Why did the chicken cross the road?')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<FormatTile format={mockFormat} example="Example" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick when Enter key is pressed', () => {
    const onClick = vi.fn()
    render(<FormatTile format={mockFormat} example="Example" onClick={onClick} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick when Space key is pressed', () => {
    const onClick = vi.fn()
    render(<FormatTile format={mockFormat} example="Example" onClick={onClick} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
