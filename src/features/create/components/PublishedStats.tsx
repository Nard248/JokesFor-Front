import type { PublishedStats as PublishedStatsType } from '@/features/create'

interface PublishedStatsProps {
  stats: PublishedStatsType | null | undefined
}

export function PublishedStats({ stats }: PublishedStatsProps) {
  if (!stats) return null

  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#52525B' }}>
      <span>{stats.saves} saved</span>
      <span aria-hidden>·</span>
      <span>{stats.reactions} reactions</span>
      <span aria-hidden>·</span>
      <span>{stats.reports} reports</span>
    </div>
  )
}
