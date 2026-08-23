import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowRight, ShieldCheck, Loader2, AlertCircle, Store, Eye, EyeOff } from 'lucide-react'
import { publicBrandApi, sessionApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'
import { useBrandConsoleStore } from '../store/brandConsoleStore'

const slide: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
}

// The tenant prefix in every login URL (/{slug}/login) is always the
// BRAND slug — TenantResolutionFilter only ever resolves brands from it,
// never an individual org. This used to ask for "organization slug" and
// log in against /{orgSlug}/login, which only ever worked by coincidence
// (or not at all — see the fix). Org resolution happens automatically,
// server-side, by searching the brand's orgs for a matching email — the
// user never needs to know or type their own org's slug. One flow now
// serves both an ORG_ADMIN and a brand-level SUPER_ADMIN identically;
// which one they are is only known after login (see sessionApi.me).
export default function LoginPage() {
  const navigate = useNavigate()
  const { setOrg, setUser } = useOrgStore()
  const { setSession } = useBrandConsoleStore()

  const [step, setStep] = useState<1 | 2>(1)
  const [brandInput, setBrandInput] = useState('')
  const [brandSlug, setBrandSlug] = useState('')
  const [brandName, setBrandName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleBrandLookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const slug = brandInput.trim().toLowerCase()
    try {
      const data = await publicBrandApi.getConfig(slug)
      setBrandSlug(slug)
      setBrandName(data.name || slug)
      setStep(2)
    } catch {
      setError('Brand not found. Check the slug and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const base = import.meta.env.VITE_SSO_API_URL ?? ''
      await fetch(`${base}/${brandSlug}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }),
        credentials: 'include',
        redirect: 'manual',
      })

      const session = await sessionApi.me(brandSlug)
      setUser(session.email)

      if (session.orgRole === 'SUPER_ADMIN') {
        setSession(session.brandSlug, session.brandName, session.email)
        navigate('/brand-console')
      } else if (session.orgSlug) {
        setOrg(session.orgSlug, session.orgName || session.orgSlug)
        navigate('/dashboard')
      } else {
        setError('Signed in, but this account has no organization or brand role.')
      }
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Left panel — branding (hidden on mobile) */}
      <div style={{
        width: 480,
        flexShrink: 0,
        background: 'linear-gradient(160deg, #09090b 0%, #18181b 100%)',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }} className="hidden lg:flex">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '0.5rem',
            background: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            color: '#fff',
            flexShrink: 0,
          }}>V</div>
          <span style={{ color: '#fafafa', fontWeight: 600, fontSize: '0.9375rem' }}>Vault SSO</span>
        </div>

        {/* Hero */}
        <div>
          <p style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: '#6366f1',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '1rem',
          }}>Enterprise Identity Platform</p>
          <h1 style={{
            fontSize: '2.125rem',
            fontWeight: 700,
            color: '#fafafa',
            lineHeight: 1.2,
            marginBottom: '1rem',
          }}>Secure access<br />for every app.</h1>
          <p style={{ color: '#71717a', fontSize: '0.9rem', lineHeight: 1.65, maxWidth: 300 }}>
            OAuth2 &amp; OIDC compliant single sign-on. One identity layer for all your services.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { dot: '#6366f1', text: 'OAuth2 / OIDC compliant' },
              { dot: '#22c55e', text: 'Multi-tenant by design' },
              { dot: '#f59e0b', text: 'RBAC roles & permissions' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: item.dot,
                  flexShrink: 0,
                }} />
                <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: '#3f3f46', fontSize: '0.75rem' }}>© 2026 Vault SSO</p>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Mobile logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginBottom: '2rem',
            justifyContent: 'center',
          }} className="lg:hidden">
            <div style={{
              width: 32, height: 32, borderRadius: '0.5rem',
              background: '#6366f1', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem',
            }}>V</div>
            <span style={{ color: '#18181b', fontWeight: 600, fontSize: '0.9375rem' }}>Vault SSO</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" variants={slide} initial="hidden" animate="visible" exit="exit">
                <div style={{ marginBottom: '1.75rem' }}>
                  <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#18181b', marginBottom: '0.4rem' }}>
                    Sign in
                  </h2>
                  <p style={{ color: '#71717a', fontSize: '0.875rem' }}>
                    Enter your brand's slug to continue.
                  </p>
                </div>

                <form onSubmit={handleBrandLookup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block', fontSize: '0.8125rem', fontWeight: 500,
                      color: '#3f3f46', marginBottom: '0.4rem',
                    }}>Brand slug</label>
                    <div style={{ position: 'relative' }}>
                      <Store size={14} style={{
                        position: 'absolute', left: '0.75rem', top: '50%',
                        transform: 'translateY(-50%)', color: '#a1a1aa',
                      }} />
                      <input
                        className="input-light"
                        style={{ paddingLeft: '2.25rem' }}
                        type="text"
                        placeholder="zoralis"
                        value={brandInput}
                        onChange={e => { setBrandInput(e.target.value); setError('') }}
                        autoFocus
                        required
                      />
                    </div>
                    <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#a1a1aa' }}>
                      The reseller you (or your org) belong to — e.g.{' '}
                      <code style={{
                        fontFamily: 'monospace', background: '#f4f4f5',
                        padding: '0.1rem 0.35rem', borderRadius: '0.25rem', color: '#52525b',
                      }}>zoralis</code>
                    </p>
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
                    disabled={loading || !brandInput.trim()}
                    style={{ width: '100%', padding: '0.7rem 1.25rem', justifyContent: 'center' }}
                  >
                    {loading
                      ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      : <><span>Continue</span> <ArrowRight size={15} /></>}
                  </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', color: '#71717a' }}>
                  Don't have an account?{' '}
                  <Link to="/signup" style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>
                    Create organization
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="step2" variants={slide} initial="hidden" animate="visible" exit="exit">
                {/* Brand chip */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.3rem 0.75rem',
                  background: '#f4f4f5', borderRadius: '9999px',
                  marginBottom: '1.25rem', fontSize: '0.8rem', color: '#3f3f46', fontWeight: 500,
                }}>
                  <ShieldCheck size={13} style={{ color: '#22c55e' }} />
                  {brandName || brandInput}
                  <button
                    onClick={() => { setStep(1); setError('') }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#a1a1aa', fontSize: '0.7rem', padding: 0, marginLeft: '0.125rem',
                    }}
                  >✕</button>
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#18181b', marginBottom: '0.4rem' }}>
                    Welcome back
                  </h2>
                  <p style={{ color: '#71717a', fontSize: '0.875rem' }}>
                    Sign in with your account credentials.
                  </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block', fontSize: '0.8125rem', fontWeight: 500,
                      color: '#3f3f46', marginBottom: '0.4rem',
                    }}>Email address</label>
                    <input
                      className="input-light"
                      type="email"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
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
                    disabled={loading || !email || !password}
                    style={{ width: '100%', padding: '0.7rem 1.25rem', justifyContent: 'center' }}
                  >
                    {loading
                      ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      : <><span>Sign in</span> <ArrowRight size={15} /></>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
