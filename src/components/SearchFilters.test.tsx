import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchFilters } from './SearchFilters'

describe('SearchFilters — query sync', () => {
  it('adopts a new external query (e.g. filters cleared by the parent)', () => {
    const onChange = vi.fn()
    const { rerender } = render(<SearchFilters filters={{ q: 'cats' }} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Search for jokes...') as HTMLInputElement
    expect(input.value).toBe('cats')

    rerender(<SearchFilters filters={{}} onChange={onChange} />)
    expect(input.value).toBe('')

    rerender(<SearchFilters filters={{ q: 'dogs' }} onChange={onChange} />)
    expect(input.value).toBe('dogs')
  })

  it('keeps local typing while the parent query is unchanged', () => {
    const onChange = vi.fn()
    const { rerender } = render(<SearchFilters filters={{ q: 'cats' }} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Search for jokes...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'cats and dogs' } })
    rerender(<SearchFilters filters={{ q: 'cats' }} onChange={onChange} />)
    expect(input.value).toBe('cats and dogs')
  })
})
