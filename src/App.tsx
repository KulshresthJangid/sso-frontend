import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CallbackPage from './pages/CallbackPage'
import DashboardLayout from './pages/DashboardLayout'
import OverviewPage from './pages/OverviewPage'
import AppsPage from './pages/AppsPage'
import UsersPage from './pages/UsersPage'
import RolesPage from './pages/RolesPage'
import GuidePage from './pages/GuidePage'
import { useOrgStore } from './store/orgStore'

function RequireOrg({ children }: { children: React.ReactNode }) {
  const { slug } = useOrgStore()
  if (!slug) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter basename="/sso">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/callback" element={<CallbackPage />} />

        <Route path="/dashboard" element={
          <RequireOrg><DashboardLayout /></RequireOrg>
        }>
          <Route index element={<OverviewPage />} />
          <Route path="apps" element={<AppsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="guide" element={<GuidePage />} />
          <Route path="settings" element={
            <div className="p-8 text-center pt-20" style={{ color: '#6b6b6b' }}>Settings — coming soon</div>
          } />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center text-center" style={{ background: '#ffffff' }}>
            <div>
              <p className="text-6xl font-bold mb-4" style={{ color: '#e5e5e5' }}>404</p>
              <p className="text-lg font-medium mb-2" style={{ color: '#0a0a0a' }}>Page not found</p>
              <a href="/login" className="text-sm underline" style={{ color: '#6b6b6b' }}>← Back to login</a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
