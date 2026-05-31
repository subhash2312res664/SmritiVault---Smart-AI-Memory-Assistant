import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { itemHistory, allHistory } from '../api/index.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { ItemIcon } from '../components/ItemIcon.jsx'
import { Toast, useToast } from '../components/Toast.jsx'
import { useIsNarrow } from '../hooks/useMediaQuery.js'

const isAiLog = (type) => type === 'ai_detected' || String(type || '').startsWith('live_')

export default function ItemHistory() {
  const [feed, setFeed]           = useState([])
  const [selected, setSelected]   = useState(null)   // selected item name
  const [history, setHistory]     = useState(null)    // history data for selected
  const [feedLoading, setFeedLoading] = useState(true)
  const [histLoading, setHistLoading] = useState(false)
  const { toast, showToast }      = useToast()
  const navigate                  = useNavigate()
  const [searchParams]            = useSearchParams()
  const isNarrow                  = useIsNarrow()

  useEffect(() => {
    // Load all items feed
    allHistory()
      .then(res => {
        setFeed(res.data)
        // If URL has ?item=Keys, auto-select it
        const preselect = searchParams.get('item')
        if (preselect) loadHistory(preselect)
      })
      .catch(() => showToast('Failed to load history', 'error'))
      .finally(() => setFeedLoading(false))
  }, [])

  const loadHistory = async (itemName) => {
    setSelected(itemName)
    setHistory(null)
    setHistLoading(true)
    try {
      const res = await itemHistory(itemName)
      setHistory(res.data)
    } catch {
      showToast('Failed to load item history', 'error')
    } finally { setHistLoading(false) }
  }

  const logTypeBadge = (type) => {
    if (isAiLog(type)) return { label: 'AI Detection', bg: '#e8f4ef', color: '#1a6b52' }
    return { label: 'Manual Log', bg: '#eff6ff', color: '#1d4ed8' }
  }

  return (
    <div>
      <Navbar active="/history" />
      <Toast toast={toast} />
      <div className="page">
        <div style={{ ...s.container, ...(isNarrow ? s.containerMobile : {}) }}>

          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>Memory History</h1>
              <p style={s.sub}>Complete location timeline for all your items.</p>
            </div>
            <div style={{ ...s.stats, ...(isNarrow ? s.statsMobile : {}) }}>
              <div style={s.statBox}>
                <div style={s.statNum}>{feed.length}</div>
                <div style={s.statLabel}>items tracked</div>
              </div>
              <div style={s.statBox}>
                <div style={s.statNum}>{feed.reduce((acc, f) => acc + (f.total_moves || 0), 0) || '—'}</div>
                <div style={s.statLabel}>total moves</div>
              </div>
            </div>
          </div>

          <div style={{ ...s.layout, ...(isNarrow ? s.layoutMobile : {}) }}>

            {/* Left — item list */}
            <div style={s.sidebar}>
              <div style={s.sidebarHeader}>All items</div>
              {feedLoading ? (
                <div style={s.center}><span className="spinner dark" /></div>
              ) : feed.length === 0 ? (
                <div style={s.empty}>
                  <p style={{ color: '#9ca3af', fontSize: 13 }}>No items yet.</p>
                  <button className="btn-primary" style={{ marginTop: 12, fontSize: 13 }}
                    onClick={() => navigate('/add')}>+ Log first item</button>
                </div>
              ) : (
                <div style={s.itemList}>
                  {feed.map((item, i) => {
                    const badge = logTypeBadge(item.log_type)
                    const isActive = selected === item.item_name
                    return (
                      <div key={i} style={{ ...s.itemRow, ...(isActive ? s.itemRowActive : {}) }}
                        onClick={() => loadHistory(item.item_name)}>
                        <ItemIcon name={item.item_name} size={36} />
                        <div style={s.itemInfo}>
                          <div style={s.itemName}>{item.item_name}</div>
                          <div style={s.itemLoc}>
                            <svg width="11" height="11" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            {item.location}
                          </div>
                        </div>
                        <span style={{ ...s.badge, background: badge.bg, color: badge.color }}>
                          {isAiLog(item.log_type) ? 'AI' : 'M'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right — timeline */}
            <div style={s.timeline}>
              {!selected && (
                <div style={s.emptyTimeline}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🕐</div>
                  <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Select an item</h3>
                  <p style={{ color: '#9ca3af', fontSize: 14 }}>
                    Click any item on the left to see its full location history.
                  </p>
                </div>
              )}

              {selected && histLoading && (
                <div style={s.center}><span className="spinner dark" /></div>
              )}

              {selected && history && !histLoading && (
                <div>
                  {/* Item header */}
                  <div style={s.timelineHeader}>
                    <div style={{ ...s.timelineTop, ...(isNarrow ? s.timelineTopMobile : {}) }}>
                      <ItemIcon name={history.item_name} size={48} />
                      <div>
                        <h2 style={s.timelineTitle}>{history.item_name}</h2>
                        <div style={s.currentLoc}>
                          <svg width="13" height="13" fill="none" stroke="#1a6b52" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          <span>Current: <strong>{history.current_location}</strong></span>
                        </div>
                      </div>
                      <div style={{ ...s.movesBadge, ...(isNarrow ? s.movesBadgeMobile : {}) }}>
                        <div style={s.movesNum}>{history.total_moves}</div>
                        <div style={s.movesLabel}>total moves</div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline entries */}
                  {history.history.length === 0 ? (
                    <div style={s.empty}>
                      <p style={{ color: '#9ca3af' }}>No history yet for this item.</p>
                    </div>
                  ) : (
                    <div style={s.entries}>
                      {history.history.map((entry, i) => {
                        const badge = logTypeBadge(entry.log_type)
                        const isFirst = i === 0
                        return (
                          <div key={i} style={s.entry}>
                            {/* Timeline line + dot */}
                            <div style={s.entryLine}>
                              <div style={{
                                ...s.entryDot,
                                background: isFirst ? '#1a6b52' : '#d1ccc5',
                                border: isFirst ? '2px solid #1a6b52' : '2px solid #d1ccc5',
                              }} />
                              {i < history.history.length - 1 && (
                                <div style={s.entryConnector} />
                              )}
                            </div>

                            {/* Entry content */}
                            <div style={{ ...s.entryCard, ...(isFirst ? s.entryCardActive : {}) }}>
                              <div style={{ ...s.entryTop, ...(isNarrow ? s.entryTopMobile : {}) }}>
                                <div>
                                  <div style={s.entryTitle}>
                                    {i === 0 ? 'Moved to ' : 'Stored in '}
                                    <strong>{entry.location}</strong>
                                  </div>
                                  {entry.timestamp && (
                                    <div style={s.entryTime}>{entry.timestamp}</div>
                                  )}
                                  {entry.note && (
                                    <div style={s.entryNote}>{entry.note}</div>
                                  )}
                                </div>
                                <span style={{ ...s.badge, background: badge.bg, color: badge.color, fontSize: 11 }}>
                                  {badge.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
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
  container:      { maxWidth: 1100, margin: '0 auto', padding: '40px 48px' },
  containerMobile:{ padding: '28px 16px' },
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  title:          { fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, marginBottom: 6 },
  sub:            { color: '#6b7280', fontSize: 14 },
  stats:          { display: 'flex', gap: 16 },
  statsMobile:    { width: '100%', flexWrap: 'wrap' },
  statBox:        { background: '#fff', border: '1px solid #e5e0da', borderRadius: 10, padding: '14px 20px', textAlign: 'center', minWidth: 90 },
  statNum:        { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a6b52', lineHeight: 1 },
  statLabel:      { fontSize: 12, color: '#6b7280', marginTop: 4 },

  layout:         { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'flex-start' },
  layoutMobile:   { gridTemplateColumns: '1fr' },

  sidebar:        { background: '#fff', border: '1px solid #e5e0da', borderRadius: 12, overflow: 'hidden' },
  sidebarHeader:  { padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '1px solid #f0ede8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  itemList:       { maxHeight: 600, overflowY: 'auto' },
  itemRow:        { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #f9f7f5', transition: 'background 0.15s' },
  itemRowActive:  { background: '#e8f4ef' },
  itemInfo:       { flex: 1, minWidth: 0 },
  itemName:       { fontWeight: 600, fontSize: 14, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemLoc:        { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' },
  badge:          { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, flexShrink: 0 },

  timeline:       { background: '#fff', border: '1px solid #e5e0da', borderRadius: 12, minHeight: 480, padding: 28 },
  emptyTimeline:  { textAlign: 'center', padding: '80px 0' },
  timelineHeader: { marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #f0ede8' },
  timelineTop:    { display: 'flex', alignItems: 'center', gap: 16 },
  timelineTopMobile:{ flexWrap: 'wrap' },
  timelineTitle:  { fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, marginBottom: 6 },
  currentLoc:     { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#1a6b52' },
  movesBadge:     { marginLeft: 'auto', textAlign: 'center', background: '#e8f4ef', borderRadius: 10, padding: '12px 20px' },
  movesBadgeMobile:{ marginLeft: 0 },
  movesNum:       { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a6b52', lineHeight: 1 },
  movesLabel:     { fontSize: 12, color: '#6b7280', marginTop: 4 },

  entries:        { display: 'flex', flexDirection: 'column', gap: 0 },
  entry:          { display: 'flex', gap: 16 },
  entryLine:      { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 },
  entryDot:       { width: 14, height: 14, borderRadius: '50%', marginTop: 18, flexShrink: 0 },
  entryConnector: { width: 2, flex: 1, background: '#e5e0da', minHeight: 24 },
  entryCard:      { flex: 1, background: '#f9f9f7', border: '1px solid #f0ede8', borderRadius: 10, padding: '16px 18px', marginBottom: 12 },
  entryCardActive:{ background: '#e8f4ef', borderColor: '#c6e9df' },
  entryTop:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  entryTopMobile: { flexDirection: 'column' },
  entryTitle:     { fontSize: 15, color: '#1a1a1a', marginBottom: 6 },
  entryTime:      { fontSize: 12, color: '#9ca3af' },
  entryNote:      { fontSize: 13, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },

  center:         { display: 'flex', justifyContent: 'center', padding: 60 },
  empty:          { textAlign: 'center', padding: '40px 0' },
}
