import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AgeRatingRadio } from './AgeRatingRadio'
import type { AgeRating } from '@/features/create'

const options: AgeRating[] = [
  { id: 1, slug: 'all', name: 'All ages', min_age: 0 },
  { id: 2, slug: 'teen', name: 'Teen', min_age: 13 },
  { id: 3, slug: 'adult', name: 'Adult', min_age: 18 },
]

describe('AgeRatingRadio', () => {
  it('renders all age rating options', () => {
    render(
      <AgeRatingRadio options={options} value={null} onChange={vi.fn()} />
    )
    expect(screen.getByText('All ages')).toBeInTheDocument()
    expect(screen.getByText('Teen')).toBeInTheDocument()
    expect(screen.getByText('Adult')).toBeInTheDocument()
  })

  it('renders with the correct label "Age rating"', () => {
    render(
      <AgeRatingRadio options={options} value={null} onChange={vi.fn()} />
    )
    expect(screen.getByRole('radiogroup', { name: /age rating/i })).toBeInTheDocument()
  })

  it('calls onChange with slug when an option is selected', () => {
    const onChange = vi.fn()
    render(
      <AgeRatingRadio options={options} value={null} onChange={onChange} />
    )
    const teenRadio = screen.getByRole('radio', { name: /teen/i })
    fireEvent.click(teenRadio)
    expect(onChange).toHaveBeenCalledWith('teen')
  })

  it('checks the radio whose value matches the current value', () => {
    render(
      <AgeRatingRadio options={options} value="adult" onChange={vi.fn()} />
    )
    expect(screen.getByRole('radio', { name: /adult/i })).toBeChecked()
  })
})
