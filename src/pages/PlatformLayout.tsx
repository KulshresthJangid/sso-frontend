import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Store, LogOut, ChevronRight, KeyRound } from 'lucide-react'
import { usePlatformStore } from '../store/platformStore'

const NAV = [
  { to: '/platform/brands', icon: Store, label: 'Brands', end: false },
]

const PAGE_TITLES: Record<string, string> = {
  '/platform/brands': 'Brands',
}

// Structural clone of DashboardLayout — same shell, same CSS custom
// properties — but reads platformStore instead of orgStore, and is a fully
// separate route branch (see App.tsx), not nested under /dashboard.
export default function PlatformLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { username, clear } = usePlatformStore()

  function handleSignOut() {
    clear()
    navigate('/platform/login')
  }

  const pageTitle = PAGE_TITLES[location.pathname] || 'Platform Console'

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 240,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '1.125rem 1.25rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '0.5rem',
            background: '#18181b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <KeyRound size={14} style={{ color: '#fafafa' }} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{
              fontSize: '0.875rem', fontWeight: 600,
              color: 'var(--text-1)', lineHeight: 1.2, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>Platform Console</p>
            <p style={{
              fontSize: '0.72rem', color: 'var(--text-3)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>buildwithkulshresth</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          <p style={{
            fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '0.375rem 0.75rem', marginBottom: '0.25rem',
          }}>Navigation</p>
          {NAV.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isActive && <ChevronRight size={12} style={{ color: 'var(--text-3)' }} />}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '0.75rem 0.625rem',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            marginBottom: '0.375rem',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {(username || 'P')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-1)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{username || 'platform'}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Platform Owner</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-3)', fontSize: '0.8125rem' }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.75rem',
          height: 52,
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-1)' }}>
            {pageTitle}
          </h1>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
