import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, X, UserCircle2 } from 'lucide-react'
import { usersApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

interface User { id: string; email: string; orgRole: string; active: boolean }

export default function UsersPage() {
  const { slug } = useOrgStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', orgRole: 'ORG_MEMBER' })
  const [error, setError] = useState('')

  useEffect(() => { if (slug) load() }, [slug])

  async function load() {
    setLoading(true)
    try { setUsers(await usersApi.list(slug!)) } finally { setLoading(false) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      await usersApi.create(slug!, form)
      setShowModal(false)
      setForm({ email: '', password: '', orgRole: 'ORG_MEMBER' })
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create user')
    } finally { setSubmitting(false) }
  }

  async function handleDeactivate(id: string) {
    await usersApi.deactivate(slug!, id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: false } : u))
  }

  const roleColors: Record<string, string> = {
    ORG_ADMIN: '#6366f1', ORG_MEMBER: '#22c55e'
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm mt-1" style={{ color: '#908fa0' }}>{users.filter(u => u.active).length} active members in <span style={{ color: '#c0c1ff' }}>{slug}</span></p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary w-auto px-5 flex items-center gap-2">
          <Plus size={15} /> Invite User
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: '#6366f1' }} />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium mb-1">No users yet</p>
            <p className="text-sm mb-4" style={{ color: '#908fa0' }}>Invite the first member of your organization</p>
            <button onClick={() => setShowModal(true)} className="btn-primary w-auto px-5 flex items-center gap-2 mx-auto">
              <Plus size={15} /> Invite User
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {users.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-4 group transition-colors"
                style={{ opacity: u.active ? 1 : 0.45 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(129,140,248,0.15))', color: '#c0c1ff' }}>
                  {u.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.email}</p>
                  {!u.active && <p className="text-xs" style={{ color: '#908fa0' }}>Deactivated</p>}
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                  style={{
                    background: `${roleColors[u.orgRole] || '#908fa0'}20`,
                    color: roleColors[u.orgRole] || '#908fa0'
                  }}>
                  {u.orgRole.replace('ORG_', '')}
                </span>
                {u.active && (
                  <button onClick={() => handleDeactivate(u.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl transition-all hover:bg-red-500/15"
                    style={{ color: '#908fa0' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ ease: [0.22, 1, 0.36, 1] }}
              className="glass glow-indigo rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <UserCircle2 size={18} style={{ color: '#6366f1' }} />
                  <h3 className="text-lg font-semibold">Invite User</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: '#908fa0' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <input className="input-pill" type="email" placeholder="Email address" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoFocus />
                <input className="input-pill" type="password" placeholder="Temporary password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />

                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: '#908fa0' }}>Role</label>
                  <div className="flex gap-2">
                    {['ORG_MEMBER', 'ORG_ADMIN'].map(r => (
                      <button type="button" key={r} onClick={() => setForm(f => ({ ...f, orgRole: r }))}
                        className="flex-1 py-2 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: form.orgRole === r ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                          color: form.orgRole === r ? '#c0c1ff' : '#908fa0',
                          border: form.orgRole === r ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)'
                        }}>{r.replace('ORG_', '')}</button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm px-2" style={{ color: '#ffb4ab' }}>{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-glass flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={submitting}>
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : 'Invite'}
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
