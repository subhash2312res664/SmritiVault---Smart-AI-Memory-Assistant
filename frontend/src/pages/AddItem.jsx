import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logItem } from '../api/index.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { Toast, useToast } from '../components/Toast.jsx'

const CATEGORIES = ['Electronics', 'Documents', 'Access', 'Clothing', 'Personal', 'Kitchen', 'Travel', 'Other']

export default function AddItem() {
  const [form, setForm]       = useState({ item_name: '', location: '', category: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [photo, setPhoto]     = useState(null)
  const [drag, setDrag]       = useState(false)
  const { toast, showToast }  = useToast()
  const navigate              = useNavigate()

  const handleSubmit = async () => {
    if (!form.item_name.trim()) { showToast('Enter item name', 'error'); return }
    if (!form.location.trim()) { showToast('Enter location', 'error'); return }
    setLoading(true)
    try {
      const res = await logItem({
        item_name: form.item_name.trim(),
        location:  form.location.trim(),
        log_type:  'manual',
      })
      showToast(res.data.message || 'Item saved!')
      setTimeout(() => navigate('/items'), 1000)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save', 'error')
    } finally { setLoading(false) }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) setPhoto(URL.createObjectURL(file))
  }

  return (
    <div>
      <Navbar active="/add" />
      <Toast toast={toast} />
      <div className="page">
        <div style={s.container}>
          <h1 style={s.title}>Log New Item</h1>
          <p style={s.sub}>Record a new memory into your vault for easy retrieval later.</p>

          <div style={s.formCard}>
            <div style={s.leftBorder} />
            <div style={s.formInner}>

              {/* Item Name */}
              <div style={s.group}>
                <label style={s.label}>Item Name</label>
                <input
                  placeholder="e.g., Car Keys, Passport"
                  value={form.item_name}
                  onChange={e => setForm({ ...form, item_name: e.target.value })}
                />
              </div>

              {/* Location */}
              <div style={s.group}>
                <label style={s.label}>Location</label>
                <input
                  placeholder="e.g., Top Drawer, Hallway Table"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                />
              </div>

              {/* Category */}
              <div style={s.group}>
                <label style={s.label}>Category</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg style={s.selectArrow} width="16" height="16" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>

              {/* Notes */}
              <div style={s.group}>
                <label style={s.label}>Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span></label>
                <textarea
                  rows={4}
                  placeholder="Add any specific details or context..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Photo upload */}
              <div
                style={{ ...s.photoBox, ...(drag ? s.photoBoxDrag : {}), ...(photo ? s.photoBoxFilled : {}) }}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('photoInput').click()}
              >
                <input id="photoInput" type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (f) setPhoto(URL.createObjectURL(f)) }} />
                {photo ? (
                  <img src={photo} alt="preview" style={s.photoPreview} />
                ) : (
                  <>
                    <div style={s.photoIcon}>
                      <svg width="28" height="28" fill="none" stroke="#1a6b52" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z"/>
                        <circle cx="12" cy="13" r="3"/>
                        <path d="M12 7v1" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={s.photoTitle}>Upload Photo</div>
                    <div style={s.photoHint}>Future AI detection feature. Drag and drop or click to browse.</div>
                  </>
                )}
              </div>

              <hr style={s.divider} />

              {/* Actions */}
              <div style={s.actions}>
                <button className="btn-outline" onClick={() => navigate(-1)}>Cancel</button>
                <button className="btn-primary" style={{ minWidth: 120 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Save Item'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

const s = {
  container:    { maxWidth: 720, margin: '0 auto', padding: '40px 24px' },
  title:        { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, marginBottom: 6 },
  sub:          { color: '#6b7280', fontSize: 14, marginBottom: 32 },
  formCard:     { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', overflow: 'hidden' },
  leftBorder:   { width: 5, background: '#1a6b52', flexShrink: 0 },
  formInner:    { flex: 1, padding: 36 },
  group:        { marginBottom: 22 },
  label:        { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 },
  selectArrow:  { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  photoBox:     {
    border: '2px dashed #d1ccc5', borderRadius: 10,
    padding: '36px 20px', textAlign: 'center',
    cursor: 'pointer', transition: 'all 0.2s',
    background: '#fafaf8', marginBottom: 8,
  },
  photoBoxDrag: { borderColor: '#1a6b52', background: '#e8f4ef' },
  photoBoxFilled:{ border: '2px solid #1a6b52', padding: 8 },
  photoIcon:    { width: 52, height: 52, borderRadius: '50%', background: '#e8f4ef', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' },
  photoTitle:   { fontWeight: 600, fontSize: 15, marginBottom: 4 },
  photoHint:    { color: '#9ca3af', fontSize: 13 },
  photoPreview: { width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 },
  divider:      { border: 'none', borderTop: '1px solid #f0ede8', margin: '24px 0' },
  actions:      { display: 'flex', justifyContent: 'flex-end', gap: 12 },
}
