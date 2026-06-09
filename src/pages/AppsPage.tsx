import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Copy, Check, X, Loader2, AppWindow, AlertTriangle } from 'lucide-react'
import { clientsApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

interface Client {
  id: string
  clientId: string
  clientSecret?: string | null
  clientName: string
  redirectUris: string[]
  scopes: string[]
  grantTypes: string[]
}

const SCOPES = ['openid', 'profile', 'email']
const GRANTS = ['authorization_code', 'refresh_token', 'client_credentials']

const MODAL_BG: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
const MODAL_CARD: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
}

function ToggleChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.3rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.78rem',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.15s',
        background: active ? 'var(--accent)' : 'var(--surface-2)',
        color: active ? '#fff' : 'var(--text-2)',
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
      }}
    >{label}</button>
  )
}

export default function AppsPage() {
  const { slug } = useOrgStore()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newSecret, setNewSecret] = useState<{ clientId: string; secret: string } | null>(null)
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState({
    clientName: '',
    redirectUris: '',
    scopes: ['openid', 'profile', 'email'],
    grantTypes: ['authorization_code', 'refresh_token'],
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { if (slug) load() }, [slug])

  async function load() {
    setLoading(true)
    try {
      const data = await clientsApi.list(slug!)
      setClients(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const res = await clientsApi.register(slug!, {
        clientName: form.clientName,
        redirectUris: form.redirectUris.split('\n').map(s => s.trim()).filter(Boolean),
        scopes: form.scopes,
        grantTypes: form.grantTypes,
      })
      setNewSecret({ clientId: res.clientId, secret: res.clientSecret })
      setShowModal(false)
      setForm({ clientName: '', redirectUris: '', scopes: ['openid', 'profile', 'email'], grantTypes: ['authorization_code', 'refresh_token'] })
      await load()
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to register app.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(clientId: string) {
    await clientsApi.delete(slug!, clientId)
    setClients(prev => prev.filter(c => c.clientId !== clientId))
  }

  function copy(text: string, key: string) {
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
    <div style={{ padding: '1.75rem' }}>
      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.25rem' }}>
            Applications
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>
            OAuth2 clients registered to{' '}
            <code style={{ color: 'var(--text-1)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{slug}</code>
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <Plus size={14} /> Register App
        </button>
      </div>

      {/* Secret banner */}
      <AnimatePresence>
        {newSecret && (
          <motion.div
            variants={MODAL_BG}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
              padding: '1rem 1.125rem',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '0.1rem' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fbbf24', marginBottom: '0.25rem' }}>
                Save your client secret — it will never be shown again
              </p>
              <code style={{
                fontSize: '0.75rem', color: 'var(--text-2)',
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: 'break-all', display: 'block', marginBottom: '0.25rem',
              }}>{newSecret.secret}</code>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                Client ID: {newSecret.clientId}
              </p>
            </div>
            <button className="copy-btn" onClick={() => copy(newSecret.secret, 'secret')} title="Copy secret">
              {copied === 'secret' ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
            </button>
            <button className="copy-btn" onClick={() => setNewSecret(null)} title="Dismiss">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table card */}
      <div className="card" style={{ overflow: 'hidden', background: 'var(--surface)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
            <Loader2 size={20} style={{ color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <AppWindow size={32} />
            <p style={{ fontWeight: 500, color: 'var(--text-2)', fontSize: '0.9rem' }}>No apps registered yet</p>
            <p style={{ fontSize: '0.8125rem' }}>Register your first OAuth2 application to get started.</p>
            <button
              className="btn-secondary"
              onClick={() => setShowModal(true)}
              style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <Plus size={14} /> Register App
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>App Name</th>
                  <th>Client ID</th>
                  <th>Grant Types</th>
                  <th>Scopes</th>
                  <th style={{ width: 48 }}></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <motion.tr
                    key={c.id || c.clientId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '0.375rem',
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <AppWindow size={13} style={{ color: 'var(--accent)' }} />
                        </div>
                        <span style={{ color: 'var(--text-1)', fontWeight: 500, fontSize: '0.875rem' }}>
                          {c.clientName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{
                          fontSize: '0.72rem', color: 'var(--text-2)',
                          fontFamily: "'JetBrains Mono', monospace",
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                          padding: '0.2rem 0.5rem', borderRadius: '0.3rem',
                          maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', display: 'block',
                        }}>
                          {c.clientId.slice(0, 14)}…
                        </code>
                        <button className="copy-btn" onClick={() => copy(c.clientId, c.clientId)} title="Copy Client ID">
                          {copied === c.clientId
                            ? <Check size={12} style={{ color: 'var(--success)' }} />
                            : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {c.grantTypes.map(g => (
                          <span key={g} className="badge badge-indigo">
                            {g.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {c.scopes.map(s => (
                          <span key={s} className="badge badge-gray">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(c.clientId)}
                        title="Delete app"
                        style={{ padding: '0.375rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            variants={MODAL_BG}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              variants={MODAL_CARD}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={e => e.stopPropagation()}
              className="card"
              style={{
                width: '100%', maxWidth: 468,
                padding: '1.5rem',
                background: 'var(--surface)',
                border: '1px solid var(--border-2)',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '1.25rem',
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>Register Application</h3>
                <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '0.25rem' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p className="section-label">App Name</p>
                  <input
                    className="input"
                    placeholder="My Application"
                    value={form.clientName}
                    onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <p className="section-label">Redirect URIs <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(one per line)</span></p>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="https://myapp.com/callback&#10;http://localhost:3000/callback"
                    value={form.redirectUris}
                    onChange={e => setForm(f => ({ ...f, redirectUris: e.target.value }))}
                    style={{ resize: 'vertical', minHeight: '4.5rem' }}
                  />
                </div>

                <div>
                  <p className="section-label">Scopes</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {SCOPES.map(s => (
                      <ToggleChip key={s} label={s} active={form.scopes.includes(s)} onClick={() => toggleScope(s)} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="section-label">Grant Types</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {GRANTS.map(g => (
                      <ToggleChip key={g} label={g.replace(/_/g, ' ')} active={form.grantTypes.includes(g)} onClick={() => toggleGrant(g)} />
                    ))}
                  </div>
                </div>

                {formError && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--error)' }}>{formError}</p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >Cancel</button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting || !form.clientName}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {submitting
                      ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      : 'Register'}
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
