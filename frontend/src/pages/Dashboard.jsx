import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { allItems } from '../api/index.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { ItemIcon } from '../components/ItemIcon.jsx'
import { Toast, useToast } from '../components/Toast.jsx'
import { useIsNarrow } from '../hooks/useMediaQuery.js'

function timeAgo(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)    return 'Logged just now'
  if (diff < 3600)  return `Logged ${Math.floor(diff/60)}m ago`
  if (diff < 86400) return 'Logged Today'
  if (diff < 172800) return 'Logged Yesterday'
  const days = Math.floor(diff / 86400)
  if (days < 7) return `Logged ${days} days ago`
  return `Logged ${Math.floor(days/7)} week${days > 13 ? 's' : ''} ago`
}

export default function Dashboard() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { toast, showToast } = useToast()
  const navigate = useNavigate()
  const isNarrow = useIsNarrow()

  // Get name from token
  const getName = () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return 'User'
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.name || 'User'
    } catch { return 'User' }
  }

  useEffect(() => {
    allItems()
      .then(res => setItems(res.data))
      .catch(() => showToast('Failed to load items', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleQuickSearch = () => {
    if (!search.trim()) return
    navigate(`/items?search=${encodeURIComponent(search.trim())}`)
  }

  const recent = items.slice(0, 4)
  const lastActivity = items[0]?.timestamp || null

  return (
    <div>
      <Navbar active="/" />
      <Toast toast={toast} />
      <div className="page">
        <div className="container">

          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={{ ...s.welcome, ...(isNarrow ? s.welcomeMobile : {}) }}>Welcome back, {getName().split(' ')[0]}</h1>
              <p style={{ color: '#6b7280', marginTop: 6 }}>Here's the latest status of your personal archive.</p>
            </div>
            <div style={{ ...s.headerRight, ...(isNarrow ? s.headerRightMobile : {}) }}>
              <div style={{ ...s.searchBar, ...(isNarrow ? s.searchBarMobile : {}) }}>
                <svg width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input style={s.searchInput} placeholder="Quick search..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQuickSearch()} />
              </div>
              <button className="btn-outline" onClick={handleQuickSearch}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                Quick Search
              </button>
            </div>
          </div>

          {/* Main grid */}
          <div style={{ ...s.mainGrid, ...(isNarrow ? s.mainGridMobile : {}) }}>
            {/* Stats card */}
            <div className="card" style={{ ...s.statsCard, ...(isNarrow ? s.statsCardMobile : {}) }}>
              <div style={s.statsTitle}>
                <svg width="18" height="18" fill="none" stroke="#1a6b52" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
                </svg>
                <span style={{ fontWeight: 600, color: '#1a6b52' }}>Memory Stats</span>
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={s.statLabel}>Total Items Logged</div>
                <div style={s.statNum}>{loading ? '...' : items.length}</div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={s.statLabel}>Last Activity</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {loading ? '...' : items.length > 0 ? timeAgo(items[0]?.timestamp).replace('Logged ', '') : 'No activity yet'}
                </div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e5e0da', margin: '0 0 20px' }} />
              <div>
                <div style={s.statLabel}>Top Category</div>
                <span className="tag green" style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/>
                    <rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  Manual
                </span>
              </div>
            </div>

            {/* Recent items */}
            <div style={{ flex: 1 }}>
              <div style={s.recentHeader}>
                <h2 style={s.sectionTitle}>Recent Items</h2>
                <button className="btn-ghost" style={{ color: '#1a6b52', fontWeight: 500 }} onClick={() => navigate('/items')}>
                  View All →
                </button>
              </div>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                  <span className="spinner dark" />
                </div>
              ) : recent.length === 0 ? (
                <div style={s.empty}>
                  <p style={{ color: '#9ca3af', marginBottom: 16 }}>No items logged yet.</p>
                  <button className="btn-primary" onClick={() => navigate('/add')}>+ Log first item</button>
                </div>
              ) : (
                <div style={{ ...s.recentGrid, ...(isNarrow ? s.recentGridMobile : {}) }}>
                  {recent.map((item, i) => (
                    <div key={i} className="card" style={s.recentCard}>
                      <div style={s.recentCardTop}>
                        <div>
                          <h3 style={s.itemName}>{item.item_name}</h3>
                          <div style={s.itemLoc}>
                            <svg width="13" height="13" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            {item.location}
                          </div>
                        </div>
                        <ItemIcon name={item.item_name} size={36} />
                      </div>
                      <span className="tag" style={{ fontSize: 11 }}>{timeAgo(item.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

const s = {
  header:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 },
  welcome:     { fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700 },
  welcomeMobile:{ fontSize: 28, lineHeight: 1.2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  headerRightMobile:{ width: '100%', flexDirection: 'column', alignItems: 'stretch' },
  searchBar:   { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #e5e0da', borderRadius: 8, padding: '8px 14px', minWidth: 220 },
  searchBarMobile:{ minWidth: 0, width: '100%' },
  searchInput: { border: 'none', background: 'transparent', padding: 0, fontSize: 14, outline: 'none', width: '100%' },
  mainGrid:    { display: 'flex', gap: 32, alignItems: 'flex-start' },
  mainGridMobile:{ flexDirection: 'column', gap: 22 },
  statsCard:   { width: 280, flexShrink: 0, padding: 28 },
  statsCardMobile:{ width: '100%' },
  statsTitle:  { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 },
  statLabel:   { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statNum:     { fontFamily: 'Playfair Display, serif', fontSize: 52, fontWeight: 700, lineHeight: 1, color: '#1a1a1a' },
  recentHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle:{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700 },
  recentGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  recentGridMobile:{ gridTemplateColumns: '1fr' },
  recentCard:  { padding: 20, cursor: 'default' },
  recentCardTop:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  itemName:    { fontSize: 17, fontWeight: 600, marginBottom: 6 },
  itemLoc:     { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6b7280' },
  empty:       { textAlign: 'center', padding: '60px 0' },
}
