import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/index.js'
import { Toast, useToast } from '../components/Toast.jsx'

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { toast, showToast }  = useToast()
  const navigate              = useNavigate()

  const handleSubmit = async () => {
    if (!form.email || !form.password) { showToast('Fill all fields', 'error'); return }
    setLoading(true)
    try {
      const res = await login(form)
      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Login failed', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      <Toast toast={toast} />
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.brand}>SmritiVault</div>
          <h1 style={s.tagline}>Your cognitive<br />extension for<br /><span style={{ color: '#1a6b52' }}>physical memory.</span></h1>
          <p style={s.desc}>Never forget where you put things. Log items, search instantly, and remember always.</p>
          <div style={s.features}>
            {['Log physical items', 'Search instantly', 'Track location history', 'AI-powered detection (soon)'].map(f => (
              <div key={f} style={s.feat}>
                <span style={s.check}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.formBox}>
          <h2 style={s.formTitle}>Welcome back</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Sign in to your SmritiVault account</p>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Email address</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={s.label}>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <button className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15 }} onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign in'}
          </button>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280' }}>
            No account? <Link to="/register" style={{ color: '#1a6b52', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const s = {
  page:      { display: 'flex', minHeight: '100vh' },
  left:      { flex: 1, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 },
  leftInner: { maxWidth: 420 },
  brand:     { fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 40 },
  tagline:   { fontFamily: 'Playfair Display, serif', fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 20 },
  desc:      { color: '#9ca3af', fontSize: 15, lineHeight: 1.7, marginBottom: 36 },
  features:  { display: 'flex', flexDirection: 'column', gap: 12 },
  feat:      { color: '#d1d5db', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 },
  check:     { color: '#1a6b52', fontWeight: 700, fontSize: 16 },
  right:     { width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#f5f2ee' },
  formBox:   { width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  formTitle: { fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, marginBottom: 6 },
  label:     { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 },
}
