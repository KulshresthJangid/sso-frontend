import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Copy, Check, X, Loader2 } from 'lucide-react'
import { clientsApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

interface Client {
  id: string; clientId: string; clientSecret?: string | null
  clientName: string; redirectUris: string[]; scopes: string[]; grantTypes: string[]
}

const SCOPES = ['openid', 'profile', 'email']
const GRANTS = ['authorization_code', 'refresh_token', 'client_credentials']

export default function AppsPage() {
  const { slug } = useOrgStore()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newSecret, setNewSecret] = useState<{ clientId: string; secret: string } | null>(null)
  const [copied, setCopied] = useState('')

  // Form state
  const [form, setForm] = useState({ clientName: '', redirectUris: '', scopes: ['openid', 'profile', 'email'], grantTypes: ['authorization_code', 'refresh_token'] })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (slug) load() }, [slug])

  async function load() {
    setLoading(true)
    try { setClients(await clientsApi.list(slug!)) } finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await clientsApi.register(slug!, {
        clientName: form.clientName,
        redirectUris: form.redirectUris.split('\n').map(s => s.trim()).filter(Boolean),
        scopes: form.scopes,
        grantTypes: form.grantTypes,
      })
      setNewSecret({ clientId: res.clientId, secret: res.clientSecret })
      setShowModal(false)
      await load()
    } finally { setSubmitting(false) }
  }

  async function handleDelete(clientId: string) {
    await clientsApi.delete(slug!, clientId)
    setClients(prev => prev.filter(c => c.clientId !== clientId))
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  function toggleScope(s: string) {
    setForm(f => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter(x => x !== s) : [...f.scopes, s] }))
  }
  function toggleGrant(g: string) {
    setForm(f => ({ ...f, grantTypes: f.grantTypes.includes(g) ? f.grantTypes.filter(x => x !== g) : [...f.grantTypes, g] }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm mt-1" style={{ color: '#908fa0' }}>OAuth2 clients registered to <span style={{ color: '#c0c1ff' }}>{slug}</span></p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary w-auto px-5 flex items-center gap-2">
          <Plus size={15} /> Register App
        </button>
      </div>

      {/* Secret reveal banner */}
      <AnimatePresence>
        {newSecret && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-4 mb-6 flex items-start gap-3"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: '#c0c1ff' }}>⚠ Save your client secret — it won't be shown again</p>
              <p className="text-xs font-mono break-all" style={{ color: '#e4e1ed' }}>{newSecret.secret}</p>
              <p className="text-xs mt-1" style={{ color: '#908fa0' }}>Client ID: {newSecret.clientId}</p>
            </div>
            <button onClick={() => copyToClipboard(newSecret.secret, 'secret')}
              className="p-2 rounded-lg transition-colors hover:bg-white/10" style={{ color: '#908fa0' }}>
              {copied === 'secret' ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
            </button>
            <button onClick={() => setNewSecret(null)} className="p-2 rounded-lg hover:bg-white/10" style={{ color: '#908fa0' }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: '#6366f1' }} />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium mb-1">No apps yet</p>
            <p className="text-sm mb-4" style={{ color: '#908fa0' }}>Register your first OAuth2 app to get started</p>
            <button onClick={() => setShowModal(true)} className="btn-primary w-auto px-5 flex items-center gap-2 mx-auto">
              <Plus size={15} /> Register App
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['App Name', 'Client ID', 'Grant Types', 'Scopes', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider"
                    style={{ color: '#908fa0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-4 font-medium text-sm">{c.clientName}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs px-2 py-1 rounded-lg font-mono truncate max-w-[120px]"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#c7c4d7' }}>
                        {c.clientId.slice(0, 12)}...
                      </code>
                      <button onClick={() => copyToClipboard(c.clientId, c.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                        style={{ color: '#908fa0' }}>
                        {copied === c.id ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.grantTypes.map(g => (
                        <span key={g} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#c0c1ff' }}>
                          {g.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.scopes.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#c7c4d7' }}>{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleDelete(c.clientId)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl transition-all hover:bg-red-500/15"
                      style={{ color: '#908fa0' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Register modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ ease: [0.22, 1, 0.36, 1] }}
              className="glass glow-indigo rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Register Application</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: '#908fa0' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: '#908fa0' }}>App Name</label>
                  <input className="input-pill" placeholder="My App" value={form.clientName}
                    onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required autoFocus />
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: '#908fa0' }}>Redirect URIs <span className="normal-case">(one per line)</span></label>
                  <textarea className="input-pill rounded-xl resize-none" rows={3}
                    placeholder="https://myapp.com/callback"
                    style={{ borderRadius: '1rem' }}
                    value={form.redirectUris}
                    onChange={e => setForm(f => ({ ...f, redirectUris: e.target.value }))} />
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: '#908fa0' }}>Scopes</label>
                  <div className="flex flex-wrap gap-2">
                    {SCOPES.map(s => (
                      <button type="button" key={s} onClick={() => toggleScope(s)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                        style={{
                          background: form.scopes.includes(s) ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                          color: form.scopes.includes(s) ? '#c0c1ff' : '#908fa0',
                          border: form.scopes.includes(s) ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)'
                        }}>{s}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: '#908fa0' }}>Grant Types</label>
                  <div className="flex flex-wrap gap-2">
                    {GRANTS.map(g => (
                      <button type="button" key={g} onClick={() => toggleGrant(g)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                        style={{
                          background: form.grantTypes.includes(g) ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                          color: form.grantTypes.includes(g) ? '#c0c1ff' : '#908fa0',
                          border: form.grantTypes.includes(g) ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)'
                        }}>{g.replace(/_/g, ' ')}</button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-glass flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={submitting}>
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : 'Register'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
