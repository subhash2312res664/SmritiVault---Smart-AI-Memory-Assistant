import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchItem, deleteItem } from '../api/index.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { ItemIcon } from '../components/ItemIcon.jsx'
import { Toast, useToast } from '../components/Toast.jsx'

const SUGGESTIONS = ['Keys', 'Wallet', 'Passport', 'Laptop', 'Charger', 'Phone']

export default function Search() {
  const [query, setQuery]         = useState('')
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)
  const { toast, showToast }      = useToast()
  const navigate = useNavigate()

  const handleSearch = async (q) => {
    const term = (q || query).trim()
    if (!term) { showToast('Enter item name', 'error'); return }
    setLoading(true); setSearched(true); setResult(null)
    try {
      const res = await searchItem(term)
      setResult({ found: true, data: res.data })
    } catch (err) {
      if (err.response?.status === 404) setResult({ found: false })
      else showToast('Search failed', 'error')
    } finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!result?.data || !confirm(`Delete "${result.data.item_name}"?`)) return
    try {
      await deleteItem(result.data.item_name)
      showToast('Deleted!')
      setResult(null); setSearched(false)
    } catch { showToast('Delete failed', 'error') }
  }

  return (
    <div>
      <Navbar active="/search" />
      <Toast toast={toast} />
      <div className="page">
        <div style={s.wrap}>

          <h1 style={s.title}>Intelligent Search</h1>

          {/* Search bar */}
          <div style={s.searchBox}>
            <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              style={s.input}
              placeholder="Search for any item..."
              value={query}
              onChange={e => { setQuery(e.target.value); setResult(null); setSearched(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
            <button className="btn-primary" style={{ borderRadius: '0 7px 7px 0', padding: '0 20px', height: '100%' }} onClick={() => handleSearch()}>
              Search
            </button>
          </div>

          {/* Suggestion chips */}
          {!searched && (
            <div style={s.chips}>
              {SUGGESTIONS.map(s_ => (
                <button key={s_} className="tag" style={s.chip} onClick={() => { setQuery(s_); handleSearch(s_) }}>
                  {s_}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <span className="spinner dark" />
            </div>
          )}

          {/* Result */}
          {!loading && result && result.found && (
            <div style={s.resultSection}>
              <h2 style={s.resultTitle}>Found 1 Exact Match</h2>
              <div style={s.resultGrid}>
                {/* Main result card */}
                <div className="card" style={s.resultCard}>
                  <div style={s.resultCardTop}>
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
                      <div style={s.resultMeta}>
                        <div>
                          <div style={s.metaLabel}>Log Type</div>
                          <div style={s.metaValue}>{result.data.log_type || 'Manual'}</div>
                        </div>
                        <div>
                          <div style={s.metaLabel}>Last Updated</div>
                          <div style={s.metaValue}>{result.data.saved_on || '—'}</div>
                        </div>
                      </div>
                      <div style={s.resultActions}>
                        <button className="btn-primary" style={{ fontSize: 13 }}
                          onClick={() => navigate(`/items?search=${encodeURIComponent(result.data.item_name)}`)}>
                          ✎ Edit / Update
                        </button>
                        <button className="btn-outline" style={{ fontSize: 13 }} onClick={handleDelete}>
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
                      <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z"/>
                    </svg>
                    AI Insight
                  </div>
                  <p style={s.aiText}>
                    Your <strong>{result.data.item_name}</strong> is currently stored at <strong>{result.data.location}</strong>.
                    Make sure it's easy to access when you need it next time!
                  </p>
                  <div style={s.aiAction}>
                    <strong>Action Item:</strong> Consider updating the location if you've recently moved this item.
                  </div>
                </div>
              </div>

              {/* Similar suggestions */}
              <div style={s.similar}>
                <h3 style={s.similarTitle}>Suggested / Similar Items</h3>
                <div style={s.chipRow}>
                  {SUGGESTIONS.filter(s_ => s_.toLowerCase() !== query.toLowerCase()).slice(0, 3).map(s_ => (
                    <button key={s_} className="card" style={s.suggCard} onClick={() => { setQuery(s_); handleSearch(s_) }}>
                      <ItemIcon name={s_} size={32} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s_}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>Click to search</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Not found */}
          {!loading && result && !result.found && (
            <div style={s.notFound}>
              <div style={s.notFoundIcon}>○</div>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>No results found</h3>
              <p style={{ color: '#6b7280', marginBottom: 24 }}>
                We couldn't find "<strong>{query}</strong>". Try saving it first.
              </p>
              <button className="btn-primary" onClick={() => navigate('/add')}>
                + Log this item
              </button>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  )
}

const s = {
  wrap:         { maxWidth: 900, margin: '0 auto', padding: '48px 24px' },
  title:        { fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 32 },
  searchBox:    { display: 'flex', alignItems: 'stretch', background: '#fff', border: '2px solid #e5e0da', borderRadius: 10, overflow: 'hidden', height: 52, marginBottom: 20 },
  input:        { flex: 1, border: 'none', padding: '0 16px', fontSize: 16, outline: 'none', background: 'transparent' },
  chips:        { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 },
  chip:         { cursor: 'pointer', padding: '5px 14px', borderRadius: 100, fontSize: 13, background: '#fff', border: '1.5px solid #e5e0da', color: '#374151' },
  resultSection:{ marginTop: 32 },
  resultTitle:  { fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, marginBottom: 20 },
  resultGrid:   { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 32 },
  resultCard:   { padding: 24 },
  resultCardTop:{ display: 'flex', gap: 20, alignItems: 'flex-start' },
  resultRow:    { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 },
  itemName:     { fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700 },
  addedDate:    { fontSize: 13, color: '#9ca3af', marginBottom: 14 },
  locationBox:  { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#f9f9f7', borderRadius: 8, padding: '12px 16px', marginBottom: 16 },
  locLabel:     { fontSize: 12, color: '#6b7280' },
  locValue:     { fontSize: 16, fontWeight: 700 },
  resultMeta:   { display: 'flex', gap: 32, marginBottom: 20 },
  metaLabel:    { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  metaValue:    { fontSize: 14, fontWeight: 600 },
  resultActions:{ display: 'flex', gap: 10 },
  aiCard:       { padding: 22, background: '#f9fffe', borderColor: '#c6e9df' },
  aiTitle:      { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#1a6b52', marginBottom: 14, fontSize: 14 },
  aiText:       { fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 14 },
  aiAction:     { fontSize: 13, color: '#374151', background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #c6e9df' },
  similar:      { marginTop: 8 },
  similarTitle: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, marginBottom: 16 },
  chipRow:      { display: 'flex', gap: 14 },
  suggCard:     { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', flex: 1 },
  notFound:     { textAlign: 'center', padding: '80px 0' },
  notFoundIcon: { fontSize: 48, marginBottom: 16, color: '#d1ccc5' },
}
