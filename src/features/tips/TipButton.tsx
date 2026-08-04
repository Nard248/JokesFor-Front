import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HandCoins } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useAuthStore } from '@/features/auth/store'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCreateTipCheckout, isTipsBillingUnavailable, TIP_TIERS } from './api'

const USE_MOCKS =
  !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCKS === 'true'

interface TipButtonProps {
  creatorId: number
  /** Same self/anon signal the profile already reads for Follow/Block —
   * null (self-view or anon without known follow state) hides the button. */
  isFollowing: boolean | null
  /** Set on the joke-detail flow to tip the creator for THIS joke. */
  jokeId?: number
}

/** "Tip creator" button + fixed-tier picker modal. Dormant-aware: a 503 from
 * the checkout POST (billing not configured yet) flips the button into a
 * disabled "coming soon" state instead of ever leaving a broken checkout. */
export function TipButton({ creatorId, isFollowing, jokeId }: TipButtonProps) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { isMobile } = useBreakpoint()
  const { toast } = useToast()
  const checkout = useCreateTipCheckout()
  const [open, setOpen] = useState(false)
  const [dormant, setDormant] = useState(false)

  // Self-view or anon-without-known-follow-state → hide, same as Follow/Block.
  if (isFollowing === null) return null

  const onOpen = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setOpen(true)
  }

  const onPickTier = (amount_cents: number) => {
    checkout.mutate(
      { creator_id: creatorId, joke_id: jokeId, amount_cents },
      {
        onSuccess: (data) => {
          setOpen(false)
          if (USE_MOCKS) {
            toast({
              message: `(demo) Would redirect to Stripe Checkout for a $${amount_cents / 100} tip — URL: ${data.checkout_url}`,
              variant: 'success',
            })
          } else {
            window.location.href = data.checkout_url
          }
        },
        onError: (err) => {
          if (isTipsBillingUnavailable(err)) {
            setOpen(false)
            setDormant(true)
            toast({ message: "Tips aren't available yet — check back soon.", variant: 'default' })
            return
          }
          toast({ message: 'Could not start checkout. Please try again.', variant: 'error' })
        },
      },
    )
  }

  const btnBase = {
    display: 'inline-flex',
    alignItems: 'center' as const,
    gap: 6,
    padding: isMobile ? '11px 20px' : '8px 20px',
    minHeight: isMobile ? 44 : undefined,
    borderRadius: 9999,
    fontWeight: 700,
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
  }

  if (dormant) {
    return (
      <button
        type="button"
        disabled
        data-testid="tip-button-dormant"
        title="Tips aren't available yet"
        style={{
          ...btnBase,
          border: '1px solid #E9E8E7',
          background: '#F5F4F2',
          color: '#9CA3AF',
          cursor: 'not-allowed',
        }}
      >
        <HandCoins size={16} /> Tips coming soon
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        data-testid="tip-button"
        style={{
          ...btnBase,
          border: '1px solid #AC8EFF',
          background: '#F7F0FF',
          color: '#6A1CF6',
          cursor: 'pointer',
        }}
      >
        <HandCoins size={16} /> Tip
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Send a tip">
        <p style={{ fontSize: 13, color: '#52525B', marginBottom: 16 }}>
          Pick an amount to send this creator a one-off tip.
        </p>
        <div
          data-testid="tip-tier-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}
        >
          {TIP_TIERS.map((cents) => (
            <button
              key={cents}
              type="button"
              data-testid={`tip-tier-${cents}`}
              disabled={checkout.isPending}
              onClick={() => onPickTier(cents)}
              style={{
                padding: '16px 0',
                borderRadius: 14,
                border: '1px solid #E9E8E7',
                background: '#fff',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 20,
                color: '#1A1A1A',
                cursor: checkout.isPending ? 'not-allowed' : 'pointer',
                opacity: checkout.isPending ? 0.6 : 1,
              }}
            >
              ${cents / 100}
            </button>
          ))}
        </div>
        {checkout.isError && !isTipsBillingUnavailable(checkout.error) && (
          <p role="alert" style={{ marginTop: 12, fontSize: 13, color: '#B91C1C' }}>
            Could not start checkout. Please try again.
          </p>
        )}
      </Modal>
    </>
  )
}
