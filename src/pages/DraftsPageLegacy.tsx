import { useNavigate } from 'react-router'
import { PenLine, Clock, Check, AlertCircle, ThumbsUp, Trash2, Edit3, Lightbulb } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDrafts, useSubmitDraft, useDeleteDraft } from '@/features/drafts'

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-[#E9E8E7] text-[#52525B]', icon: PenLine },
  pending: { label: 'Pending Review', color: 'bg-[#FFC965]/20 text-[#5F4200]', icon: Clock },
  published: { label: 'Published', color: 'bg-[#CAFD00]/20 text-[#3A4A00]', icon: Check },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-600', icon: AlertCircle },
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function DraftsPageLegacy() {
  const navigate = useNavigate()
  const { data: draftsData } = useDrafts()
  const submitMutation = useSubmitDraft()
  const deleteMutation = useDeleteDraft()

  const drafts = draftsData?.results || []

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-6xl">
      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <PenLine className="size-8 text-[#6A1CF6]" />
            <h1 className="font-display font-black text-3xl lg:text-5xl text-[#2E2F2F]">
              Your Drafts
            </h1>
          </div>
          <p className="text-[#6B7280] text-base lg:text-lg">
            Works in progress. Every punchline starts somewhere.
          </p>
        </div>
        <Button variant="pill-lime" size="xl" className="gap-2" onClick={() => navigate('/submit')}>
          <PenLine className="size-5" /> Create New Draft
        </Button>
      </section>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Drafts List */}
        <div className="lg:col-span-2 space-y-4 mb-8 lg:mb-0">
          {drafts.map((draft) => {
            const status = statusConfig[draft.status]
            const StatusIcon = status.icon
            return (
              <Card key={draft.id} radius="lg" hover className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${status.color}`}>
                      <StatusIcon className="size-3" />
                      {status.label}
                    </span>
                    <Badge variant="muted" size="sm">{draft.format}</Badge>
                  </div>
                  <span className="text-xs text-[#6B7280]">{timeAgo(draft.lastEditedAt)}</span>
                </div>

                <div className="mb-4">
                  <p className="font-semibold text-[#2E2F2F] text-base mb-1">{draft.setup}</p>
                  {draft.punchline && (
                    <div className="flex gap-3 mt-2">
                      <div className="w-[3px] bg-[#6A1CF6] rounded-full shrink-0" />
                      <p className="font-display font-bold italic text-base text-[#6A1CF6]">{draft.punchline}</p>
                    </div>
                  )}
                </div>

                {/* Tones */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {draft.tones.map((tone) => (
                    <Badge key={tone} variant="muted" size="sm">{tone}</Badge>
                  ))}
                </div>

                {/* Published likes */}
                {draft.status === 'published' && draft.likes && (
                  <div className="flex items-center gap-1.5 mb-4 text-sm text-[#6B7280]">
                    <ThumbsUp className="size-4 text-[#CAFD00]" />
                    <span className="font-semibold text-[#2E2F2F]">{draft.likes} likes</span> since published
                  </div>
                )}

                {/* Rejection reason */}
                {draft.status === 'rejected' && draft.rejectionReason && (
                  <div className="bg-red-50 rounded-2xl p-3 mb-4 text-sm text-red-600">
                    <span className="font-semibold">Feedback:</span> {draft.rejectionReason}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {(draft.status === 'draft' || draft.status === 'rejected') && (
                    <Button variant="pill-outline" size="sm" className="gap-1.5">
                      <Edit3 className="size-3.5" /> Edit
                    </Button>
                  )}
                  {draft.status === 'draft' && (
                    <Button variant="pill" size="sm" onClick={() => submitMutation.mutate(draft.id)}>Submit for Review</Button>
                  )}
                  {draft.status === 'rejected' && (
                    <Button variant="pill" size="sm" onClick={() => submitMutation.mutate(draft.id)}>Resubmit</Button>
                  )}
                  <Button variant="ghost" size="icon-sm" className="ml-auto text-[#6B7280] hover:text-red-500" onClick={() => deleteMutation.mutate(draft.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Sidebar: Tips */}
        <div className="hidden lg:block">
          <Card radius="lg" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="size-5 text-[#FFC965]" />
              <h3 className="font-display font-bold text-lg text-[#2E2F2F]">Pro Tips</h3>
            </div>
            <ul className="space-y-4 text-sm text-[#52525B]">
              <li className="flex gap-3">
                <span className="shrink-0 size-6 rounded-full bg-[#F7F0FF] text-[#6A1CF6] flex items-center justify-center text-xs font-bold">1</span>
                <span><strong>Keep it tight.</strong> The best jokes are under 3 sentences. Trim the fat.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 size-6 rounded-full bg-[#F7F0FF] text-[#6A1CF6] flex items-center justify-center text-xs font-bold">2</span>
                <span><strong>Surprise them.</strong> The punchline should go where they least expect.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 size-6 rounded-full bg-[#F7F0FF] text-[#6A1CF6] flex items-center justify-center text-xs font-bold">3</span>
                <span><strong>Tag wisely.</strong> Good tags help the right audience find your joke.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 size-6 rounded-full bg-[#F7F0FF] text-[#6A1CF6] flex items-center justify-center text-xs font-bold">4</span>
                <span><strong>Read it aloud.</strong> If it doesn't land spoken, rewrite it.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
