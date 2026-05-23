import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textareaVariants = cva(
  "placeholder:text-muted-foreground border-input w-full min-w-0 border bg-transparent text-base transition-[color,box-shadow] outline-none resize-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'rounded-md px-3 py-2 shadow-xs focus-visible:border-ring focus-visible:ring-ring/50',
        pill: 'rounded-[18px] px-5 py-4 bg-white border-[#E9E8E7] focus-visible:border-[#6A1CF6] focus-visible:ring-[#6A1CF6]/20',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface TextareaProps
  extends React.ComponentProps<'textarea'>, VariantProps<typeof textareaVariants> {
  /** Auto-grow to fit content. Default true. */
  autoResize?: boolean
}

export function Textarea({ className, variant, autoResize = true, onChange, rows = 3, ...props }: TextareaProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  const resize = React.useCallback(() => {
    const el = ref.current
    if (!el || !autoResize) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [autoResize])

  React.useEffect(() => { resize() }, [resize, props.value])

  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      rows={rows}
      className={cn(textareaVariants({ variant, className }))}
      onChange={(e) => { resize(); onChange?.(e) }}
      {...props}
    />
  )
}
