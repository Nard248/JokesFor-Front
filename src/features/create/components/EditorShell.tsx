import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export interface EditorShellProps {
  formatLabel: string
  onChangeFormat: () => void
  footer: React.ReactNode
  preview: React.ReactNode
  children: React.ReactNode
}

type MobilePane = 'edit' | 'preview'

export function EditorShell({
  formatLabel,
  onChangeFormat,
  footer,
  preview,
  children,
}: EditorShellProps) {
  const [mobilePane, setMobilePane] = useState<MobilePane>('edit')
  const { isMobile } = useBreakpoint()

  return (
    <div className="flex flex-col" style={{ minHeight: 0 }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px solid #E9E8E7',
          marginBottom: 16,
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 16,
            color: '#1A1A1A',
          }}
        >
          {formatLabel}
        </span>
        <Button
          variant="pill-outline"
          size="sm"
          onClick={onChangeFormat}
          style={{ height: isMobile ? 44 : undefined }}
        >
          Change format
        </Button>
      </div>

      {/* Mobile toggle — hidden on desktop (md and above) */}
      <div
        className="md:hidden"
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 14,
          background: '#F3F4F6',
          borderRadius: 12,
          padding: 4,
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          aria-label="Edit"
          onClick={() => setMobilePane('edit')}
          style={{
            border: 'none',
            borderRadius: 10,
            padding: '6px 18px',
            minHeight: 44,
            fontSize: 14,
            fontWeight: mobilePane === 'edit' ? 700 : 400,
            background: mobilePane === 'edit' ? '#fff' : 'transparent',
            color: mobilePane === 'edit' ? '#1A1A1A' : '#6B7280',
            cursor: 'pointer',
            boxShadow: mobilePane === 'edit' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          Edit
        </button>
        <button
          type="button"
          aria-label="Preview"
          onClick={() => setMobilePane('preview')}
          style={{
            border: 'none',
            borderRadius: 10,
            padding: '6px 18px',
            minHeight: 44,
            fontSize: 14,
            fontWeight: mobilePane === 'preview' ? 700 : 400,
            background: mobilePane === 'preview' ? '#fff' : 'transparent',
            color: mobilePane === 'preview' ? '#1A1A1A' : '#6B7280',
            cursor: 'pointer',
            boxShadow: mobilePane === 'preview' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          Preview
        </button>
      </div>

      {/* Two-pane layout: stacked on mobile, side-by-side grid on desktop */}
      <div className="md:grid md:grid-cols-2 md:gap-6" style={{ flex: 1, minHeight: 0 }}>
        {/* Editor pane: shown when mobile=edit or always on desktop */}
        <div
          data-testid="editor-pane"
          className={cn(mobilePane === 'edit' ? 'block' : 'hidden', 'md:block')}
          style={{ minWidth: 0 }}
        >
          {children}
        </div>

        {/* Preview pane: shown when mobile=preview or always on desktop */}
        <div
          data-testid="preview-pane"
          className={cn(mobilePane === 'preview' ? 'block' : 'hidden', 'md:block')}
          style={{ minWidth: 0 }}
        >
          {preview}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid #E9E8E7',
          marginTop: 16,
          paddingTop: 16,
        }}
      >
        {footer}
      </div>
    </div>
  )
}
