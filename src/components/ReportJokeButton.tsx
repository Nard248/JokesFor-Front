import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Flag, Check } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { RadioGroup } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useReportJoke } from '@/features/moderation'
import { useAuthStore } from '@/features/auth/store'
import { REPORT_REASONS, type ReportReason } from '@/lib/api'

/** Flag affordance on a joke → opens a modal to report it. Auth-gated. */
export function ReportJokeButton({ jokeId }: { jokeId: number }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const report = useReportJoke()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const [done, setDone] = useState(false)

  const onOpen = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setOpen(true)
  }

  const onSubmit = () => {
    if (!reason) return
    report.mutate(
      { joke: jokeId, reason, description: description.trim() || undefined },
      { onSuccess: () => { setDone(true); setOpen(false) } },
    )
  }

  return (
    <>
      <button
        type="button"
        data-testid="report-joke-button"
        aria-label={done ? 'Joke reported' : 'Report joke'}
        title={done ? 'Reported' : 'Report'}
        onClick={onOpen}
        disabled={done}
        className="size-8 flex items-center justify-center rounded-full hover:bg-[#F2F0F0] text-[#6B7280] transition-colors disabled:opacity-50"
      >
        {done ? <Check size={16} /> : <Flag size={16} />}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Report this joke"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={!reason || report.isPending} data-testid="report-submit">
              {report.isPending ? 'Reporting…' : 'Submit report'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <RadioGroup
            name="report-reason"
            value={reason}
            onChange={(v) => setReason(v as ReportReason)}
            options={REPORT_REASONS.map((r) => ({ value: r.value, label: r.label }))}
            label="Why are you reporting this?"
          />
          <Textarea
            placeholder="Add any details (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
          {report.isError && (
            <div role="alert" className="text-sm text-red-700">Could not submit. Please try again.</div>
          )}
        </div>
      </Modal>
    </>
  )
}
