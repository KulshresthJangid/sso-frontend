import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CallbackPage from './pages/CallbackPage'
import DashboardLayout from './pages/DashboardLayout'
import OverviewPage from './pages/OverviewPage'
import AppsPage from './pages/AppsPage'
import UsersPage from './pages/UsersPage'
import RolesPage from './pages/RolesPage'
import { useOrgStore } from './store/orgStore'

function RequireOrg({ children }: { children: React.ReactNode }) {
  const { slug } = useOrgStore()
  if (!slug) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="settings" element={
            <div className="p-8 text-center pt-20" style={{ color: '#908fa0' }}>Settings — coming soon</div>
          } />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center text-center">
            <div>
              <p className="text-6xl font-bold mb-4" style={{ color: 'rgba(255,255,255,0.1)' }}>404</p>
              <p className="text-lg font-medium mb-2">Page not found</p>
              <a href="/login" className="text-sm" style={{ color: '#6366f1' }}>← Back to login</a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
