import { useId } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export const CREATOR_PRO_BILLING_PATH = '/settings/billing'

interface CreatorProGateProps {
  /** The locked tool, e.g. "Content workbench". */
  feature: string
  /** One or two sentences on what the tool does. */
  description: string
  /** What Creator Pro unlocks on this page (full variant only). */
  unlocks?: string[]
  /** Compact inline notice — for pages that stay usable in a read-only mode. */
  compact?: boolean
  /** Overrides the default "<feature> is part of Creator Pro" heading. */
  title?: string
  className?: string
}

function ProChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-lime-dark">
      <Sparkles size={12} aria-hidden="true" />
      Creator Pro
    </span>
  )
}

const HONEST_NOTE =
  "Creator Pro is a set of tools for understanding and organising your work. It doesn't buy distribution or reach. Reading, publishing and basic insights stay free."

/**
 * The one locked state for every Creator Pro tool (a 403 or a missing
 * entitlement). Copy is deliberately plain: it names the tool, lists what it
 * unlocks, and says what a subscription does not buy.
 */
export function CreatorProGate({ feature, description, unlocks = [], compact = false, title, className }: CreatorProGateProps) {
  const headingId = useId()
  const heading = title ?? `${feature} is part of Creator Pro`

  if (compact) {
    return (
      <section
        aria-labelledby={headingId}
        data-testid="creator-pro-gate"
        data-variant="compact"
        className={cn(
          'flex flex-col gap-3 rounded-2xl border border-[#E4D9FF] bg-purple-tint p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5',
          className,
        )}
      >
        <div className="min-w-0">
          <div className="mb-1.5"><ProChip /></div>
          <p id={headingId} className="m-0 font-display text-base font-extrabold text-flow-ink">{heading}</p>
          <p className="m-0 mt-1 text-sm leading-relaxed text-text-secondary">{description}</p>
        </div>
        <Link
          to={CREATOR_PRO_BILLING_PATH}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border-2 border-[#AC8EFF] bg-white px-5 text-sm font-bold text-[#6A1CF6] no-underline transition-colors hover:bg-purple-tint"
        >
          See Creator Pro
        </Link>
      </section>
    )
  }

  return (
    <section
      aria-labelledby={headingId}
      data-testid="creator-pro-gate"
      data-variant="full"
      className={cn('rounded-[20px] border border-border-light bg-white p-6 sm:p-8', className)}
    >
      <ProChip />
      <h2 id={headingId} className="mb-2 mt-4 font-display text-[clamp(1.375rem,3vw,1.75rem)] font-extrabold leading-tight tracking-[-0.01em] text-flow-ink">
        {heading}
      </h2>
      <p className="m-0 max-w-[620px] text-[15px] leading-relaxed text-text-secondary">{description}</p>
      {unlocks.length > 0 && (
        <ul className="m-0 mt-5 grid list-none gap-2.5 p-0">
          {unlocks.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm leading-snug text-flow-ink">
              <CheckCircle2 size={18} className="mt-px shrink-0 text-[#6A1CF6]" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to={CREATOR_PRO_BILLING_PATH}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#6A1CF6] px-6 text-sm font-bold text-white no-underline shadow-cta transition-colors hover:bg-[#5D00E4]"
      >
        See Creator Pro
      </Link>
      <p className="m-0 mt-4 max-w-[620px] text-xs leading-relaxed text-text-muted">{HONEST_NOTE}</p>
    </section>
  )
}
