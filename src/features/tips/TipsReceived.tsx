import { HandCoins } from 'lucide-react'
import { useCreatorTipsSummary } from './api'

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/** Creator-profile "tips received" summary — count + total EARNED, never
 * "available to withdraw" (v1 has no payouts, see spec §Payout reality).
 * Hidden entirely when the creator has zero tips (graceful-absent) or the
 * summary hasn't loaded yet. */
export function TipsReceived({ creatorId }: { creatorId: number }) {
  const { data, isLoading, isError } = useCreatorTipsSummary(creatorId)

  if (isLoading || isError || !data || data.count === 0) return null

  return (
    <span
      data-testid="tips-received"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#52525B' }}
    >
      <HandCoins size={14} color="#6A1CF6" />
      <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{data.count.toLocaleString()}</span>{' '}
      {data.count === 1 ? 'tip' : 'tips'} received
      <span style={{ color: '#D1D5DB' }}>·</span>
      <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{formatDollars(data.total_cents)}</span>
    </span>
  )
}
