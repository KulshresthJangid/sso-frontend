import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, LayoutDashboard, AppWindow, Users, Shield, Settings, LogOut } from 'lucide-react'
import { useOrgStore } from '../store/orgStore'

const NAV = [
  { to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Overview', end: true },
  { to: '/dashboard/apps', icon: <AppWindow size={17} />, label: 'Applications' },
  { to: '/dashboard/users', icon: <Users size={17} />, label: 'Users' },
  { to: '/dashboard/roles', icon: <Shield size={17} />, label: 'Roles & Permissions' },
  { to: '/dashboard/settings', icon: <Settings size={17} />, label: 'Settings' },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const { slug, orgName, userEmail, clear } = useOrgStore()

  function handleSignOut() {
    clear()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-60 flex flex-col flex-shrink-0 border-r"
        style={{ background: '#0d0d15', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
            <Building2 size={15} color="white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold leading-tight truncate">Vault SSO</p>
            <p className="text-xs truncate" style={{ color: '#908fa0' }}>{orgName || slug}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  isActive
                    ? 'text-white'
                    : 'hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? { color: '#e4e1ed', background: 'rgba(99,102,241,0.15)' } : { color: '#908fa0' }}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                      style={{ background: '#6366f1' }} />
                  )}
                  <span style={{ color: isActive ? '#c0c1ff' : 'inherit' }}>{item.icon}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              {(userEmail || 'A')[0].toUpperCase()}
            </div>
            <p className="text-xs truncate flex-1" style={{ color: '#c7c4d7' }}>{userEmail || 'admin'}</p>
          </div>
          <button onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-all hover:bg-red-500/10"
            style={{ color: '#908fa0' }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#0f0f17' }}>
        <Outlet />
      </main>
    </div>
  )
}
