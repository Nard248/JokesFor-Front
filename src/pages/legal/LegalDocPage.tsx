import type { LegalDoc } from '@/content/legal'

interface Props {
  doc: LegalDoc
}

export function LegalDocPage({ doc }: Props) {
  return (
    <div
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 56px) 24px',
        fontFamily: 'inherit',
        color: '#1A1A1A',
        lineHeight: 1.6,
      }}
    >
      {/* Prominent DRAFT notice */}
      <div
        role="note"
        aria-label="Draft notice"
        style={{
          background: '#FFF3CD',
          border: '1px solid #FFC107',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 32,
          fontWeight: 600,
          fontSize: 14,
          color: '#856404',
        }}
      >
        {doc.draftNotice}
      </div>

      <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: 8 }}>
        {doc.title}
      </h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 40 }}>
        Last updated: {doc.lastUpdated}
      </p>

      {doc.sections.map((section) => (
        <section key={section.heading} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{section.heading}</h2>
          {section.body.map((paragraph, idx) => (
            <p key={idx} style={{ marginBottom: 10 }}>
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
