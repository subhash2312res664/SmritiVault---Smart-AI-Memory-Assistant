import { useNavigate } from 'react-router-dom'

export default function Navbar({ active }) {
  const navigate = useNavigate()
  const logout = () => { localStorage.removeItem('token'); navigate('/login') }

  return (
    <nav className="navbar">
      <span className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        SmritiVault
      </span>

      <div className="navbar-nav">
        {[
          { label: 'Dashboard', path: '/'       },
          { label: 'My Items',  path: '/items'  },
          { label: 'Add Item',  path: '/add'    },
          { label: 'Search',    path: '/search' },
        ].map(({ label, path }) => (
          <button
            key={path}
            className={`nav-link ${active === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="navbar-right">
        {/* Profile icon */}
        <button className="icon-btn" onClick={() => navigate('/')} title="Dashboard">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </button>
        {/* Settings / logout icon */}
        <button className="icon-btn" onClick={logout} title="Sign out">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
    </nav>
  )
}
