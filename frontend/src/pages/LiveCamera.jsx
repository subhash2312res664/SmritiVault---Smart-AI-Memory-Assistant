import { useState, useRef, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { Toast, useToast } from '../components/Toast.jsx'
import { useIsNarrow } from '../hooks/useMediaQuery.js'

const WS_URL  = 'ws://localhost:8000/ws/live_detect'
const FPS     = 1500   // send frame every 1.5 seconds

export default function LiveCamera() {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)        // hidden canvas for frame capture
  const overlayRef  = useRef(null)        // visible canvas for bounding boxes
  const wsRef       = useRef(null)
  const intervalRef = useRef(null)

  const [stream, setStream]       = useState(null)
  const [running, setRunning]     = useState(false)
  const [location, setLocation]   = useState('Study Table')
  const [events, setEvents]       = useState([])          // auto-log events
  const [detected, setDetected]   = useState([])          // current frame detections
  const [frameCount, setFrameCount] = useState(0)
  const [wsStatus, setWsStatus]   = useState('disconnected') // connected|disconnected|connecting
  const [annotatedSrc, setAnnotatedSrc] = useState(null)
  const { toast, showToast }      = useToast()
  const isNarrow                  = useIsNarrow()

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll()
  }, [])

  const stopAll = () => {
    clearInterval(intervalRef.current)
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    if (stream) stream.getTracks().forEach(t => t.stop())
  }

  const startLive = async () => {
    if (!location.trim()) { showToast('Enter the camera location first', 'error'); return }

    // Start camera
    let liveStream
    try {
      liveStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' }
      })
      videoRef.current.srcObject = liveStream
      setStream(liveStream)
    } catch {
      showToast('Camera access denied', 'error'); return
    }

    // Connect WebSocket
    const token = localStorage.getItem('token')
    const ws    = new WebSocket(
      `${WS_URL}?token=${encodeURIComponent(token)}&location=${encodeURIComponent(location)}`
    )
    wsRef.current = ws
    setWsStatus('connecting')

    ws.onopen = () => {
      setWsStatus('connected')
      setRunning(true)
      showToast('Live detection started!')
      startSendingFrames(ws)
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'pong') return

      // Update annotated frame
      if (data.annotated) setAnnotatedSrc(data.annotated)

      // Update current detections list
      if (data.detected) setDetected(data.detected)

      // Add new events to feed
      if (data.events && data.events.length > 0) {
        setEvents(prev => [...data.events.reverse(), ...prev].slice(0, 50))
        data.events.forEach(ev => {
          if (ev.event === 'placed') showToast(`📍 ${ev.item} placed at ${location}`)
          else showToast(`✋ ${ev.item} picked up from ${location}`)
        })
      }

      setFrameCount(c => c + 1)
    }

    ws.onerror = () => {
      setWsStatus('disconnected')
      showToast('WebSocket error. Is backend running?', 'error')
    }

    ws.onclose = () => {
      setWsStatus('disconnected')
      setRunning(false)
    }
  }

  const startSendingFrames = (ws) => {
    const canvas  = canvasRef.current
    const video   = videoRef.current
    const ctx     = canvas.getContext('2d')

    intervalRef.current = setInterval(() => {
      if (!video || video.readyState < 2) return
      if (ws.readyState !== WebSocket.OPEN) return

      canvas.width  = video.videoWidth  || 640
      canvas.height = video.videoHeight || 480
      ctx.drawImage(video, 0, 0)

      const b64 = canvas.toDataURL('image/jpeg', 0.7)
      ws.send(JSON.stringify({ frame: b64 }))
    }, FPS)
  }

  const stopLive = () => {
    clearInterval(intervalRef.current)
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null) }
    setRunning(false)
    setWsStatus('disconnected')
    setAnnotatedSrc(null)
    setDetected([])
    showToast('Live detection stopped.')
  }

  const statusColor = {
    connected:    '#16a34a',
    connecting:   '#d97706',
    disconnected: '#6b7280',
  }

  return (
    <div>
      <Navbar active="/live" />
      <Toast toast={toast} />
      <div className="page">
        <div style={{ ...s.container, ...(isNarrow ? s.containerMobile : {}) }}>

          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>Live Camera Detection</h1>
              <p style={s.sub}>
                Camera watches continuously — auto-logs when items are placed or picked up.
              </p>
            </div>

            {/* Status badge */}
            <div style={{ ...s.statusBadge, borderColor: statusColor[wsStatus] }}>
              <div style={{ ...s.statusDot, background: statusColor[wsStatus],
                animation: wsStatus === 'connected' ? 'pulse 1.5s infinite' : 'none' }} />
              <span style={{ color: statusColor[wsStatus], fontWeight: 600, fontSize: 13 }}>
                {wsStatus === 'connected'    ? 'Live — Detecting'   :
                 wsStatus === 'connecting'   ? 'Connecting...'      : 'Stopped'}
              </span>
            </div>
          </div>

          <div style={{ ...s.grid, ...(isNarrow ? s.gridMobile : {}) }}>

            {/* ── Left: camera feed ── */}
            <div style={s.left}>

              {/* Video / annotated feed */}
              <div style={{ ...s.feedBox, ...(isNarrow ? s.feedBoxMobile : {}) }}>
                {/* Live video (hidden when annotated is available) */}
                <video ref={videoRef} autoPlay playsInline muted
                  style={{ width: '100%', borderRadius: 10, display: annotatedSrc ? 'none' : 'block' }} />

                {/* Annotated frame from backend */}
                {annotatedSrc && (
                  <img src={annotatedSrc} alt="live detection"
                    style={{ width: '100%', borderRadius: 10, display: 'block' }} />
                )}

                {/* Hidden canvases */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <canvas ref={overlayRef} style={{ display: 'none' }} />

                {!running && !annotatedSrc && (
                  <div style={s.placeholder}>
                    <div style={s.placeholderIcon}>📷</div>
                    <p style={s.placeholderText}>Camera feed will appear here</p>
                    <p style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                      Enter a location and click Start
                    </p>
                  </div>
                )}

                {/* Frame counter overlay */}
                {running && (
                  <div style={s.frameCounter}>
                    ● REC &nbsp; {frameCount} frames
                  </div>
                )}
              </div>

              {/* Location input */}
              <div style={s.locRow}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>📍 Camera is watching:</label>
                  <input
                    placeholder="e.g. Study Table, Bedroom Shelf..."
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    disabled={running}
                  />
                </div>
              </div>

              {/* Controls */}
              <div style={s.controls}>
                {!running ? (
                  <button className="btn-primary" style={s.bigBtn} onClick={startLive}>
                    ▶ Start Live Detection
                  </button>
                ) : (
                  <button className="btn-danger" style={{ ...s.bigBtn, border: '1.5px solid #dc2626', color: '#dc2626' }}
                    onClick={stopLive}>
                    ⏹ Stop Detection
                  </button>
                )}
              </div>

              {/* How it works */}
              <div style={s.howBox}>
                <div style={s.howTitle}>How it works</div>
                <div style={s.howSteps}>
                  {[
                    ['📷', 'Camera captures frame every 1.5s'],
                    ['🤖', 'YOLO detects objects in real time'],
                    ['📍', 'Item placed → auto-logged to database'],
                    ['✋', 'Item picked up → state change recorded'],
                  ].map(([icon, text]) => (
                    <div key={text} style={s.howStep}>
                      <span style={s.howIcon}>{icon}</span>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: detections + events ── */}
            <div style={s.right}>

              {/* Currently visible items */}
              <div className="card" style={s.panel}>
                <div style={s.panelHeader}>
                  <span style={s.panelTitle}>Now Visible</span>
                  <span style={s.panelCount}>{detected.length} item{detected.length !== 1 ? 's' : ''}</span>
                </div>
                {detected.length === 0 ? (
                  <div style={s.panelEmpty}>
                    {running ? 'Scanning...' : 'Start detection to see items'}
                  </div>
                ) : (
                  <div style={s.detectedList}>
                    {detected.map((item, i) => (
                      <div key={i} style={s.detectedItem}>
                        <div style={s.detectedName}>{item.name}</div>
                        <span style={s.confBadge}>{item.conf}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-log event feed */}
              <div className="card" style={{ ...s.panel, flex: 1 }}>
                <div style={s.panelHeader}>
                  <span style={s.panelTitle}>Auto-Log Feed</span>
                  {events.length > 0 && (
                    <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }}
                      onClick={() => setEvents([])}>
                      Clear
                    </button>
                  )}
                </div>

                {events.length === 0 ? (
                  <div style={s.panelEmpty}>
                    Events will appear here when items are placed or picked up.
                  </div>
                ) : (
                  <div style={s.eventList}>
                    {events.map((ev, i) => (
                      <div key={i} style={s.eventItem}>
                        <div style={s.eventIconWrap}>
                          <span style={s.eventIcon}>
                            {ev.event === 'placed' ? '📍' : '✋'}
                          </span>
                          {i < events.length - 1 && <div style={s.eventLine} />}
                        </div>
                        <div style={s.eventContent}>
                          <div style={s.eventLabel}>
                            <strong>{ev.item}</strong>
                            {ev.event === 'placed'
                              ? <span style={{ color: '#16a34a' }}> placed down</span>
                              : <span style={{ color: '#dc2626' }}> picked up</span>
                            }
                          </div>
                          <div style={s.eventMeta}>
                            {ev.time}
                            {ev.conf && <span style={s.confTag}>{ev.conf}</span>}
                            <span style={{
                              ...s.logTypeBadge,
                              background: ev.event === 'placed' ? '#e8f4ef' : '#fef2f2',
                              color:      ev.event === 'placed' ? '#1a6b52'  : '#dc2626',
                            }}>
                              {ev.event === 'placed' ? 'Auto-logged ✓' : 'State change ✓'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detectable items reference */}
              <div className="card" style={s.panel}>
                <div style={s.panelHeader}>
                  <span style={s.panelTitle}>Detectable Items</span>
                </div>
                <div style={s.tagWrap}>
                  {['Phone', 'Laptop', 'Keyboard', 'Mouse', 'Book', 'Backpack',
                    'Bottle', 'Cup', 'Remote', 'Umbrella', 'Clock', 'Scissors'].map(item => (
                    <span key={item} className="tag" style={{ fontSize: 11 }}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
      <Footer />
    </div>
  )
}

const s = {
  container:     { maxWidth: 1200, margin: '0 auto', padding: '40px 48px' },
  containerMobile:{ padding: '28px 16px' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  title:         { fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, marginBottom: 6 },
  sub:           { color: '#6b7280', fontSize: 14, maxWidth: 500 },

  statusBadge:   { display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid', borderRadius: 100, padding: '8px 16px' },
  statusDot:     { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },

  grid:          { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'flex-start' },
  gridMobile:    { gridTemplateColumns: '1fr' },
  left:          { display: 'flex', flexDirection: 'column', gap: 16 },
  right:         { display: 'flex', flexDirection: 'column', gap: 16 },

  feedBox:       { background: '#1a1a1a', borderRadius: 12, overflow: 'hidden', minHeight: 360, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  feedBoxMobile: { minHeight: 230 },
  placeholder:   { textAlign: 'center', padding: 48, color: '#fff' },
  placeholderIcon: { fontSize: 52, marginBottom: 12 },
  placeholderText: { color: '#9ca3af', fontSize: 15 },
  frameCounter:  { position: 'absolute', top: 12, left: 12, background: 'rgba(220,38,38,0.85)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 100 },

  locRow:        { display: 'flex', gap: 10, alignItems: 'flex-end' },
  label:         { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 },
  controls:      {},
  bigBtn:        { width: '100%', padding: '14px', fontSize: 15, fontWeight: 600 },

  howBox:        { background: '#f9f9f7', border: '1px solid #f0ede8', borderRadius: 10, padding: 16 },
  howTitle:      { fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 },
  howSteps:      { display: 'flex', flexDirection: 'column', gap: 10 },
  howStep:       { display: 'flex', alignItems: 'center', gap: 10 },
  howIcon:       { fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 },

  panel:         { padding: 0, overflow: 'hidden' },
  panelHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f0ede8' },
  panelTitle:    { fontWeight: 600, fontSize: 14 },
  panelCount:    { fontSize: 13, color: '#9ca3af' },
  panelEmpty:    { padding: '24px 16px', color: '#9ca3af', fontSize: 13, textAlign: 'center' },

  detectedList:  { padding: '8px 0' },
  detectedItem:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f9f7f5' },
  detectedName:  { fontWeight: 600, fontSize: 14 },
  confBadge:     { fontSize: 12, fontWeight: 700, color: '#1a6b52', background: '#e8f4ef', padding: '2px 8px', borderRadius: 100 },

  eventList:     { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 360, overflowY: 'auto' },
  eventItem:     { display: 'flex', gap: 12 },
  eventIconWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 },
  eventIcon:     { fontSize: 18, marginTop: 2 },
  eventLine:     { width: 2, flex: 1, background: '#f0ede8', minHeight: 16, margin: '4px 0' },
  eventContent:  { flex: 1, paddingBottom: 14 },
  eventLabel:    { fontSize: 14, marginBottom: 4 },
  eventMeta:     { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  confTag:       { fontSize: 11, color: '#1a6b52', fontWeight: 600 },
  logTypeBadge:  { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100 },
  eventTime:     { fontSize: 12, color: '#9ca3af' },

  tagWrap:       { padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 },
}
