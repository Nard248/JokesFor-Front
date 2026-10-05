import { useId, useState } from 'react'
import { useLocation, useSearchParams, Link } from 'react-router'
import { ChevronDown, Globe2 } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useDiscoveryCatalog } from './api'
import { useBrowseSelection } from './context'
import { ALL_LANGUAGES, EMPTY_SELECTION, selectionUrl, type ContentSelection } from './selection'
import { useDiscoveryStore } from './store'

const nativeLanguages: Record<string, string> = { en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', hy: 'Հայերեն', it: 'Italiano', nb: 'Norsk bokmål' }
const controlStyle = { width: '100%', minHeight: 44, border: '1px solid #D4D4D8', borderRadius: 10, background: '#fff', padding: '8px 12px', color: '#1A1A1A', font: 'inherit' }

export function DiscoveryPicker() {
  const [open, setOpen] = useState(false)
  const selection = useBrowseSelection()
  const id = useId()
  const { isMobile } = useBreakpoint()
  const languageSummary = selection.language === ALL_LANGUAGES ? 'All languages'
    : selection.language ? nativeLanguages[selection.language] ?? selection.language : 'Your language'
  const summary = [languageSummary, selection.country, selection.culture_tags ? 'Culture selected' : ''].filter(Boolean).join(' · ')
  return (
    <div style={{ borderBottom: '1px solid #E9E8E7', background: '#FBFAF7', padding: isMobile ? '0 16px' : '0 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, minHeight: 44, border: 0, background: 'transparent', color: '#52525B', font: 'inherit', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}>
          <Globe2 size={17} aria-hidden="true" style={{ color: '#6A1CF6', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: '#1A1A1A' }}>Joke languages</span>
          <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{summary}</span>
          <ChevronDown size={16} aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : undefined, flexShrink: 0 }} />
        </button>
        {open && <div id={id}><DiscoveryOptions /></div>}
      </div>
    </div>
  )
}

export function DiscoveryOptions() {
  const { data, isLoading, isError, refetch } = useDiscoveryCatalog()
  const selection = useBrowseSelection()
  const { search, pathname } = useLocation()
  const [, setSearchParams] = useSearchParams()
  const { isMobile } = useBreakpoint()
  const update = (next: ContentSelection) => {
    useDiscoveryStore.getState().setSelection(next)
    setSearchParams(selectionUrl(search, next))
  }
  const label = (item: { name: string; native_name: string }) => item.native_name && item.native_name !== item.name ? `${item.native_name} — ${item.name}` : item.name
  const culture = data?.cultures.find((item) => item.slug === selection.culture_tags)
  return (
    <section aria-label="Choose joke language, country and culture" style={{ padding: '8px 0 18px' }}>
      <p style={{ margin: '0 0 14px', color: '#52525B', fontSize: 13 }}>Choose the language you read, a country, or a cultural setting. Each choice narrows the jokes you discover.</p>
      {isLoading && <p role="status">Loading languages and cultures…</p>}
      {isError && <p role="alert">Couldn't load languages and cultures. <button type="button" onClick={() => void refetch()} style={{ minHeight: 44 }}>Try again</button></p>}
      {data && <>
        {data.collections.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }} aria-label="Regional joke collections">
          {data.collections.map((collection) => <button
            key={`${collection.locale}:${collection.country}:${collection.culture}`}
            type="button"
            onClick={() => update({ language: collection.language, country: collection.country, culture_tags: collection.culture })}
            aria-pressed={selection.language === collection.language && selection.country === collection.country && selection.culture_tags === collection.culture}
            style={{ minHeight: 44, padding: '8px 12px', border: '1px solid #E9E8E7', borderRadius: 12, background: '#fff', color: '#1A1A1A', font: 'inherit', fontSize: 13, cursor: 'pointer' }}
          ><span lang={collection.language}>{collection.label}</span> <span style={{ color: '#52525B' }}>({collection.joke_count.toLocaleString()})</span></button>)}
        </div>}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Joke language
            <select aria-label="Joke language" value={selection.language} onChange={(event) => update({ ...selection, language: event.target.value })} style={{ ...controlStyle, marginTop: 6 }}>
              {/* Empty = the server applies your default language; "all" explicitly selects every language. */}
              <option value="">Your language</option>
              <option value={ALL_LANGUAGES}>All languages</option>
              {selection.language && selection.language !== ALL_LANGUAGES && !data.languages.some((item) => item.code === selection.language) && <option value={selection.language}>{selection.language} (unavailable)</option>}
              {data.languages.map((item) => <option key={item.code} value={item.code} lang={item.code}>{label(item)}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Country
            <select aria-label="Country" value={selection.country} onChange={(event) => update({ ...selection, country: event.target.value })} style={{ ...controlStyle, marginTop: 6 }}>
              <option value="">All countries</option>
              {selection.country && !data.countries.some((item) => item.code === selection.country) && <option value={selection.country}>{selection.country} (unavailable)</option>}
              {data.countries.map((item) => <option key={item.code} value={item.code}>{label(item)}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Culture
            <select aria-label="Culture" value={selection.culture_tags} onChange={(event) => update({ ...selection, culture_tags: event.target.value })} style={{ ...controlStyle, marginTop: 6 }}>
              <option value="">All cultures</option>
              {selection.culture_tags && !culture && <option value={selection.culture_tags}>{selection.culture_tags} (unavailable)</option>}
              {data.cultures.map((item) => <option key={item.slug} value={item.slug}>{label(item)}</option>)}
            </select>
          </label>
        </div>
        {culture?.description && <p style={{ fontSize: 13, color: '#52525B', maxWidth: 760, marginTop: 12 }}>{culture.description}</p>}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          {Object.values(selection).some(Boolean) && <button type="button" onClick={() => update(EMPTY_SELECTION)} style={{ minHeight: 44, background: 'transparent', border: 0, padding: 0, color: '#6A1CF6', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>Clear language, country and culture</button>}
          {pathname !== '/explore' && pathname !== '/search' && <Link to={`/explore?${selectionUrl('', selection)}`} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', color: '#6A1CF6', fontSize: 13 }}>Explore this selection</Link>}
        </div>
      </>}
    </section>
  )
}
