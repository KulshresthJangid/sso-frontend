import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, AppWindow, Users, Shield,
  Settings, LogOut, BookOpen, ChevronRight,
} from 'lucide-react'
import { useOrgStore } from '../store/orgStore'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/apps', icon: AppWindow, label: 'Applications', end: false },
  { to: '/dashboard/users', icon: Users, label: 'Users', end: false },
  { to: '/dashboard/roles', icon: Shield, label: 'Roles & Permissions', end: false },
  { to: '/dashboard/guide', icon: BookOpen, label: 'Integration Guide', end: false },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings', end: false, disabled: true },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/apps': 'Applications',
  '/dashboard/users': 'Users',
  '/dashboard/roles': 'Roles & Permissions',
  '/dashboard/guide': 'Integration Guide',
  '/dashboard/settings': 'Settings',
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { slug, orgName, userEmail, clear } = useOrgStore()

  function handleSignOut() {
    clear()
    navigate('/login')
  }

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard'

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
            background: '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.875rem', color: '#fff', flexShrink: 0,
          }}>V</div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{
              fontSize: '0.875rem', fontWeight: 600,
              color: 'var(--text-1)', lineHeight: 1.2, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>Vault SSO</p>
            <p style={{
              fontSize: '0.72rem', color: 'var(--text-3)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{orgName || slug}</p>
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
            return item.disabled ? (
              <div
                key={item.to}
                className="nav-item disabled"
                title="Coming soon"
              >
                <Icon size={15} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-3)',
                  background: 'var(--surface-2)', padding: '0.15rem 0.4rem',
                  borderRadius: '0.25rem', border: '1px solid var(--border)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>Soon</span>
              </div>
            ) : (
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
              {(userEmail || 'A')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-1)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{userEmail || 'admin'}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Admin</p>
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
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.3rem 0.75rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '9999px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 500 }}>
              {orgName || slug}
            </span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
