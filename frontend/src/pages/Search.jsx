import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchItem, deleteItem } from '../api/index.js'
import { isOnline, searchItemLocally } from '../services/localDB.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { ItemIcon } from '../components/ItemIcon.jsx'
import { Toast, useToast } from '../components/Toast.jsx'
import { useIsNarrow } from '../hooks/useMediaQuery.js'

const SUGGESTIONS = ['Keys', 'Wallet', 'Passport', 'Laptop', 'Charger', 'Phone']

export default function Search() {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])   // multiple results offline
  const [result, setResult]     = useState(null) // single result online
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [source, setSource]     = useState(null) // 'online' | 'offline'
  const { toast, showToast }    = useToast()
  const navigate                = useNavigate()
  const isNarrow                = useIsNarrow()

  const handleSearch = async (q) => {
    const term = (q || query).trim()
    if (!term) { showToast('Enter item name', 'error'); return }
    setLoading(true); setSearched(true); setResult(null); setResults([])

    if (!isOnline()) {
      // ── OFFLINE: search IndexedDB ──
      try {
        const found = await searchItemLocally(term)
        setResults(found)
        setSource('offline')
      } catch {
        showToast('Local search failed', 'error')
      } finally { setLoading(false) }
      return
    }

    // ── ONLINE: search server ──
    try {
      const res = await searchItem(term)
      setResult({ found: true, data: res.data })
      setSource('online')
    } catch (err) {
      if (err.response?.status === 404) {
        // Fallback to local
        const found = await searchItemLocally(term)
        if (found.length > 0) {
          setResults(found); setSource('offline')
        } else {
          setResult({ found: false }); setSource('online')
        }
      } else {
        showToast('Search failed', 'error')
      }
    } finally { setLoading(false) }
  }

  const handleDelete = async (name) => {
    if (!isOnline()) { showToast('Cannot delete while offline', 'error'); return }
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await deleteItem(name)
      showToast('Deleted!')
      setResult(null); setResults([]); setSearched(false)
    } catch { showToast('Delete failed', 'error') }
  }

  return (
    <div>
      <Navbar active="/search" />
      <Toast toast={toast} />
      <div className="page">
        <div style={{ ...s.wrap, ...(isNarrow ? s.wrapMobile : {}) }}>

          <h1 style={s.title}>Intelligent Search</h1>

          {/* Offline notice */}
          {!isOnline() && (
            <div style={s.offlineBadge}>
              📴 Offline — searching local data
            </div>
          )}

          {/* Search bar */}
          <div style={{ ...s.searchBox, ...(isNarrow ? s.searchBoxMobile : {}) }}>
            <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              style={s.input}
              placeholder="Search for any item..."
              value={query}
              onChange={e => { setQuery(e.target.value); setResult(null); setResults([]); setSearched(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
            <button className="btn-primary" style={isNarrow ? s.searchButtonMobile : { borderRadius: '0 7px 7px 0', padding: '0 20px', height: '100%' }}
              onClick={() => handleSearch()}>
              Search
            </button>
          </div>

          {/* Suggestion chips */}
          {!searched && (
            <div style={s.chips}>
              {SUGGESTIONS.map(s_ => (
                <button key={s_} className="tag" style={s.chip}
                  onClick={() => { setQuery(s_); handleSearch(s_) }}>
                  {s_}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner dark" /></div>}

          {/* ── OFFLINE RESULTS (multiple) ── */}
          {!loading && source === 'offline' && results.length > 0 && (
            <div style={s.resultSection}>
              <div style={{ ...s.resultHeader, ...(isNarrow ? s.resultHeaderMobile : {}) }}>
                <h2 style={s.resultTitle}>Found {results.length} local result{results.length !== 1 ? 's' : ''}</h2>
                <span style={s.sourceBadge}>📴 Local data</span>
              </div>
              <div style={s.offlineGrid}>
                {results.map((item, i) => (
                  <div key={i} className="card" style={s.offlineCard}>
                    <div style={s.offlineTop}>
                      <ItemIcon name={item.item_name} size={40} />
                      <div style={{ flex: 1 }}>
                        <div style={s.itemName}>{item.item_name}</div>
                        <div style={s.itemLoc}>
                          <svg width="12" height="12" fill="none" stroke="#1a6b52" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          {item.location}
                        </div>
                        {item.timestamp && (
                          <div style={s.itemTime}>{item.timestamp}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={s.offlineNote}>🔁 Connect to internet for live data</p>
            </div>
          )}

          {/* ── ONLINE RESULT (single exact match) ── */}
          {!loading && source === 'online' && result?.found && (
            <div style={s.resultSection}>
              <div style={{ ...s.resultHeader, ...(isNarrow ? s.resultHeaderMobile : {}) }}>
                <h2 style={s.resultTitle}>Found 1 Exact Match</h2>
                <span style={{ ...s.sourceBadge, background: '#e8f4ef', color: '#1a6b52' }}>✓ Live data</span>
              </div>
              <div style={{ ...s.resultGrid, ...(isNarrow ? s.resultGridMobile : {}) }}>
                <div className="card" style={s.resultCard}>
                  <div style={{ ...s.resultCardTop, ...(isNarrow ? s.resultCardTopMobile : {}) }}>
                    <ItemIcon name={result.data.item_name} size={72} />
                    <div style={{ flex: 1 }}>
                      <div style={s.resultRow}>
                        <h3 style={s.itemName}>{result.data.item_name}</h3>
                        <span className="tag green">Verified</span>
                      </div>
                      {result.data.saved_on && (
                        <p style={s.addedDate}>Saved on: {result.data.saved_on}</p>
                      )}
                      <div style={s.locationBox}>
                        <svg width="14" height="14" fill="none" stroke="#1a6b52" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        <div>
                          <div style={s.locLabel}>Current Location:</div>
                          <div style={s.locValue}>{result.data.location}</div>
                        </div>
                      </div>
                      <div style={s.resultActions}>
                        <button className="btn-primary" style={{ fontSize: 13 }}
                          onClick={() => navigate(`/items?search=${encodeURIComponent(result.data.item_name)}`)}>
                          ✎ Edit / Update
                        </button>
                        <button className="btn-outline" style={{ fontSize: 13 }}
                          onClick={() => navigate(`/history?item=${encodeURIComponent(result.data.item_name)}`)}>
                          🕐 History
                        </button>
                        <button className="btn-outline" style={{ fontSize: 13 }}
                          onClick={() => handleDelete(result.data.item_name)}>
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI insight card */}
                <div className="card" style={s.aiCard}>
                  <div style={s.aiTitle}>
                    <svg width="16" height="16" fill="none" stroke="#1a6b52" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/>
                    </svg>
                    AI Insight
                  </div>
                  <p style={s.aiText}>
                    Your <strong>{result.data.item_name}</strong> is at <strong>{result.data.location}</strong>.
                    Consider updating the location if you've moved it recently.
                  </p>
                  <div style={s.aiAction}>
                    <strong>Tip:</strong> Use Live Camera to auto-detect and update its location automatically!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Not found */}
          {!loading && searched && (
            (source === 'offline' && results.length === 0) ||
            (source === 'online' && result?.found === false)
          ) && (
            <div style={s.notFound}>
              <div style={s.notFoundIcon}>○</div>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>No results found</h3>
              <p style={{ color: '#6b7280', marginBottom: 24 }}>
                "{query}" not found {!isOnline() ? 'in local data' : 'anywhere'}.
              </p>
              <button className="btn-primary" onClick={() => navigate('/add')}>+ Log this item</button>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  )
}

const s = {
  wrap:          { maxWidth: 900, margin: '0 auto', padding: '48px 24px' },
  wrapMobile:    { padding: '32px 16px' },
  title:         { fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 20 },
  offlineBadge:  { textAlign: 'center', background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', padding: '8px 20px', borderRadius: 100, fontSize: 13, fontWeight: 500, marginBottom: 20, display: 'inline-block', width: '100%' },
  searchBox:     { display: 'flex', alignItems: 'stretch', background: '#fff', border: '2px solid #e5e0da', borderRadius: 10, overflow: 'hidden', height: 52, marginBottom: 20 },
  searchBoxMobile:{ flexDirection: 'column', height: 'auto', overflow: 'visible', padding: 10, gap: 8 },
  searchButtonMobile:{ width: '100%', borderRadius: 8, padding: '10px 16px' },
  input:         { flex: 1, border: 'none', padding: '0 16px', fontSize: 16, outline: 'none', background: 'transparent' },
  chips:         { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 },
  chip:          { cursor: 'pointer', padding: '5px 14px', borderRadius: 100, fontSize: 13, background: '#fff', border: '1.5px solid #e5e0da', color: '#374151' },

  resultSection: { marginTop: 28 },
  resultHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  resultHeaderMobile:{ alignItems: 'flex-start', flexDirection: 'column', gap: 8 },
  resultTitle:   { fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700 },
  sourceBadge:   { fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, background: '#fef3c7', color: '#92400e' },

  offlineGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 16 },
  offlineCard:   { padding: 16 },
  offlineTop:    { display: 'flex', gap: 12, alignItems: 'center' },
  offlineNote:   { textAlign: 'center', fontSize: 13, color: '#9ca3af' },

  resultGrid:    { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 },
  resultGridMobile:{ gridTemplateColumns: '1fr' },
  resultCard:    { padding: 24 },
  resultCardTop: { display: 'flex', gap: 20, alignItems: 'flex-start' },
  resultCardTopMobile:{ flexDirection: 'column' },
  resultRow:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 },
  itemName:      { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700 },
  addedDate:     { fontSize: 13, color: '#9ca3af', marginBottom: 14 },
  locationBox:   { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#f9f9f7', borderRadius: 8, padding: '12px 16px', marginBottom: 16 },
  locLabel:      { fontSize: 12, color: '#6b7280' },
  locValue:      { fontSize: 16, fontWeight: 700 },
  resultActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  itemLoc:       { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#1a6b52', marginTop: 4 },
  itemTime:      { fontSize: 12, color: '#9ca3af', marginTop: 4 },

  aiCard:        { padding: 22, background: '#f9fffe', borderColor: '#c6e9df' },
  aiTitle:       { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#1a6b52', marginBottom: 14, fontSize: 14 },
  aiText:        { fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 14 },
  aiAction:      { fontSize: 13, color: '#374151', background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #c6e9df' },

  notFound:      { textAlign: 'center', padding: '80px 0' },
  notFoundIcon:  { fontSize: 48, marginBottom: 16, color: '#d1ccc5' },
}
