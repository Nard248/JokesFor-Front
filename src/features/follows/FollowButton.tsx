import { useNavigate } from 'react-router'
import { useAuthStore } from '@/features/auth/store'
import { useFollow, useUnfollow } from './api'

interface FollowButtonProps {
  creatorId: number
  isFollowing: boolean | null
  followerCount: number
}

export function FollowButton({ creatorId, isFollowing, followerCount: _followerCount }: FollowButtonProps) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const followMutation = useFollow()
  const unfollowMutation = useUnfollow()

  // null = self-view or anon without known follow state → hide button
  if (isFollowing === null) return null

  const isPending = followMutation.isPending || unfollowMutation.isPending

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (isFollowing) {
      unfollowMutation.mutate(creatorId)
    } else {
      followMutation.mutate(creatorId)
    }
  }

  return (
    <button
      aria-pressed={isFollowing}
      disabled={isPending}
      onClick={handleClick}
      style={{
        padding: '8px 20px',
        borderRadius: 9999,
        border: isFollowing ? '1px solid #AC8EFF' : 'none',
        background: isFollowing ? '#F7F0FF' : '#6A1CF6',
        color: isFollowing ? '#6A1CF6' : '#fff',
        fontWeight: 700,
        fontSize: 14,
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.7 : 1,
        transition: 'all 0.12s ease',
      }}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
