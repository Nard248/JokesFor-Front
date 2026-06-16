import { useConsent } from './useConsent'

export function ConsentBanner() {
  const { decided, accept, reject } = useConsent()

  if (decided) return null

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#1A1A1A',
        color: '#F9F9F8',
        padding: '14px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        justifyContent: 'space-between',
        fontSize: 14,
      }}
    >
      <span>
        We use essential cookies to run the site. With your consent we also use analytics cookies to
        improve your experience.{' '}
        <a
          href="/cookie-policy"
          style={{ color: '#CAFD00', textDecoration: 'underline' }}
        >
          Cookie Policy
        </a>
      </span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={reject}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid #555',
            background: 'transparent',
            color: '#F9F9F8',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Reject
        </button>
        <button
          onClick={accept}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#CAFD00',
            color: '#1A1A1A',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
