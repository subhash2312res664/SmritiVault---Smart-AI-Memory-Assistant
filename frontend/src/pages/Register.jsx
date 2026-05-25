import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register, login } from '../api/index.js'
import { Toast, useToast } from '../components/Toast.jsx'

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { toast, showToast }  = useToast()
  const navigate              = useNavigate()

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) { showToast('Fill all fields', 'error'); return }
    if (form.password.length < 6) { showToast('Password min 6 characters', 'error'); return }
    setLoading(true)
    try {
      await register(form)
      const res = await login({ email: form.email, password: form.password })
      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Registration failed', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      <Toast toast={toast} />
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.brand}>SmritiVault</div>
          <h1 style={s.tagline}>Start remembering<br /><span style={{ color: '#1a6b52' }}>everything.</span></h1>
          <p style={s.desc}>Join SmritiVault and never lose track of your belongings again.</p>
        </div>
      </div>
      <div style={s.right}>
        <div style={s.formBox}>
          <h2 style={s.formTitle}>Create account</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Free forever — no credit card needed</p>
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Full name</label>
            <input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Email address</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={s.label}>Password</label>
            <input type="password" placeholder="Min 6 characters" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <button className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15 }} onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create account'}
          </button>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280' }}>
            Already have an account? <Link to="/login" style={{ color: '#1a6b52', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const s = {
  page:      { display: 'flex', minHeight: '100vh' },
  left:      { flex: 1, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 },
  leftInner: { maxWidth: 400 },
  brand:     { fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 40 },
  tagline:   { fontFamily: 'Playfair Display, serif', fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 20 },
  desc:      { color: '#9ca3af', fontSize: 15, lineHeight: 1.7 },
  right:     { width: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#f5f2ee' },
  formBox:   { width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  formTitle: { fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, marginBottom: 6 },
  label:     { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 },
}
