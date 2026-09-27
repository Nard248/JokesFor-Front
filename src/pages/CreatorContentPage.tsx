import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Download, Search } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { Button } from '@/components/ui/button'
import { useFormats, useLanguages, useContextTags, useTones } from '@/features/create/queries'
import {
  useCreatorContent, useExportCreatorContent, contentStatus, contentDemoMode, contentErrorMessage,
  type ContentFilters, type ContentPeriod, type ContentSort, type CreatorContentRow,
} from '@/features/creator-content/api'

const defaults: ContentFilters = { period: 'month', sort: 'newest' }
const fieldStyle: CSSProperties = { width: '100%', minHeight: 44, border: '1px solid #D8D5D0', borderRadius: 10, padding: '8px 10px', background: '#fff', color: '#27272A', fontSize: 14 }
const cardStyle: CSSProperties = { background: '#fff', border: '1px solid #E9E8E7', borderRadius: 18, padding: 24 }
const linkStyle: CSSProperties = { color: '#6A1CF6', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }

function ContentCard({ row }: { row: CreatorContentRow }) {
  const text = row.text || row.setup || `${row.format.name} #${row.id}`
  const title = text.length > 240 ? `${text.slice(0, 237)}…` : text
  return (
    <article style={cardStyle}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, color: '#71717A', fontSize: 12 }}>
        <span>{row.format.name} · {row.language.name}</span>
        <span>Published {new Date(row.created_at).toLocaleDateString()}</span>
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '12px 0', overflowWrap: 'anywhere' }}>
        <Link to={`/jokes/${row.id}`} style={{ color: '#1A1A1A', textDecoration: 'none' }}>{title}</Link>
      </h2>
      {row.setup && row.punchline && <p style={{ color: '#52525B', margin: '0 0 16px' }}>{row.punchline.length > 240 ? `${row.punchline.slice(0, 237)}…` : row.punchline}</p>}
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, margin: '20px 0' }}>
        {([['Views', row.views], ['Reactions', row.reactions], ['Saves', row.saves], ['Share initiations', row.share_initiations]] as const).map(([label, value]) => (
          <div key={label}><dt style={{ color: '#71717A', fontSize: 12 }}>{label}</dt><dd style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, margin: '4px 0 0' }}>{value.toLocaleString()}</dd></div>
        ))}
      </dl>
      <div style={{ borderTop: '1px solid #F1EFEC', paddingTop: 16, fontSize: 13 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', color: '#52525B' }}>
          <span>Themes: {row.themes.map((t) => t.name).join(', ') || 'Not added'}</span>
          <span>Categories: {row.categories.map((t) => t.name).join(', ') || 'Not added'}</span>
        </div>
        <p style={{ marginBottom: 6 }}><strong>{row.metadata_completeness}% complete</strong> · Discovery metadata</p>
        {row.metadata_missing.length > 0 && <p style={{ color: '#71717A', margin: '0 0 8px' }}>Missing: {row.metadata_missing.join(', ')}</p>}
        <p style={{ background: '#F7F0FF', borderRadius: 10, padding: 12, color: '#4B327A', margin: '12px 0 0' }}>{row.recommendation.detail}</p>
        <p style={{ color: '#71717A', marginBottom: 0 }}>{row.recommendation.sample_size.toLocaleString()} recorded views in this window. Metadata completeness is not a quality score.</p>
      </div>
    </article>
  )
}

export function CreatorContentPage() {
  const [draft, setDraft] = useState<ContentFilters>(defaults)
  const [filters, setFilters] = useState<ContentFilters>(defaults)
  const [page, setPage] = useState(1)
  const query = useCreatorContent(filters, page)
  const download = useExportCreatorContent()
  const [exportError, setExportError] = useState('')
  const formats = useFormats()
  const languages = useLanguages()
  const themes = useContextTags()
  const categories = useTones()
  const denied = contentStatus(query.error) === 403
  const demo = contentDemoMode()
  const data = query.data
  const setField = (key: keyof ContentFilters, value: string) => setDraft((current) => ({ ...current, [key]: value || undefined }))
  const apply = (event: FormEvent) => {
    event.preventDefault()
    setFilters({ ...draft, q: draft.q?.trim() || undefined })
    setPage(1)
    download.reset()
    setExportError('')
  }
  useEffect(() => {
    let current = true
    if (download.error) {
      const fallback = contentStatus(download.error) === 403
        ? 'CSV exports require a creator plan with exports enabled. Reading and basic insights remain free.'
        : contentStatus(download.error) === 422
          ? 'Narrow the filters to export at most 1000 jokes.'
          : 'Could not export your content. Please try again.'
      void (contentStatus(download.error) === 403 ? Promise.resolve(fallback) : contentErrorMessage(download.error, fallback)).then((message) => { if (current) setExportError(message) })
    }
    return () => { current = false }
  }, [download.error])

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell>
        <div style={{ maxWidth: 960, padding: '40px 0', margin: '0 auto' }}>
          <nav aria-label="Creator navigation" style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
            <Link to="/create" style={linkStyle}>Your jokes</Link>
            <Link to="/create/insights" style={linkStyle}>Basic insights</Link>
          </nav>
          <header style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 2.75rem)', letterSpacing: '-0.02em', margin: '0 0 12px' }}>Content workbench</h1>
            <p style={{ color: '#52525B', maxWidth: 680, lineHeight: 1.6 }}>Explore your published material, compare recorded activity, and find gaps in its discovery metadata.</p>
          </header>

          {demo ? <div style={cardStyle}>Connect to JokesFor to view your creator content. Demo metrics are not available for this workbench.</div> : denied ? (
            <section style={cardStyle}>
              <h2>Explore your content with creator tools</h2>
              <p>Content filtering and exports are available with eligible creator plans.</p>
              <p>Reading and basic creator insights remain free.</p>
              <Link to="/settings/billing" style={linkStyle}>View creator plans</Link>
            </section>
          ) : <>
            <form onSubmit={apply} style={{ ...cardStyle, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                <label>Activity window<select aria-label="Activity window" style={fieldStyle} value={draft.period} onChange={(e) => setDraft((current) => ({ ...current, period: e.target.value as ContentPeriod, start: undefined, end: undefined }))}>
                  <option value="week">Last 7 days</option><option value="month">Last 30 days</option><option value="quarter">Last 90 days</option><option value="year">Last 365 days</option>
                </select></label>
                <label>From<input aria-label="From" style={fieldStyle} type="date" value={draft.start ?? ''} onChange={(e) => setField('start', e.target.value)} /></label>
                <label>Through<input aria-label="Through" style={fieldStyle} type="date" value={draft.end ?? ''} onChange={(e) => setField('end', e.target.value)} /></label>
                <label>Format<select aria-label="Format" style={fieldStyle} value={draft.joke_format ?? ''} onChange={(e) => setField('joke_format', e.target.value)}>
                  <option value="">All formats</option>{formats.data?.map((format) => <option key={format.slug} value={format.slug}>{format.name}</option>)}
                </select></label>
                <label>Language<select aria-label="Language" style={fieldStyle} value={draft.language ?? ''} onChange={(e) => setField('language', e.target.value)}>
                  <option value="">All languages</option>{languages.data?.map((language) => <option key={language.code} value={language.code}>{language.name}</option>)}
                </select></label>
                <label>Theme<select aria-label="Theme" style={fieldStyle} value={draft.theme ?? ''} onChange={(e) => setField('theme', e.target.value)}>
                  <option value="">All themes</option>{themes.data?.map((theme) => <option key={theme.slug} value={theme.slug}>{theme.name}</option>)}
                </select></label>
                <label>Category<select aria-label="Category" style={fieldStyle} value={draft.category ?? ''} onChange={(e) => setField('category', e.target.value)}>
                  <option value="">All categories</option>{categories.data?.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
                </select></label>
                <label>Sort by<select aria-label="Sort by" style={fieldStyle} value={draft.sort} onChange={(e) => setField('sort', e.target.value as ContentSort)}>
                  <option value="newest">Newest published</option><option value="oldest">Oldest published</option><option value="views">Most views</option><option value="reactions">Most reactions</option><option value="saves">Most saves</option><option value="shares">Most share initiations</option>
                </select></label>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, alignItems: 'end' }}>
                <label style={{ flex: '1 1 240px' }}>Search content<input aria-label="Search content" style={fieldStyle} maxLength={200} value={draft.q ?? ''} placeholder="Search your text, setup or punchline" onChange={(e) => setField('q', e.target.value)} /></label>
                <Button type="submit" style={{ minHeight: 44 }}><Search size={16} />Apply filters</Button>
                <Button type="button" variant="outline" style={{ minHeight: 44 }} onClick={() => { setDraft(defaults); setFilters(defaults); setPage(1); download.reset(); setExportError('') }}>Reset filters</Button>
              </div>
              <p style={{ color: '#71717A', fontSize: 12, marginBottom: 0 }}>Dates use UTC and filter activity, not publication dates. Choose a window of up to 366 days.</p>
            </form>
            {query.isLoading && <p role="status">Loading your content…</p>}
            {query.isError && <div role="alert" style={cardStyle}>
              <p>{contentStatus(query.error) === 400 ? 'Check your filters. Use valid dates, ending no later than today, within a 366-day window.' : 'Could not load your content. Please try again.'}</p>
              <Button variant="outline" onClick={() => { void query.refetch() }}>Retry</Button>
            </div>}
            {data && <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                <div><strong>{data.count.toLocaleString()} {data.count === 1 ? 'joke' : 'jokes'}</strong><p style={{ color: '#71717A', fontSize: 13, margin: '4px 0' }}>{data.window.start} – {data.window.end} · {data.window.timezone}</p></div>
                <Button variant="outline" disabled={download.isPending || data.count === 0} style={{ minHeight: 44 }} onClick={() => { setExportError(''); download.exportContent(filters) }}><Download size={16} />{download.isPending ? 'Exporting…' : 'Export CSV'}</Button>
              </div>
              {exportError && <p role="alert" style={{ color: '#9F1239' }}>{exportError} {contentStatus(download.error) === 403 && <Link to="/settings/billing" style={linkStyle}>View creator plans</Link>}</p>}
              {download.isSuccess && <p role="status">Your CSV download is ready.</p>}
              {data.results.length === 0 ? <section style={cardStyle}><h2>No content matches these filters</h2><p>Try a different search or taxonomy filter. Published content appears here after approval.</p><Link to="/create" style={linkStyle}>Go to your jokes</Link></section> : <div style={{ display: 'grid', gap: 16 }}>{data.results.map((row) => <ContentCard key={row.id} row={row} />)}</div>}
              <nav aria-label="Content pages" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, margin: '24px 0' }}>
                <Button variant="outline" aria-label="Previous page" disabled={!data.previous || query.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
                <span>Page {page} of {Math.max(1, Math.ceil(data.count / 25))}</span>
                <Button variant="outline" aria-label="Next page" disabled={!data.next || query.isFetching} onClick={() => setPage((current) => current + 1)}>Next</Button>
              </nav>
              <details style={{ ...cardStyle, fontSize: 13, color: '#52525B' }} open>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>How these numbers are measured</summary>
                <ul style={{ paddingLeft: 20, lineHeight: 1.7 }}>{data.measurement_notes.map((note) => <li key={note}>{note}</li>)}</ul>
                <p>Exports include up to 1,000 matching jokes. Apply narrower filters for larger libraries.</p>
              </details>
            </>}
          </>}
        </div>
      </FlowAppShell>
    </div>
  )
}
