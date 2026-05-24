import type { SubmissionStatus } from '@/features/create'

interface StatusBadgeProps {
  status: SubmissionStatus
}

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; bg: string; color: string }> = {
  draft:     { label: 'Draft',     bg: '#F3F4F6', color: '#52525B' },
  pending:   { label: 'Pending',   bg: '#FEF3C7', color: '#92400E' },
  published: { label: 'Published', bg: '#CAFD00', color: '#3A4A00' },
  rejected:  { label: 'Rejected',  bg: '#FEE2E2', color: '#991B1B' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      aria-label={`Status: ${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        letterSpacing: '0.01em',
      }}
    >
      {cfg.label}
    </span>
  )
}
