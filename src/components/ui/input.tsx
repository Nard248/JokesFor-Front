import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input w-full min-w-0 border bg-transparent text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "h-9 rounded-md px-3 py-1 shadow-xs md:text-sm",
        pill: "h-12 rounded-full px-6 py-3 bg-white border-[#E9E8E7] shadow-[0_30px_60px_-15px_rgba(106,28,246,0.12)] text-base focus-visible:border-[#6A1CF6] focus-visible:ring-[#6A1CF6]/20",
        "pill-sm": "h-10 rounded-full px-5 py-2 bg-white border-[#E9E8E7] text-sm focus-visible:border-[#6A1CF6] focus-visible:ring-[#6A1CF6]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
