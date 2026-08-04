import { useState } from 'react'
import { CreditCard, Zap, CheckCircle2, XCircle, Infinity as InfinityIcon } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useBillingPlans,
  useMySubscription,
  useEntitlements,
  useCreateCheckoutSession,
  useCreatePortalSession,
  isBillingUnavailable,
  isActiveSubscriptionConflict,
  getConflictPortalUrl,
} from '@/features/billing'
import type { BillingPlan, BillingEntitlements } from '@/features/billing'

const USE_MOCKS =
  !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCKS === 'true'

// ────────────────────────────────────────────────────────────────────────────
// Feature label map — friendlier names for the raw keys
// ────────────────────────────────────────────────────────────────────────────
const FEATURE_LABELS: Record<string, string> = {
  creator_analytics: 'Creator analytics',
  daily_joke_preview: 'Daily joke preview',
  mature_content_addon: 'Mature content',
}

const LIMIT_LABELS: Record<string, string> = {
  mystery_box_rolls_per_day: 'Mystery box rolls / day',
  submissions_per_day: 'Submissions / day',
  daily_jokes_per_day: 'Daily jokes / day',
  daily_joke_history_days: 'Joke history (days)',
}

/** Render an ISO date/datetime as a short readable date; falls back to raw on parse failure. */
function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// ────────────────────────────────────────────────────────────────────────────
// BillingPage
// ────────────────────────────────────────────────────────────────────────────

export function BillingPage() {
  const { isMobile } = useBreakpoint()
  const btnH = isMobile ? 44 : 40
  const plansQuery = useBillingPlans()
  const subscriptionQuery = useMySubscription()
  const entitlementsQuery = useEntitlements()
  const checkoutMutation = useCreateCheckoutSession()
  const portalMutation = useCreatePortalSession()

  // Demo overlay: shown instead of a real redirect when running in mock mode
  const [demoMessage, setDemoMessage] = useState<string | null>(null)
  // Dormant: Stripe not configured on backend
  const [dormant, setDormant] = useState(false)
  // Shown when checkout is rejected with 409 active_subscription and we have no
  // portal_url to redirect to — offers a Manage button instead of a raw error.
  const [activeSubNotice, setActiveSubNotice] = useState(false)

  const sub = subscriptionQuery.data
  const currentPlanSlug = sub?.plan_slug ?? 'free'
  // Live paid states mirror the backend Subscription.LIVE_PAID_STATUSES guard:
  // while any of these is active, a second checkout would double-bill, so plan
  // changes must route through the Customer Portal instead of a new Subscribe.
  const LIVE_PAID_STATUSES = ['active', 'trialing', 'past_due']
  const hasLiveSubscription = sub ? LIVE_PAID_STATUSES.includes(sub.status) : false
  const isSubscribed = hasLiveSubscription

  // Human-friendly line describing the subscription's renewal / cancellation state.
  const subscriptionStatusLine = (() => {
    if (!sub) return null
    const end = sub.current_period_end ? formatDate(sub.current_period_end) : null
    if (sub.cancel_at_period_end) {
      return end ? `Cancels on ${end} — access continues until then.` : 'Set to cancel at period end.'
    }
    if (sub.status === 'past_due') {
      return 'Payment past due — update your card to keep your plan.'
    }
    if (sub.status === 'trialing') {
      return end ? `Free trial — renews ${end}.` : 'Free trial active.'
    }
    if (end) return `Renews ${end}.`
    return null
  })()

  function handleSubscribe(plan: BillingPlan) {
    checkoutMutation.mutate(plan.slug, {
      onSuccess: (data) => {
        if (USE_MOCKS) {
          setDemoMessage(
            `(demo) Would redirect to Stripe Checkout for "${plan.name}" — URL: ${data.url}`,
          )
        } else {
          window.location.href = data.url
        }
      },
      onError: (err) => {
        if (isBillingUnavailable(err)) {
          setDormant(true)
          return
        }
        // Backend blocked a second checkout because a live subscription exists.
        // Route to the portal (redirect if a portal_url came back) instead of
        // surfacing a raw error or opening a duplicate subscription.
        if (isActiveSubscriptionConflict(err)) {
          const portalUrl = getConflictPortalUrl(err)
          if (portalUrl) {
            if (USE_MOCKS) {
              setDemoMessage(`(demo) Would redirect to Stripe Portal — URL: ${portalUrl}`)
            } else {
              window.location.href = portalUrl
            }
            return
          }
          setActiveSubNotice(true)
        }
      },
    })
  }

  function handleManageBilling() {
    setActiveSubNotice(false)
    portalMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (USE_MOCKS) {
          setDemoMessage(`(demo) Would redirect to Stripe Portal — URL: ${data.url}`)
        } else {
          window.location.href = data.url
        }
      },
      onError: (err) => {
        if (isBillingUnavailable(err)) {
          setDormant(true)
        }
      },
    })
  }

  const isLoading =
    plansQuery.isLoading || subscriptionQuery.isLoading || entitlementsQuery.isLoading

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        {/* Horizontal padding comes from the shell's fluid container; vertical only
            here (RESPONSIVE.md rule 2). Cap stays narrower than the shell. */}
        <div style={{ padding: '40px 0', maxWidth: 960, margin: '0 auto' }}>
          {/* Hero */}
          <div>
            <span className="eyebrow-mono">Billing &amp; Plans</span>
            <h2
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
                lineHeight: 1.05,
              }}
            >
              Pick your <em className="wink">plan.</em>
            </h2>
            <p style={{ marginTop: 6, fontSize: 18, color: '#52525B' }}>
              Unlock more jokes, more laughs, more everything.
            </p>
          </div>

          {/* Dormant state */}
          {dormant && (
            <div
              role="alert"
              data-testid="billing-unavailable"
              style={{
                marginTop: 32,
                padding: 24,
                background: '#FFF8F0',
                border: '1px solid #F59E0B',
                borderRadius: 16,
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <Zap size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 16,
                    color: '#92400E',
                  }}
                >
                  Billing isn't enabled yet
                </div>
                <p style={{ marginTop: 4, fontSize: 13, color: '#B45309' }}>
                  Stripe hasn't been configured on this server. Paid plans aren't available right
                  now — check back soon or contact support.
                </p>
              </div>
            </div>
          )}

          {/* Active-subscription notice — shown when checkout was blocked (409)
              and no portal_url was available to redirect to. */}
          {activeSubNotice && (
            <div
              role="alert"
              data-testid="active-sub-notice"
              style={{
                marginTop: 24,
                padding: 20,
                background: '#F5F0FF',
                border: '1px solid #C4B5FD',
                borderRadius: 16,
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <CreditCard size={20} color="#6A1CF6" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 15,
                    color: '#1A1A1A',
                  }}
                >
                  You already have an active subscription
                </div>
                <p style={{ marginTop: 4, fontSize: 13, color: '#52525B' }}>
                  To switch plans or cancel, manage your subscription from the billing portal.
                </p>
              </div>
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={portalMutation.isPending}
                className="btn-flow-primary"
                style={{ height: btnH, fontSize: 13 }}
                data-testid="active-sub-manage-btn"
              >
                {portalMutation.isPending ? 'Opening…' : 'Manage subscription'}
              </button>
            </div>
          )}

          {/* Demo redirect notice */}
          {demoMessage && (
            <div
              role="status"
              data-testid="demo-message"
              style={{
                marginTop: 24,
                padding: 16,
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: 14,
                fontSize: 13,
                color: '#15803D',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {demoMessage}{' '}
              <button
                type="button"
                onClick={() => setDemoMessage(null)}
                style={{ marginLeft: 8, color: '#15803D', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', fontSize: 13 }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Plans grid */}
          <section style={{ marginTop: 40 }}>
            {isLoading ? (
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}
              >
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} style={{ height: 320, borderRadius: 24 }} />
                ))}
              </div>
            ) : plansQuery.isError ? (
              <ErrorCard message="Could not load plans. Please try again." />
            ) : (plansQuery.data ?? []).length === 0 ? (
              <NoPlansCard />
            ) : (
              <div
                data-testid="plans-grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}
              >
                {(plansQuery.data ?? [])
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((plan) => (
                    <PlanCard
                      key={plan.slug}
                      plan={plan}
                      isCurrent={plan.slug === currentPlanSlug}
                      isPending={checkoutMutation.isPending && checkoutMutation.variables === plan.slug}
                      hasLiveSubscription={hasLiveSubscription}
                      isManaging={portalMutation.isPending}
                      onSubscribe={() => handleSubscribe(plan)}
                      onManage={handleManageBilling}
                    />
                  ))}
              </div>
            )}
          </section>

          {/* Manage billing */}
          {isSubscribed && !isLoading && (
            <div
              style={{
                marginTop: 24,
                padding: '18px 24px',
                background: '#fff',
                border: '1px solid #E9E8E7',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <CreditCard size={18} color="#6A1CF6" />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                  Manage your subscription
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {subscriptionStatusLine ?? 'Update payment, view invoices, or cancel.'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={portalMutation.isPending}
                className="btn-flow-primary"
                style={{ height: btnH, fontSize: 13 }}
                data-testid="manage-billing-btn"
              >
                {portalMutation.isPending ? 'Opening…' : 'Manage billing'}
              </button>
            </div>
          )}

          {/* Entitlements */}
          {!isLoading && entitlementsQuery.data && (
            <EntitlementsPanel entitlements={entitlementsQuery.data} />
          )}
        </div>
      </FlowAppShell>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// PlanCard
// ────────────────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
  isPending,
  hasLiveSubscription,
  isManaging,
  onSubscribe,
  onManage,
}: {
  plan: BillingPlan
  isCurrent: boolean
  isPending: boolean
  hasLiveSubscription: boolean
  isManaging: boolean
  onSubscribe: () => void
  onManage: () => void
}) {
  const isFree = plan.slug === 'free'
  const priceLabel = plan.amount_display?.trim() || (isFree ? 'Free' : '—')

  return (
    <div
      data-testid={`plan-card-${plan.slug}`}
      aria-current={isCurrent ? 'true' : undefined}
      style={{
        padding: 28,
        background: isCurrent ? '#F2E9FF' : '#fff',
        border: isCurrent ? '2px solid #6A1CF6' : '1px solid #E9E8E7',
        borderRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
      }}
    >
      {isCurrent && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: '#6A1CF6',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: 999,
            fontFamily: 'var(--font-sans)',
          }}
          data-testid={`current-badge-${plan.slug}`}
        >
          Current plan
        </div>
      )}

      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 22,
            color: '#1A1A1A',
            letterSpacing: '-0.01em',
          }}
        >
          {plan.name}
        </div>
        <div style={{ fontSize: 13, color: '#52525B', marginTop: 4 }}>{plan.description}</div>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 28,
          color: isCurrent ? '#6A1CF6' : '#1A1A1A',
        }}
        data-testid={`plan-price-${plan.slug}`}
      >
        {priceLabel}
      </div>

      {/* Feature list */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(plan.features).map(([key, enabled]) => (
          <li key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1A1A1A' }}>
            {enabled ? (
              <CheckCircle2 size={15} color="#16A34A" />
            ) : (
              <XCircle size={15} color="#D1D5DB" />
            )}
            {FEATURE_LABELS[key] ?? key}
          </li>
        ))}
      </ul>

      {/* Limit list */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(plan.limits).map(([key, val]) => (
          <li key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#52525B' }}>
            <span>{LIMIT_LABELS[key] ?? key}</span>
            <span style={{ fontWeight: 700, color: '#1A1A1A' }}>
              {val === null ? <InfinityIcon size={13} /> : val}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div
          style={{
            padding: '10px 0',
            textAlign: 'center',
            fontSize: 13,
            color: '#6A1CF6',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
          }}
        >
          You're on this plan
        </div>
      ) : hasLiveSubscription ? (
        // A live paid subscription already exists — never open a second checkout.
        // Route plan changes (and downgrades) through the Customer Portal.
        <button
          type="button"
          onClick={onManage}
          disabled={isManaging}
          className="btn-flow-primary"
          style={{ width: '100%', height: 44, fontSize: 14, marginTop: 4 }}
          data-testid={`manage-plan-btn-${plan.slug}`}
        >
          {isManaging ? 'Opening…' : 'Manage subscription'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubscribe}
          disabled={isPending}
          className={isFree ? 'btn-flow-ghost' : 'btn-flow-primary'}
          style={{ width: '100%', height: 44, fontSize: 14, marginTop: 4 }}
          data-testid={`subscribe-btn-${plan.slug}`}
        >
          {isPending ? 'Loading…' : isFree ? 'Downgrade to Free' : `Subscribe — ${priceLabel}`}
        </button>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// EntitlementsPanel
// ────────────────────────────────────────────────────────────────────────────

function EntitlementsPanel({ entitlements }: { entitlements: BillingEntitlements }) {
  return (
    <section
      data-testid="entitlements-panel"
      style={{
        marginTop: 32,
        padding: 'clamp(24px, 3vw, 32px)',
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#F2E9FF',
            color: '#6A1CF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={18} />
        </div>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 22,
              color: '#1A1A1A',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            Your current entitlements
          </h3>
          <p style={{ marginTop: 2, fontSize: 13, color: '#6B7280' }}>
            What your <strong>{entitlements.plan}</strong> plan gives you right now.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Features */}
        <div>
          <div className="eyebrow-mono" style={{ marginBottom: 10 }}>
            Features
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(entitlements.features).map(([key, enabled]) => (
              <li
                key={key}
                data-testid={`entitlement-feature-${key}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1A1A1A' }}
              >
                {enabled ? (
                  <CheckCircle2 size={15} color="#16A34A" />
                ) : (
                  <XCircle size={15} color="#D1D5DB" />
                )}
                {FEATURE_LABELS[key] ?? key}
              </li>
            ))}
          </ul>
        </div>

        {/* Limits */}
        <div>
          <div className="eyebrow-mono" style={{ marginBottom: 10 }}>
            Limits
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(entitlements.limits).map(([key, val]) => (
              <li
                key={key}
                data-testid={`entitlement-limit-${key}`}
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#52525B' }}
              >
                <span>{LIMIT_LABELS[key] ?? key}</span>
                <span style={{ fontWeight: 700, color: '#1A1A1A' }}>
                  {val === null ? '∞' : val}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// ErrorCard
// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// NoPlansCard — shown when the backend returns zero plans (billing dormant / not
// configured). Reads as intentional rather than a broken/empty grid.
// ────────────────────────────────────────────────────────────────────────────

function NoPlansCard() {
  return (
    <div
      data-testid="no-plans"
      style={{
        padding: '40px 32px',
        background: '#fff',
        border: '1px dashed #E9E8E7',
        borderRadius: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: '#F2E9FF',
          color: '#6A1CF6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <Zap size={22} />
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 20,
          color: '#1A1A1A',
          letterSpacing: '-0.01em',
          marginBottom: 8,
        }}
      >
        Paid plans are coming soon
      </h3>
      <p style={{ fontSize: 14, color: '#52525B', maxWidth: 420, margin: '0 auto' }}>
        You're on the free plan with everything you need to get started. We'll add upgrade
        options here when they're ready.
      </p>
    </div>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: 24,
        background: '#FFF0F0',
        border: '1px solid #FCA5A5',
        borderRadius: 16,
        color: '#B91C1C',
        fontSize: 14,
      }}
    >
      {message}
    </div>
  )
}
