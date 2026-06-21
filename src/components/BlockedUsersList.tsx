import { Button } from '@/components/ui/button'
import { useMyBlocks, useUnblockUser } from '@/features/moderation'

/** Manage blocked users (Settings). Lists who you've blocked with unblock. */
export function BlockedUsersList() {
  const { data: blocks, isLoading } = useMyBlocks()
  const unblock = useUnblockUser()

  if (isLoading) {
    return <div style={{ fontSize: 13, color: '#6B7280' }}>Loading…</div>
  }
  if (!blocks || blocks.length === 0) {
    return <div data-testid="blocks-empty" style={{ fontSize: 13, color: '#6B7280' }}>You haven't blocked anyone.</div>
  }

  return (
    <ul data-testid="blocks-list" style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
      {blocks.map((u) => (
        <li key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{u.username}</div>
          </div>
          <Button
            variant="ghost"
            data-testid={`unblock-${u.id}`}
            disabled={unblock.isPending}
            onClick={() => unblock.mutate(u.id)}
          >
            Unblock
          </Button>
        </li>
      ))}
    </ul>
  )
}
