import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight, Eye, EyeOff, GitFork, Globe, Loader2 } from 'lucide-react'
import { orgsApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setOrg } = useOrgStore()

  const [step, setStep] = useState<'org' | 'creds'>('org')
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleOrgSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!slug.trim()) return
    setLoading(true)
    setError('')
    try {
      const org = await orgsApi.get(slug.trim().toLowerCase())
      setOrg(org.slug, org.name)
      setStep('creds')
    } catch {
      setError('Organization not found. Check your slug and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    // Redirect to Spring AS form login endpoint for this tenant
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = `/${slug}/login`
    const u = document.createElement('input'); u.name = 'username'; u.value = email; form.appendChild(u)
    const p = document.createElement('input'); p.name = 'password'; p.value = password; form.appendChild(p)
    document.body.appendChild(form)
    form.submit()
  }

  function handleOAuthLogin(provider: string) {
    // Initiate OAuth2 authorization_code flow via the tenant endpoint
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: provider,
      redirect_uri: `${window.location.origin}/callback`,
      scope: 'openid profile email',
    })
    window.location.href = `/${slug}/oauth2/authorize?${params}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-6 flex items-center gap-16">
        {/* Left — branding */}
        <motion.div
          initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex flex-col flex-1"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 24px rgba(99,102,241,0.5)' }}>
              <Building2 size={20} color="white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Vault SSO</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight mb-4"
            style={{ background: 'linear-gradient(135deg, #fff 30%, #908fa0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your identity.<br />Every app.
          </h1>
          <p className="text-base leading-relaxed max-w-xs" style={{ color: '#908fa0' }}>
            One SSO server for all your organization's apps. Secure, fast, and yours.
          </p>
          <div className="mt-10 flex flex-col gap-3">
            {['Zero config OAuth2 & OIDC', 'Multi-tenant by default', 'Roles & permissions built-in'].map((f, i) => (
              <motion.div key={f} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-sm" style={{ color: '#c7c4d7' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6366f1' }} />
                {f}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — login card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass glow-indigo w-full max-w-md rounded-2xl p-8"
        >
          <AnimatePresence mode="wait">
            {step === 'org' ? (
              <motion.div key="org"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}>
                <h2 className="text-2xl font-semibold mb-1 tracking-tight">Find your org</h2>
                <p className="text-sm mb-6" style={{ color: '#908fa0' }}>Enter your organization's slug to continue</p>

                <form onSubmit={handleOrgSubmit} className="flex flex-col gap-4">
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#908fa0' }} />
                    <input className="input-pill pl-10" placeholder="acme-corp" value={slug}
                      onChange={e => setSlug(e.target.value)} autoFocus />
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="text-sm px-4" style={{ color: '#ffb4ab' }}>{error}</motion.p>
                  )}

                  <button className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm" style={{ color: '#908fa0' }}>
                  No organization?{' '}
                  <button onClick={() => navigate('/signup')}
                    className="font-medium transition-colors" style={{ color: '#c0c1ff' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#6366f1')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#c0c1ff')}>
                    Create one →
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="creds"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}>
                <button onClick={() => { setStep('org'); setError('') }}
                  className="flex items-center gap-2 text-sm mb-6 transition-colors"
                  style={{ color: '#908fa0' }}>
                  ← <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#c0c1ff' }}>{slug}</span>
                </button>

                <h2 className="text-2xl font-semibold mb-1 tracking-tight">Welcome back</h2>
                <p className="text-sm mb-6" style={{ color: '#908fa0' }}>Sign in to continue to {slug}</p>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <input className="input-pill" type="email" placeholder="Email address"
                    value={email} onChange={e => setEmail(e.target.value)} autoFocus />

                  <div className="relative">
                    <input className="input-pill pr-12" type={showPass ? 'text' : 'password'}
                      placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: '#908fa0' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button type="button" className="text-sm transition-colors"
                      style={{ color: '#c0c1ff' }}>Forgot password?</button>
                  </div>

                  <button className="btn-primary flex items-center justify-center gap-2">
                    Sign in <ArrowRight size={16} />
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-xs" style={{ color: '#908fa0' }}>or continue with</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                <div className="flex flex-col gap-3">
                  {[{ icon: <Globe size={16} />, label: 'Google', id: 'google' },
                    { icon: <GitFork size={16} />, label: 'GitHub', id: 'github' }].map(p => (
                    <button key={p.id} onClick={() => handleOAuthLogin(p.id)}
                      className="btn-glass flex items-center justify-center gap-3 w-full">
                      {p.icon} Continue with {p.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
