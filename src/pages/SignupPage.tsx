import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowRight, Loader2, AlertCircle, Check, Sparkles } from 'lucide-react'
import { orgsApi, signupApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const slide: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { setOrg } = useOrgStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleOrgStep(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await orgsApi.get(orgSlug)
      setError('This slug is already taken. Please choose another.')
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setStep(2)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signupApi.signup({ orgName, slug: orgSlug, adminEmail: email, adminPassword: password })
      setStep(3)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleGoToDashboard() {
    setOrg(orgSlug, orgName)
    navigate('/dashboard')
  }

  const steps = ['Organization', 'Admin account', 'Done']
  const stepIdx = step - 1

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          marginBottom: '2rem', justifyContent: 'center',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '0.5rem',
            background: '#6366f1', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem',
          }}>V</div>
          <span style={{ color: '#18181b', fontWeight: 600, fontSize: '0.9375rem' }}>Vault SSO</span>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '0', marginBottom: '2rem',
        }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 600,
                  background: i < stepIdx ? '#6366f1' : i === stepIdx ? '#6366f1' : '#f4f4f5',
                  color: i <= stepIdx ? '#fff' : '#a1a1aa',
                  border: i === stepIdx ? '2px solid #6366f1' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}>
                  {i < stepIdx ? <Check size={12} /> : i + 1}
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 500,
                  color: i === stepIdx ? '#18181b' : '#a1a1aa',
                  whiteSpace: 'nowrap',
                }}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: 48, height: 2, margin: '0 4px',
                  marginBottom: 20,
                  background: i < stepIdx ? '#6366f1' : '#e4e4e7',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', border: '1px solid #e4e4e7',
          borderRadius: '0.875rem', padding: '2rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={slide} initial="hidden" animate="visible" exit="exit">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18181b', marginBottom: '0.375rem' }}>
                  Create your organization
                </h2>
                <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Your team's home on Vault SSO.
                </p>

                <form onSubmit={handleOrgStep} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block', fontSize: '0.8125rem', fontWeight: 500,
                      color: '#3f3f46', marginBottom: '0.4rem',
                    }}>Organization name</label>
                    <input
                      className="input-light"
                      type="text"
                      placeholder="Acme Corp"
                      value={orgName}
                      onChange={e => {
                        setOrgName(e.target.value)
                        setOrgSlug(slugify(e.target.value))
                        setError('')
                      }}
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block', fontSize: '0.8125rem', fontWeight: 500,
                      color: '#3f3f46', marginBottom: '0.4rem',
                    }}>Workspace slug</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="input-light"
                        type="text"
                        placeholder="acme-corp"
                        value={orgSlug}
                        onChange={e => { setOrgSlug(slugify(e.target.value)); setError('') }}
                        required
                        style={{ paddingRight: '6.5rem' }}
                      />
                      <span style={{
                        position: 'absolute', right: '0.75rem', top: '50%',
                        transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#a1a1aa',
                        pointerEvents: 'none',
                      }}>.vault-sso.com</span>
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
                    disabled={loading || !orgName.trim() || !orgSlug.trim()}
                    style={{ width: '100%', padding: '0.7rem 1.25rem', justifyContent: 'center' }}
                  >
                    {loading
                      ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      : <><span>Continue</span> <ArrowRight size={15} /></>}
                  </button>
                </form>

                <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', color: '#71717a' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={slide} initial="hidden" animate="visible" exit="exit">
                {/* Org badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.3rem 0.75rem',
                  background: '#f4f4f5', borderRadius: '9999px',
                  marginBottom: '1.25rem', fontSize: '0.8rem', color: '#3f3f46', fontWeight: 500,
                }}>
                  <span style={{ color: '#22c55e', fontSize: '0.6rem' }}>●</span>
                  {orgSlug}
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18181b', marginBottom: '0.375rem' }}>
                  Create admin account
                </h2>
                <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  You'll be the first admin of <strong style={{ color: '#18181b' }}>{orgName}</strong>.
                </p>

                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block', fontSize: '0.8125rem', fontWeight: 500,
                      color: '#3f3f46', marginBottom: '0.4rem',
                    }}>Admin email</label>
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
                    <input
                      className="input-light"
                      type="password"
                      placeholder="8+ characters"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      required
                    />
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

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError('') }}
                      style={{
                        flex: '0 0 auto', padding: '0.7rem 1rem',
                        background: '#f4f4f5', border: '1px solid #e4e4e7',
                        borderRadius: '0.5rem', cursor: 'pointer',
                        fontSize: '0.875rem', fontWeight: 500, color: '#52525b',
                        fontFamily: 'inherit',
                      }}
                    >Back</button>
                    <button
                      className="btn-primary-light"
                      type="submit"
                      disabled={loading || !email || !password}
                      style={{ flex: 1, padding: '0.7rem 1.25rem', justifyContent: 'center' }}
                    >
                      {loading
                        ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        : <><span>Create account</span> <ArrowRight size={15} /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '1rem 0' }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                  style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
                  }}
                >
                  <Sparkles size={26} color="#fff" />
                </motion.div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#18181b', marginBottom: '0.5rem' }}>
                  You're all set!
                </h2>
                <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
                  Your organization{' '}
                  <strong style={{ color: '#18181b' }}>{orgName}</strong> is ready.
                  Head to the dashboard to register your first app.
                </p>
                <button
                  onClick={handleGoToDashboard}
                  className="btn-primary-light"
                  style={{ width: '100%', padding: '0.7rem 1.25rem', justifyContent: 'center' }}
                >
                  Go to Dashboard <ArrowRight size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
