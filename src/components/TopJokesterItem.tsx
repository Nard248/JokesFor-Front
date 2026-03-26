import { Avatar } from '@/components/ui/avatar'
import type { TopJokester } from '@/lib/mock-data'

interface TopJokesterItemProps {
  jokester: TopJokester
}

export function TopJokesterItem({ jokester }: TopJokesterItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar
        name={jokester.name}
        src={jokester.avatarUrl}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#2E2F2F] truncate">{jokester.name}</p>
        <p className="text-xs text-[#6B7280]">{jokester.punchlineCount.toLocaleString()} Punchlines</p>
      </div>
      <span className={`font-display font-bold text-lg ${jokester.rank === 1 ? 'text-[#6A1CF6]' : 'text-[#6B7280]'}`}>
        #{jokester.rank}
      </span>
    </div>
  )
}
