import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useMyBlocks, useBlockUser, useUnblockUser } from '@/features/moderation'
import { useAuthStore } from '@/features/auth/store'
import type { BlockedUser } from '@/lib/api'

/** Block/unblock toggle for a user. Auth-gated; reflects current block state. */
export function BlockButton({ user, onBlocked }: { user: BlockedUser; onBlocked?: () => void }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const { data: blocks } = useMyBlocks()
  const block = useBlockUser()
  const unblock = useUnblockUser()

  const isBlocked = !!blocks?.some((b) => b.id === user.id)
  const pending = block.isPending || unblock.isPending

  const onClick = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (isBlocked) {
      unblock.mutate(user.id)
    } else {
      block.mutate(user, { onSuccess: () => onBlocked?.() })
    }
  }

  return (
    <Button variant="ghost" onClick={onClick} disabled={pending} data-testid="block-button">
      {isBlocked ? 'Unblock' : 'Block'}
    </Button>
  )
}
