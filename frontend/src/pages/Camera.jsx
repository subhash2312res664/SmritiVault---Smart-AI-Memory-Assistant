import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { Toast, useToast } from '../components/Toast.jsx'
import { useIsNarrow } from '../hooks/useMediaQuery.js'

const API = 'http://localhost:8000'

export default function Camera() {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const [stream, setStream]       = useState(null)
  const [camOn, setCamOn]         = useState(false)
  const [photo, setPhoto]         = useState(null)      // blob
  const [photoURL, setPhotoURL]   = useState(null)      // preview url
  const [annotated, setAnnotated] = useState(null)      // annotated image from backend
  const [location, setLocation]   = useState('')
  const [results, setResults]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [history, setHistory]     = useState([])
  const [histLoading, setHistLoading] = useState(true)
  const [tab, setTab]             = useState('camera')  // 'camera' | 'history'
  const { toast, showToast }      = useToast()
  const navigate                  = useNavigate()
  const isNarrow                  = useIsNarrow()

  // Load detection history on mount
  useEffect(() => {
    fetchHistory()
    return () => stopCamera()   // cleanup on unmount
  }, [])

  const fetchHistory = async () => {
    setHistLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/detection_history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setHistory(Array.isArray(data) ? data : [])
    } catch { showToast('Failed to load history', 'error') }
    finally { setHistLoading(false) }
  }

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      videoRef.current.srcObject = s
      setStream(s)
      setCamOn(true)
      setPhoto(null); setPhotoURL(null); setAnnotated(null); setResults(null)
    } catch (err) {
      showToast('Camera access denied. Please allow camera permission.', 'error')
    }
  }

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop())
    setStream(null)
    setCamOn(false)
  }

  const capturePhoto = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      setPhoto(blob)
      setPhotoURL(URL.createObjectURL(blob))
      setAnnotated(null)
      setResults(null)
    }, 'image/jpeg', 0.92)
    stopCamera()
    showToast('Photo captured!')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoURL(URL.createObjectURL(file))
    setAnnotated(null); setResults(null)
  }

  const detectItems = async () => {
    if (!photo)         { showToast('Capture or upload a photo first', 'error'); return }
    if (!location.trim()) { showToast('Enter the location', 'error'); return }
    setLoading(true); setResults(null); setAnnotated(null)

    try {
      const token = localStorage.getItem('token')
      const form  = new FormData()
      form.append('file', photo, 'capture.jpg')

      const res = await fetch(
        `${API}/detect_items?location=${encodeURIComponent(location.trim())}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
      )

      if (!res.ok) {
        const err = await res.json()
        showToast(err.detail || 'Detection failed', 'error')
        return
      }

      const data = await res.json()
      setResults(data)
      if (data.annotated_image) setAnnotated(data.annotated_image)
      if (data.detected_count > 0) {
        showToast(`${data.detected_count} item(s) detected and logged!`)
        fetchHistory()
      } else {
        showToast('No items detected. Try better lighting.', 'error')
      }
    } catch {
      showToast('Detection failed. Is the backend running?', 'error')
    } finally { setLoading(false) }
  }

  const reset = () => {
    setPhoto(null); setPhotoURL(null); setAnnotated(null)
    setResults(null); setLocation('')
  }

  return (
    <div>
      <Navbar active="/camera" />
      <Toast toast={toast} />

      <div style={s.page}>
        <div style={{ ...s.container, ...(isNarrow ? s.containerMobile : {}) }}>

          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>AI Camera Detection</h1>
              <p style={s.sub}>Point your camera at objects — YOLO will auto-detect and log them for you.</p>
            </div>
            <div style={s.badge}>
              <span style={s.dot} />
              YOLO v8 · OpenCV
            </div>
          </div>

          {/* Tabs */}
          <div style={{ ...s.tabs, ...(isNarrow ? s.tabsMobile : {}) }}>
            {['camera', 'history'].map(t => (
              <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
                onClick={() => setTab(t)}>
                {t === 'camera' ? '📷 Detect' : `📋 History (${history.length})`}
              </button>
            ))}
          </div>

          {/* ───── CAMERA TAB ───── */}
          {tab === 'camera' && (
            <div style={{ ...s.grid, ...(isNarrow ? s.gridMobile : {}) }}>

              {/* Left — camera + photo */}
              <div style={s.left}>

                {/* Video / photo preview */}
                <div style={{ ...s.previewBox, ...(isNarrow ? s.previewBoxMobile : {}) }}>
                  <video ref={videoRef} autoPlay playsInline
                    style={{ width: '100%', borderRadius: 10, display: camOn ? 'block' : 'none' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {annotated ? (
                    <img src={annotated} alt="annotated" style={s.previewImg} />
                  ) : photoURL ? (
                    <img src={photoURL} alt="captured" style={s.previewImg} />
                  ) : !camOn && (
                    <div style={s.placeholder}>
                      <div style={s.placeholderIcon}>📷</div>
                      <p style={s.placeholderText}>Start camera or upload an image</p>
                    </div>
                  )}
                </div>

                {/* Camera controls */}
                <div style={s.controls}>
                  {!camOn ? (
                    <button className="btn-primary" onClick={startCamera}>▶ Start Camera</button>
                  ) : (
                    <>
                      <button className="btn-primary" onClick={capturePhoto}>📸 Capture</button>
                      <button className="btn-outline" onClick={stopCamera}>⏹ Stop</button>
                    </>
                  )}

                  <label style={s.uploadLabel}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                    📁 Upload Image
                  </label>

                  {(photo || results) && (
                    <button className="btn-ghost" onClick={reset}>✕ Reset</button>
                  )}
                </div>
              </div>

              {/* Right — detect panel */}
              <div style={s.right}>
                <div className="card" style={s.detectCard}>
                  <h3 style={s.cardTitle}>Detection Settings</h3>

                  {/* Location input */}
                  <div style={s.group}>
                    <label style={s.label}>📍 Where is the camera pointing?</label>
                    <input
                      placeholder="e.g. Study Table, Bedroom Shelf..."
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                    />
                    <p style={s.hint}>Detected items will be logged to this location.</p>
                  </div>

                  {/* Photo status */}
                  <div style={s.statusBox}>
                    <div style={{ ...s.statusDot, background: photo ? '#16a34a' : '#d1d5db' }} />
                    <span style={{ fontSize: 13, color: photo ? '#16a34a' : '#9ca3af' }}>
                      {photo ? 'Image ready for detection' : 'No image captured yet'}
                    </span>
                  </div>

                  {/* Detect button */}
                  <button
                    className="btn-primary"
                    style={s.detectBtn}
                    onClick={detectItems}
                    disabled={loading || !photo}
                  >
                    {loading
                      ? <><span className="spinner" /> Detecting...</>
                      : '🔍 Detect & Log Items'
                    }
                  </button>

                  {/* Results */}
                  {results && (
                    <div style={s.results}>
                      <div style={s.resultsHeader}>
                        <span style={s.resultsTitle}>Results</span>
                        <span style={{
                          fontSize: 13, fontWeight: 600,
                          color: results.detected_count > 0 ? '#16a34a' : '#dc2626'
                        }}>
                          {results.detected_count} found
                        </span>
                      </div>

                      {results.detected_count === 0 ? (
                        <div style={s.noResult}>
                          <p>No items detected.</p>
                          <p style={{ fontSize: 12, marginTop: 4 }}>Try: better lighting, move closer, or different angle.</p>
                        </div>
                      ) : (
                        results.items.map((item, i) => (
                          <div key={i} style={s.resultItem}>
                            <div>
                              <div style={s.resultName}>{item.item}</div>
                              <div style={s.resultLoc}>📍 {item.location}</div>
                              <div style={s.resultTime}>{item.logged_at}</div>
                            </div>
                            <div style={s.resultConf}>
                              <div style={{ color: '#1a6b52', fontWeight: 700, fontSize: 16 }}>{item.confidence}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>AI ✓</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Supported items list */}
                  <div style={s.supported}>
                    <p style={s.supportedTitle}>Detectable Items</p>
                    <div style={s.tags}>
                      {['Phone', 'Laptop', 'Keys', 'Wallet', 'Backpack', 'Book', 'Bottle', 'Cup', 'Remote', 'Keyboard', 'Mouse', 'Umbrella', 'Clock', 'Scissors'].map(item => (
                        <span key={item} className="tag" style={{ fontSize: 11 }}>{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───── HISTORY TAB ───── */}
          {tab === 'history' && (
            <div>
              <div style={{ ...s.histHeader, ...(isNarrow ? s.histHeaderMobile : {}) }}>
                <h2 style={s.histTitle}>AI Detection History</h2>
                <button className="btn-outline" style={{ fontSize: 13 }} onClick={fetchHistory}>↻ Refresh</button>
              </div>

              {histLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner dark" /></div>
              ) : history.length === 0 ? (
                <div style={s.empty}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                  <p style={{ color: '#9ca3af' }}>No AI detections yet. Use the camera to detect items!</p>
                  <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setTab('camera')}>
                    Go to Camera
                  </button>
                </div>
              ) : (
                <div style={s.histGrid}>
                  {history.map((item, i) => (
                    <div key={i} className="card" style={s.histCard}>
                      <div style={s.histCardTop}>
                        <div style={s.histIcon}>🤖</div>
                        <span className="tag" style={{ background: '#e8f4ef', color: '#1a6b52', fontSize: 11 }}>
                          AI Detected
                        </span>
                      </div>
                      <div style={s.histName}>{item.item_name}</div>
                      <div style={s.histLoc}>
                        <svg width="12" height="12" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {item.location}
                      </div>
                      <div style={s.histMeta}>
                        <span>{item.confidence ? `Confidence: ${Math.round(item.confidence * 100)}%` : ''}</span>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{item.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

const s = {
  page:          { minHeight: 'calc(100vh - 60px)' },
  container:     { maxWidth: 1100, margin: '0 auto', padding: '40px 48px' },
  containerMobile:{ padding: '28px 16px' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  title:         { fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, marginBottom: 6 },
  sub:           { color: '#6b7280', fontSize: 14 },
  badge:         { display: 'flex', alignItems: 'center', gap: 8, background: '#e8f4ef', color: '#1a6b52', fontWeight: 600, fontSize: 13, padding: '8px 16px', borderRadius: 100 },
  dot:           { width: 8, height: 8, borderRadius: '50%', background: '#16a34a', flexShrink: 0 },

  tabs:          { display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #e5e0da', paddingBottom: 0 },
  tabsMobile:    { overflowX: 'auto' },
  tab:           { background: 'none', border: 'none', padding: '10px 20px', fontSize: 14, color: '#6b7280', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabActive:     { color: '#1a6b52', fontWeight: 600, borderBottomColor: '#1a6b52' },

  grid:          { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'flex-start' },
  gridMobile:    { gridTemplateColumns: '1fr' },
  left:          {},
  right:         {},

  previewBox:    { background: '#1a1a1a', borderRadius: 12, overflow: 'hidden', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  previewBoxMobile:{ minHeight: 220 },
  previewImg:    { width: '100%', borderRadius: 12, display: 'block' },
  placeholder:   { textAlign: 'center', padding: 48 },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderText: { color: '#6b7280', fontSize: 14 },

  controls:      { display: 'flex', gap: 10, flexWrap: 'wrap' },
  uploadLabel:   { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'transparent', border: '1.5px solid #d1ccc5', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#374151', transition: 'all 0.15s' },

  detectCard:    { padding: 24 },
  cardTitle:     { fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, marginBottom: 20 },
  group:         { marginBottom: 16 },
  label:         { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 },
  hint:          { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  statusBox:     { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f9f9f7', borderRadius: 8, marginBottom: 16 },
  statusDot:     { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  detectBtn:     { width: '100%', padding: '13px', fontSize: 15, marginBottom: 20 },

  results:       { background: '#f9f9f7', borderRadius: 10, padding: 16, marginBottom: 16 },
  resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultsTitle:  { fontWeight: 600, fontSize: 14 },
  noResult:      { color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '12px 0' },
  resultItem:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0ede8' },
  resultName:    { fontWeight: 600, fontSize: 14, marginBottom: 3 },
  resultLoc:     { fontSize: 12, color: '#6b7280' },
  resultTime:    { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  resultConf:    { textAlign: 'right' },

  supported:     { paddingTop: 16, borderTop: '1px solid #f0ede8' },
  supportedTitle:{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' },
  tags:          { display: 'flex', flexWrap: 'wrap', gap: 6 },

  histHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  histHeaderMobile:{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 },
  histTitle:     { fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700 },
  histGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  histCard:      { padding: 18 },
  histCardTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  histIcon:      { fontSize: 24 },
  histName:      { fontWeight: 600, fontSize: 16, marginBottom: 8 },
  histLoc:       { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', marginBottom: 10 },
  histMeta:      { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', paddingTop: 10, borderTop: '1px solid #f0ede8' },
  empty:         { textAlign: 'center', padding: '80px 0' },
}
