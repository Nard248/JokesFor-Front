import { cn } from '@/lib/utils'

export interface RadioOption { value: string; label: string; description?: string }

export interface RadioGroupProps {
  name: string
  value: string | null
  onChange: (value: string) => void
  options: RadioOption[]
  label: string
  className?: string
}

export function RadioGroup({ name, value, onChange, options, label, className }: RadioGroupProps) {
  return (
    <fieldset className={cn('flex flex-col gap-2', className)} role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <label
            key={opt.value}
            className={cn(
              'flex items-start gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors',
              checked ? 'border-[#6A1CF6] bg-[#F7F0FF]' : 'border-[#E9E8E7] bg-white hover:border-[#AC8EFF]',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="mt-1 accent-[#6A1CF6]"
            />
            <span className="flex flex-col">
              <span className="font-medium text-[#2E2F2F]">{opt.label}</span>
              {opt.description && <span className="text-sm text-[#6B7280]">{opt.description}</span>}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
