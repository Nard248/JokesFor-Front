import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Sparkles } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { cn } from '@/lib/utils'
import { CREATOR_PRO_BILLING_PATH } from './CreatorProGate'
import { useCreatorPlan, type CreatorProFeature } from './useCreatorPlan'

export type StudioSection = 'overview' | 'content' | 'insights' | 'communities' | 'library'

interface StudioTab {
  id: StudioSection
  label: string
  to: string
  /** Entitlement that unlocks this section; absent = free for every creator. */
  proFeature?: CreatorProFeature
}

const STUDIO_TABS: readonly StudioTab[] = [
  { id: 'overview', label: 'Overview', to: '/create' },
  { id: 'content', label: 'Content', to: '/create/content', proFeature: 'creator_content_explorer' },
  { id: 'insights', label: 'Insights', to: '/create/insights' },
  { id: 'communities', label: 'Communities', to: '/create/communities', proFeature: 'creator_community_insights' },
  { id: 'library', label: 'Library', to: '/create/library' },
]

interface CreatorStudioLayoutProps {
  /** Which Studio tab is current (drives `aria-current`). */
  section: StudioSection
  title: string
  subtitle: string
  /** Page-level actions rendered beside the plan badge (e.g. "New joke"). */
  actions?: ReactNode
  children: ReactNode
}

function PlanBadge() {
  const { isPro, isLoading, isError } = useCreatorPlan()
  // Never guess a plan: say nothing until entitlements have answered.
  if (isLoading || isError) return null
  if (isPro) {
    return (
      <span
        data-testid="studio-plan-badge"
        data-plan="pro"
        className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-lime px-3 text-xs font-bold uppercase tracking-[0.06em] text-lime-dark"
      >
        <Sparkles size={13} aria-hidden="true" />
        Creator Pro
      </span>
    )
  }
  return (
    <span data-testid="studio-plan-badge" data-plan="free" className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="inline-flex min-h-8 items-center rounded-full border border-border-light bg-white px-3 text-xs font-bold uppercase tracking-[0.06em] text-text-secondary">
        Free plan
      </span>
      <Link
        to={CREATOR_PRO_BILLING_PATH}
        className="inline-flex min-h-11 items-center text-sm font-bold text-[#6A1CF6] underline underline-offset-4 hover:text-[#5D00E4]"
      >
        Explore Creator Pro
      </Link>
    </span>
  )
}

function StudioTabs({ section }: { section: StudioSection }) {
  const { features, isLoading } = useCreatorPlan()
  return (
    <nav aria-label="Creator Studio sections" className="mb-8 min-w-0">
      {/* The scroller is the only horizontally-overflowing box: the page itself
          never scrolls sideways at 375px. */}
      <div className="overflow-x-auto rounded-full border border-border-light bg-white p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="m-0 flex w-max min-w-full list-none gap-1 p-0">
          {STUDIO_TABS.map((tab) => {
            const current = tab.id === section
            const locked = !isLoading && tab.proFeature !== undefined && !features[tab.proFeature]
            return (
              <li key={tab.id} className="flex-1">
                <Link
                  to={tab.to}
                  aria-current={current ? 'page' : undefined}
                  data-testid={`studio-tab-${tab.id}`}
                  className={cn(
                    'relative inline-flex min-h-11 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm no-underline transition-colors',
                    current
                      ? 'bg-flow-ink font-bold text-white'
                      : 'font-semibold text-text-secondary hover:bg-purple-tint hover:text-[#6A1CF6]',
                  )}
                >
                  {tab.label}
                  {locked && (
                    <>
                      <span
                        aria-hidden="true"
                        data-testid={`studio-pro-pill-${tab.id}`}
                        className="rounded-full bg-lime px-1.5 py-px text-[10px] font-bold uppercase leading-4 tracking-[0.06em] text-lime-dark"
                      >
                        Pro
                      </span>
                      <span className="sr-only">(Creator Pro)</span>
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

/**
 * Creator Studio frame: one header, one plan badge, one tab bar for every
 * creator page. Pages supply only their title, subtitle, actions and body.
 */
export function CreatorStudioLayout({ section, title, subtitle, actions, children }: CreatorStudioLayoutProps) {
  return (
    <div className="min-h-screen bg-flow-bg">
      <FlowAppShell active="studio">
        <div className="mx-auto w-full min-w-0 max-w-[1080px] py-8 sm:py-10" data-testid="creator-studio">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0 max-w-[680px]">
              <p className="eyebrow-mono m-0">Creator Studio</p>
              <h1 className="mb-0 mt-2 font-display text-[clamp(2rem,5vw,2.75rem)] font-black leading-[1.05] tracking-[-0.02em] text-flow-ink">
                {title}
              </h1>
              <p className="m-0 mt-2 text-[15px] leading-relaxed text-text-secondary">{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PlanBadge />
              {actions}
            </div>
          </header>
          <StudioTabs section={section} />
          {children}
        </div>
      </FlowAppShell>
    </div>
  )
}
