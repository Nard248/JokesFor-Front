import type { AgeRating } from '../types'
import { RadioGroup } from '@/components/ui/radio-group'

interface AgeRatingRadioProps {
  options: AgeRating[]
  value: string | null
  onChange: (slug: string) => void
}

export function AgeRatingRadio({ options, value, onChange }: AgeRatingRadioProps) {
  const radioOptions = options.map((opt) => ({
    value: opt.slug,
    label: opt.name,
    description: opt.min_age !== undefined && opt.min_age !== null
      ? `Minimum age: ${opt.min_age}`
      : undefined,
  }))

  return (
    <RadioGroup
      name="age-rating"
      label="Age rating"
      value={value}
      onChange={onChange}
      options={radioOptions}
    />
  )
}
