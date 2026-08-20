import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowRight, Loader2, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react'
import { brandsApi } from '../lib/api'
import { usePlatformStore } from '../store/platformStore'

const slide: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
}

// Single-step, unlike LoginPage — no org-slug lookup, since a platform
// operator isn't scoped to any org at all. See SecurityConfig's
// platformAdminFilterChain: a fixed credential pair, not tied to any
// Organization/User row.
export default function PlatformLoginPage() {
  const navigate = useNavigate()
  const { setCredentials } = usePlatformStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Verify with an explicit one-off Basic header before committing
      // anything to the store — see brandsApi.list()'s credentials param.
      await brandsApi.list({ username, password })
      setCredentials(username, password)
      navigate('/platform/brands')
    } catch {
      setError('Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: '2rem 1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          marginBottom: '2rem', justifyContent: 'center',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '0.5rem',
            background: '#18181b', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <KeyRound size={15} style={{ color: '#fafafa' }} />
          </div>
          <span style={{ color: '#18181b', fontWeight: 600, fontSize: '0.9375rem' }}>Platform Console</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="platform-login" variants={slide} initial="hidden" animate="visible" exit="exit">
            <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#18181b', marginBottom: '0.4rem' }}>
                Platform operator sign in
              </h2>
              <p style={{ color: '#71717a', fontSize: '0.875rem' }}>
                Onboard and manage white-label brands.
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '0.8125rem', fontWeight: 500,
                  color: '#3f3f46', marginBottom: '0.4rem',
                }}>Username</label>
                <input
                  className="input-light"
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError('') }}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: '0.8125rem', fontWeight: 500,
                  color: '#3f3f46', marginBottom: '0.4rem',
                }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input-light"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    required
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: 0,
                    }}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      background: '#fef2f2', border: '1px solid #fecaca',
                      borderRadius: '0.5rem', color: '#dc2626', fontSize: '0.8125rem',
                    }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                className="btn-primary-light"
                type="submit"
                disabled={loading || !username || !password}
                style={{ width: '100%', padding: '0.7rem 1.25rem', justifyContent: 'center' }}
              >
                {loading
                  ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  : <><span>Sign in</span> <ArrowRight size={15} /></>}
              </button>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
