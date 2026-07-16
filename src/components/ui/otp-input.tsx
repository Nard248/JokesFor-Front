import * as React from 'react'
import { cn } from '@/lib/utils'

export interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  invalid?: boolean
  describedById?: string
}

export function OtpInput({
  value, onChange, onComplete, length = 6, disabled, invalid, describedById,
}: OtpInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([])

  React.useEffect(() => { refs.current[0]?.focus() }, [])

  const chars = Array.from({ length }, (_, k) => value[k] ?? '')

  const emit = (next: string) => {
    const joined = next.slice(0, length)
    onChange(joined)
    if (joined.length === length) onComplete?.(joined)
    return joined
  }

  const setAt = (i: number, d: string) => {
    const arr = Array.from({ length }, (_, k) => value[k] ?? '')
    arr[i] = d
    // Re-pack to a contiguous prefix (OTP is always typed/pasted left-to-right).
    return emit(arr.join('').replace(/\s/g, ''))
  }

  const handleChange = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1)
    if (!d) return
    setAt(i, d)
    if (i < length - 1) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (chars[i]) setAt(i, '')
      else if (i > 0) { refs.current[i - 1]?.focus(); setAt(i - 1, '') }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    emit(pasted)
    refs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div role="group" aria-label="Verification code" className="flex gap-1.5 sm:gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={chars[i]}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedById}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            // Boxes shrink on phones so six of them never overflow a 375px card;
            // full size from the `sm` breakpoint up. Height stays ≥44px tap target.
            'w-10 h-12 text-xl sm:w-12 sm:h-14 sm:text-2xl text-center font-semibold rounded-2xl border bg-white outline-none transition-colors',
            'border-[#E9E8E7] focus:border-[#6A1CF6] focus:ring-2 focus:ring-[#6A1CF6]/20',
            invalid && 'border-destructive',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
      ))}
    </div>
  )
}
