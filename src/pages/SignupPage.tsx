import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight, Loader2, Check } from 'lucide-react'
import { orgsApi, usersApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

export default function SignupPage() {
  const navigate = useNavigate()
  const { setOrg } = useOrgStore()
  const [step, setStep] = useState<'org' | 'user' | 'done'>('org')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function slugify(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleOrgCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await orgsApi.create({ name: orgName, slug: orgSlug })
      setOrg(orgSlug, orgName)
      setStep('user')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Slug may already be taken.')
    } finally { setLoading(false) }
  }

  async function handleUserCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await usersApi.create(orgSlug, { email, password, orgRole: 'ORG_ADMIN' })
      setStep('done')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create user.')
    } finally { setLoading(false) }
  }

  const steps = ['Create org', 'Admin user', 'Done']

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass glow-indigo relative z-10 w-full max-w-md mx-6 rounded-2xl p-8">

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < steps.indexOf(step === 'done' ? 'Done' : step === 'user' ? 'Admin user' : 'Create org')
                  ? 'bg-indigo-500 text-white' : i === 0 && step === 'org' ? 'bg-indigo-500 text-white' : i === 1 && step === 'user' ? 'bg-indigo-500 text-white' : i === 2 && step === 'done' ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40'
              }`}>
                {(step === 'done' && i < 2) || (step === 'user' && i === 0) ? <Check size={12} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {step === 'org' && (
          <motion.div key="org" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={18} style={{ color: '#6366f1' }} />
              <h2 className="text-xl font-semibold">Create your organization</h2>
            </div>
            <p className="text-sm mb-6" style={{ color: '#908fa0' }}>Your team's home on Vault SSO</p>

            <form onSubmit={handleOrgCreate} className="flex flex-col gap-4">
              <input className="input-pill" placeholder="Organization name" value={orgName}
                onChange={e => { setOrgName(e.target.value); setOrgSlug(slugify(e.target.value)) }} autoFocus />
              <div className="relative">
                <input className="input-pill pr-24" placeholder="org-slug" value={orgSlug}
                  onChange={e => setOrgSlug(slugify(e.target.value))} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#908fa0' }}>
                  .yoursso.com
                </span>
              </div>
              {error && <p className="text-sm px-2" style={{ color: '#ffb4ab' }}>{error}</p>}
              <button className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Next <ArrowRight size={16} /></>}
              </button>
            </form>
            <p className="mt-4 text-center text-sm" style={{ color: '#908fa0' }}>
              Already have an org?{' '}
              <button onClick={() => navigate('/login')} className="font-medium" style={{ color: '#c0c1ff' }}>Sign in →</button>
            </p>
          </motion.div>
        )}

        {step === 'user' && (
          <motion.div key="user" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl font-semibold mb-1">Create admin account</h2>
            <p className="text-sm mb-6" style={{ color: '#908fa0' }}>You'll be the first admin of <strong style={{ color: '#c0c1ff' }}>{orgSlug}</strong></p>

            <form onSubmit={handleUserCreate} className="flex flex-col gap-4">
              <input className="input-pill" type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              <input className="input-pill" type="password" placeholder="Password (8+ chars)" value={password} onChange={e => setPassword(e.target.value)} />
              {error && <p className="text-sm px-2" style={{ color: '#ffb4ab' }}>{error}</p>}
              <button className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Create account <ArrowRight size={16} /></>}
              </button>
            </form>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 0 32px rgba(34,197,94,0.4)' }}>
              <Check size={28} color="white" />
            </motion.div>
            <h2 className="text-2xl font-semibold mb-2">You're all set!</h2>
            <p className="text-sm mb-6" style={{ color: '#908fa0' }}>Your organization <strong style={{ color: '#c0c1ff' }}>{orgSlug}</strong> is ready.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard →</button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
