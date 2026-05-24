import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormats, FormatTile, FORMAT_EXAMPLE } from '@/features/create'
import { FORMAT_SLUGS } from '@/features/create/types'
import type { FormatRule } from '@/features/create'
import { track } from '@/features/create/analytics'

/** Fallback format entries (minimal, for error state) */
const FALLBACK_FORMAT_NAMES: Record<string, string> = {
  oneliner: 'One-liner',
  setup: 'Setup → Punchline',
  knock: 'Knock-knock',
  story: 'Story',
  anti: 'Anti-joke',
  observ: 'Observational',
}

const FALLBACK_FORMATS: FormatRule[] = FORMAT_SLUGS.map((slug, i) => ({
  id: i + 1,
  slug,
  name: FALLBACK_FORMAT_NAMES[slug] ?? slug,
  description: '',
  required_fields: [],
  forbidden_fields: [],
  constraints: {},
}))

export function FormatPickerPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useFormats()

  // Analytics: track page viewed once on mount
  useEffect(() => {
    track('format_picker_viewed')
  }, [])

  const formats = (isError || (!isLoading && !data?.length))
    ? FALLBACK_FORMATS
    : (data ?? [])

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell>
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 900, margin: '0 auto' }}>
          {/* Back link */}
          <Link
            to="/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#6A1CF6',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              marginBottom: 28,
            }}
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          {/* Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              letterSpacing: '-0.02em',
              color: '#1A1A1A',
              lineHeight: 1.05,
              marginBottom: 8,
            }}
          >
            Pick a format
          </h1>
          <p style={{ fontSize: 16, color: '#52525B', marginBottom: 32 }}>
            Choose the joke style that fits your idea best.
          </p>

          {/* Loading: skeleton grid */}
          {isLoading && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} style={{ height: 130, borderRadius: 18 }} />
              ))}
            </div>
          )}

          {/* Tiles grid */}
          {!isLoading && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {formats.map((format) => (
                <FormatTile
                  key={format.slug}
                  format={format}
                  example={FORMAT_EXAMPLE[format.slug] ?? ''}
                  onClick={() => {
                    track('format_selected', { format: format.slug })
                    navigate(`/create/new/${format.slug}`)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </FlowAppShell>
    </div>
  )
}
