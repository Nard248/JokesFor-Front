import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useCreateAppeal } from '@/features/appeals'

interface AppealButtonProps {
  /** Set for a takedown appeal (removed joke). Exactly one of jokeId/submissionId is passed. */
  jokeId?: number
  /** Set for a rejection appeal (rejected submission). */
  submissionId?: number
  label?: string
  /** Smaller footprint for inline placement (e.g. inside a notification row). */
  compact?: boolean
}

/** Pull a human-readable message out of the appeal-create 400s (DRF
 * `{non_field_errors: [...]}` from serializer.validate(), or `{detail}` from a
 * NotFound) or fall back to a generic message. */
function extractAppealError(error: unknown): string {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
  if (data) {
    const nfe = data.non_field_errors
    if (Array.isArray(nfe) && nfe.length) return String(nfe[0])
    if (typeof data.detail === 'string') return data.detail
  }
  return 'Could not submit your appeal. Please try again.'
}

/**
 * Appeal CTA + modal — opens a small "reason" form and POSTs it via
 * useCreateAppeal(). Used on the rejected SubmissionDetailPage state and on
 * removal/rejection inbox notifications. Always rendered (no per-target
 * "already appealed" lookup); a duplicate-open-appeal 400 from the backend is
 * simply surfaced as the error message.
 */
export function AppealButton({ jokeId, submissionId, label = 'Appeal this decision', compact }: AppealButtonProps) {
  const createAppeal = useCreateAppeal()
  const [open, setOpen] = useState(false)
  const [reasonText, setReasonText] = useState('')
  const [done, setDone] = useState(false)

  const onOpen = () => {
    createAppeal.reset()
    setOpen(true)
  }

  const onSubmit = () => {
    if (!reasonText.trim()) return
    createAppeal.mutate(
      { joke_id: jokeId, submission_id: submissionId, reason_text: reasonText.trim() },
      { onSuccess: () => { setDone(true); setOpen(false) } },
    )
  }

  if (done) {
    return (
      <span
        data-testid="appeal-submitted"
        style={{ fontSize: compact ? 12 : 13, color: '#15803D', fontWeight: 600 }}
      >
        Appeal submitted — we&apos;ll notify you once it&apos;s reviewed.
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        data-testid="appeal-button"
        onClick={onOpen}
        style={{
          background: 'none',
          border: 0,
          cursor: 'pointer',
          padding: 0,
          color: '#6A1CF6',
          fontWeight: 700,
          fontSize: compact ? 12 : 14,
          textDecoration: 'none',
        }}
      >
        {label}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Appeal this decision"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={onSubmit}
              disabled={!reasonText.trim() || createAppeal.isPending}
              data-testid="appeal-submit"
            >
              {createAppeal.isPending ? 'Submitting…' : 'Submit appeal'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6B7280' }}>
            Tell us why you think this decision should be reversed. Our team reviews every appeal.
          </p>
          <Textarea
            placeholder="Explain why this joke/submission shouldn't have been removed or rejected…"
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            maxLength={1000}
            data-testid="appeal-reason"
          />
          {createAppeal.isError && (
            <div role="alert" data-testid="appeal-error" className="text-sm text-red-700">
              {extractAppealError(createAppeal.error)}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
