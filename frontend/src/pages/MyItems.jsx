import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { allItems, deleteItem, updateItem } from '../api/index.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { ItemIcon } from '../components/ItemIcon.jsx'
import { Toast, useToast } from '../components/Toast.jsx'
import { useIsNarrow } from '../hooks/useMediaQuery.js'

const PER_PAGE = 9
const isAiLog = (type) => type === 'ai_detected' || String(type || '').startsWith('live_')
const logTypeLabel = (type) => isAiLog(type) ? 'AI DETECTED' : 'MANUAL'

export default function MyItems() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [editItem, setEditItem]   = useState(null)
  const [editLoc, setEditLoc]     = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const { toast, showToast }      = useToast()
  const navigate                  = useNavigate()
  const [searchParams]            = useSearchParams()
  const isNarrow                  = useIsNarrow()

  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearch(q)
    allItems()
      .then(res => setItems(res.data))
      .catch(() => showToast('Failed to load', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered  = items.filter(item =>
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    item.location.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleDelete = async (name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await deleteItem(name)
      showToast(`"${name}" deleted`)
      setItems(items.filter(i => i.item_name !== name))
    } catch { showToast('Delete failed', 'error') }
  }

  const handleUpdate = async () => {
    if (!editLoc.trim()) { showToast('Enter location', 'error'); return }
    setEditLoading(true)
    try {
      await updateItem(editItem, { location: editLoc })
      showToast('Updated!')
      setItems(items.map(i => i.item_name === editItem ? { ...i, location: editLoc } : i))
      setEditItem(null)
    } catch { showToast('Update failed', 'error') }
    finally { setEditLoading(false) }
  }

  return (
    <div>
      <Navbar active="/items" />
      <Toast toast={toast} />

      {/* Edit modal */}
      {editItem && (
        <div style={modal.overlay} onClick={() => setEditItem(null)}>
          <div style={{ ...modal.box, ...(isNarrow ? modal.boxMobile : {}) }} onClick={e => e.stopPropagation()}>
            <h3 style={modal.title}>Update location</h3>
            <p style={modal.item}>✎ {editItem}</p>
            <label style={modal.label}>New location</label>
            <input placeholder="e.g. Bedroom shelf" value={editLoc}
              onChange={e => setEditLoc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
            <div style={modal.btns}>
              <button className="btn-outline" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdate} disabled={editLoading}>
                {editLoading ? <span className="spinner" /> : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page">
        <div className="container">
          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>My Items</h1>
              <p style={s.sub}>A comprehensive view of all your securely logged physical assets.</p>
            </div>
            <div style={{ ...s.headerRight, ...(isNarrow ? s.headerRightMobile : {}) }}>
              <div style={{ ...s.searchWrap, ...(isNarrow ? s.searchWrapMobile : {}) }}>
                <svg width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input style={s.searchInput} placeholder="Search items..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
              </div>
              <button className="btn-outline" onClick={() => navigate('/history')}>🕐 History</button>
              <button className="btn-primary" onClick={() => navigate('/add')}>
                + New Item
              </button>
            </div>
          </div>

          {!loading && (
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}{search ? ` matching "${search}"` : ' total'}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
              <span className="spinner dark" />
            </div>
          ) : paginated.length === 0 ? (
            <div style={s.empty}>
              <p style={{ color: '#9ca3af', marginBottom: 16 }}>{search ? 'No items match.' : 'No items yet.'}</p>
              {!search && <button className="btn-primary" onClick={() => navigate('/add')}>+ Log first item</button>}
            </div>
          ) : (
            <div style={{ ...s.grid, ...(isNarrow ? s.gridMobile : {}) }}>
              {paginated.map((item, i) => (
                <div key={i} className="card" style={s.card}>
                  <div style={s.cardTop}>
                    <ItemIcon name={item.item_name} size={44} />
                    <div style={s.menu}>
                      <button style={s.menuBtn} title="History"
                        onClick={() => navigate(`/history?item=${encodeURIComponent(item.item_name)}`)}>
                        🕐
                      </button>
                      <button style={s.menuBtn} onClick={() => { setEditItem(item.item_name); setEditLoc(item.location) }} title="Edit">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/>
                        </svg>
                      </button>
                      <button style={{ ...s.menuBtn, color: '#dc2626' }} onClick={() => handleDelete(item.item_name)} title="Delete">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 style={s.itemName}>{item.item_name}</h3>
                  <p style={s.itemDesc}>{isAiLog(item.log_type) ? '🤖 AI Detected' : '✍️ Manual log'}</p>
                  <div style={s.itemLoc}>
                    <svg width="13" height="13" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {item.location}
                  </div>
                  <div style={{ ...s.cardFooter, ...(isNarrow ? s.cardFooterMobile : {}) }}>
                    <span className="tag" style={{
                      fontSize: 10,
                      background: isAiLog(item.log_type) ? '#e8f4ef' : '#f0f0f0',
                      color:      isAiLog(item.log_type) ? '#1a6b52' : '#6b7280',
                    }}>
                      {logTypeLabel(item.log_type)}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>
                      {item.timestamp || ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={s.pagination}>
              <button className="btn-outline" style={{ padding: '8px 14px' }}
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              <span style={{ fontSize: 14, color: '#6b7280' }}>Page {page} of {totalPages}</span>
              <button className="btn-outline" style={{ padding: '8px 14px' }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

const s = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 16 },
  title:       { fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700 },
  sub:         { color: '#6b7280', fontSize: 14, marginTop: 4 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  headerRightMobile:{ width: '100%', flexWrap: 'wrap', alignItems: 'stretch' },
  searchWrap:  { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #e5e0da', borderRadius: 8, padding: '8px 14px', minWidth: 240 },
  searchWrapMobile:{ minWidth: 0, width: '100%' },
  searchInput: { border: 'none', background: 'transparent', padding: 0, fontSize: 14, outline: 'none', width: '100%' },
  empty:       { textAlign: 'center', padding: '80px 0' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 },
  gridMobile:  { gridTemplateColumns: '1fr' },
  card:        { padding: 20 },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  menu:        { display: 'flex', gap: 4 },
  menuBtn:     { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px 6px', borderRadius: 6, fontSize: 14, transition: 'all 0.15s' },
  itemName:    { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  itemDesc:    { fontSize: 13, color: '#9ca3af', marginBottom: 10 },
  itemLoc:     { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6b7280', marginBottom: 14 },
  cardFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f0ede8' },
  cardFooterMobile:{ flexWrap: 'wrap', gap: 8 },
  pagination:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 16 },
}

const modal = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  box:     { background: '#fff', borderRadius: 14, padding: 32, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  boxMobile:{ width: 'calc(100vw - 32px)', padding: 22 },
  title:   { fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, marginBottom: 8 },
  item:    { color: '#1a6b52', fontWeight: 600, fontSize: 16, marginBottom: 20 },
  label:   { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 },
  btns:    { display: 'flex', gap: 10, marginTop: 20 },
}
