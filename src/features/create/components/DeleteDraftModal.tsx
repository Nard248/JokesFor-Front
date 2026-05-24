import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export interface DeleteDraftModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteDraftModal({ open, onClose, onConfirm }: DeleteDraftModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete this draft?"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 14, color: '#52525B', lineHeight: 1.6 }}>
        This draft will be permanently deleted and cannot be recovered. Are you sure?
      </p>
    </Modal>
  )
}
