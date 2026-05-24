import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DialogueLine } from '../components/DialogueLine'
import type { EditorProps } from './types'

const MIN_LINES = 4
const MAX_LINES = 8

export function KnockEditor({ draft, dispatch, errors }: EditorProps) {
  const lines: string[] = draft.lines ?? []
  const count = lines.length

  function handleChange(index: number, value: string) {
    const next = [...lines]
    next[index] = value
    dispatch({ type: 'setLines', lines: next })
  }

  function handleAddLine() {
    if (count >= MAX_LINES) return
    dispatch({ type: 'setLines', lines: [...lines, ''] })
  }

  function handleRemove(index: number) {
    if (count <= MIN_LINES) return
    const next = [...lines]
    next.splice(index, 1)
    dispatch({ type: 'setLines', lines: next })
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const next = [...lines]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    dispatch({ type: 'setLines', lines: next })
  }

  function handleMoveDown(index: number) {
    if (index === count - 1) return
    const next = [...lines]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    dispatch({ type: 'setLines', lines: next })
  }

  const counterAmber = count < MIN_LINES

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Lines */}
      {lines.map((line, i) => (
        <DialogueLine
          key={i}
          index={i}
          value={line}
          onChange={(v) => handleChange(i, v)}
          onRemove={() => handleRemove(i)}
          onMoveUp={() => handleMoveUp(i)}
          onMoveDown={() => handleMoveDown(i)}
          canRemove={count > MIN_LINES}
          canMoveUp={i > 0}
          canMoveDown={i < count - 1}
        />
      ))}

      {/* Add line button + counter row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <Button
          type="button"
          variant="pill-outline"
          size="sm"
          disabled={count >= MAX_LINES}
          onClick={handleAddLine}
        >
          + Add line
        </Button>

        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: counterAmber ? '#D97706' : '#6B7280',
          }}
        >
          {count} of 4–8 lines
        </span>
      </div>

      {/* Inline error */}
      {errors?.lines && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#DC2626',
            fontSize: 13,
          }}
        >
          <AlertCircle size={14} />
          <span>{errors.lines}</span>
        </div>
      )}
    </div>
  )
}
