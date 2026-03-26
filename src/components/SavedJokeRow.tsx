import type { SavedJoke } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bookmark, Share2, Trash2 } from 'lucide-react'

interface SavedJokeRowProps {
  savedJoke: SavedJoke
  showActions?: boolean
}

function getInitials(text: string): string {
  return text.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SavedJokeRow({ savedJoke, showActions }: SavedJokeRowProps) {
  const { joke } = savedJoke
  const title = joke.setup || joke.text.slice(0, 40)
  const preview = joke.punchline || joke.text.slice(0, 80)
  const primaryTone = joke.tones[0]

  return (
    <div className="flex items-center gap-4 py-4 px-2 hover:bg-[#F2F0F0]/50 rounded-2xl transition-colors">
      {/* Initials Avatar */}
      <Avatar
        initials={getInitials(title)}
        size="md"
        color={primaryTone?.slug === 'dad_joke' ? '#FFC965' : primaryTone?.slug === 'punny' ? '#CAFD00' : '#6A1CF6'}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-semibold text-sm text-[#2E2F2F] truncate">{title}</h4>
          {primaryTone && (
            <Badge variant="muted" size="sm">{primaryTone.name}</Badge>
          )}
        </div>
        <p className="text-sm text-[#6B7280] truncate">{preview}...</p>
      </div>

      {/* Date or Actions */}
      {showActions ? (
        <div className="flex items-center gap-1 shrink-0">
          <button className="size-8 flex items-center justify-center rounded-full bg-[#CAFD00] text-[#3A4A00]">
            <Bookmark className="size-4" />
          </button>
          <button className="size-8 flex items-center justify-center rounded-full bg-[#F2F0F0] text-[#6B7280] hover:bg-[#E9E8E7]">
            <Share2 className="size-4" />
          </button>
          <button className="size-8 flex items-center justify-center rounded-full bg-[#F2F0F0] text-[#6B7280] hover:bg-red-100 hover:text-red-500">
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : (
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase text-[#6B7280] tracking-wider">Saved on</p>
          <p className="text-sm font-medium text-[#2E2F2F]">{formatDate(savedJoke.saved_at)}</p>
        </div>
      )}
    </div>
  )
}
