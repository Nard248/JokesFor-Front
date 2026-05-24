import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TagPicker } from './TagPicker'
import type { Taxon } from '@/features/create'

const options: Taxon[] = [
  { id: 1, slug: 'tech', name: 'Technology' },
  { id: 2, slug: 'animals', name: 'Animals' },
  { id: 3, slug: 'food', name: 'Food' },
]

describe('TagPicker', () => {
  it('renders all options initially', () => {
    render(
      <TagPicker label="Themes" options={options} selected={[]} onChange={vi.fn()} />
    )
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('Animals')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
  })

  it('filters options by typed text (case-insensitive)', async () => {
    const user = userEvent.setup()
    render(
      <TagPicker label="Themes" options={options} selected={[]} onChange={vi.fn()} />
    )
    const input = screen.getByRole('textbox')
    await user.type(input, 'tech')
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.queryByText('Animals')).not.toBeInTheDocument()
    expect(screen.queryByText('Food')).not.toBeInTheDocument()
  })

  it('calls onChange with added slug when an option is clicked', () => {
    const onChange = vi.fn()
    render(
      <TagPicker label="Themes" options={options} selected={[]} onChange={onChange} />
    )
    fireEvent.click(screen.getByText('Technology'))
    expect(onChange).toHaveBeenCalledWith(['tech'])
  })

  it('calls onChange with removed slug when a selected option chip is clicked', () => {
    const onChange = vi.fn()
    render(
      <TagPicker label="Themes" options={options} selected={['tech']} onChange={onChange} />
    )
    // Click the × remove button on the selected chip
    const removeButton = screen.getByRole('button', { name: /remove technology/i })
    fireEvent.click(removeButton)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('removes a tag via the chip × button', () => {
    const onChange = vi.fn()
    render(
      <TagPicker label="Themes" options={options} selected={['tech', 'animals']} onChange={onChange} />
    )
    // Find remove button for 'tech' chip
    const removeButtons = screen.getAllByRole('button', { name: /remove technology/i })
    fireEvent.click(removeButtons[0])
    expect(onChange).toHaveBeenCalledWith(['animals'])
  })

  it('shows selected items as chips', () => {
    render(
      <TagPicker label="Themes" options={options} selected={['tech']} onChange={vi.fn()} />
    )
    // Selected chip should appear in the chips area
    const chips = screen.getAllByText('Technology')
    expect(chips.length).toBeGreaterThanOrEqual(1)
  })
})
