import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export interface SubmitConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function SubmitConfirmModal({ open, onClose, onConfirm }: SubmitConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send to moderators?"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="pill" onClick={onConfirm}>
            Submit
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 14, color: '#52525B', lineHeight: 1.6 }}>
        Your joke will be reviewed by our moderation team before it goes live. This usually
        takes less than 24 hours. You won't be able to edit it while it's under review.
      </p>
    </Modal>
  )
}
