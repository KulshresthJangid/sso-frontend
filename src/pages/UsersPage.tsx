import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, X, Users } from 'lucide-react'
import { usersApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

interface User {
  id: string
  email: string
  orgRole: string
  active: boolean
}

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

function Avatar({ email }: { email: string }) {
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7']
  const idx = email.charCodeAt(0) % colors.length
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: colors[idx] + '20',
      border: `1px solid ${colors[idx]}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.75rem', fontWeight: 600, color: colors[idx],
    }}>
      {email[0].toUpperCase()}
    </div>
  )
}

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
    try {
      const data = await usersApi.list(slug!)
      if (!Array.isArray(data)) return
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await usersApi.create(slug!, form)
      setShowModal(false)
      setForm({ email: '', password: '', orgRole: 'ORG_MEMBER' })
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create user.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(id: string) {
    await usersApi.deactivate(slug!, id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: false } : u))
  }

  const activeCount = users.filter(u => u.active).length

  return (
    <div style={{ padding: '1.75rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.25rem' }}>
            Users
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>
            {activeCount} active member{activeCount !== 1 ? 's' : ''} in{' '}
            <code style={{ color: 'var(--text-1)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{slug}</code>
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <Plus size={14} /> Invite User
        </button>
      </div>

      {/* Table card */}
      <div className="card" style={{ overflow: 'hidden', background: 'var(--surface)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
            <Loader2 size={20} style={{ color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <Users size={32} />
            <p style={{ fontWeight: 500, color: 'var(--text-2)', fontSize: '0.9rem' }}>No users yet</p>
            <p style={{ fontSize: '0.8125rem' }}>Invite the first member of your organization.</p>
            <button
              className="btn-secondary"
              onClick={() => setShowModal(true)}
              style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <Plus size={14} /> Invite User
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ width: 52 }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ opacity: u.active ? 1 : 0.5 }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar email={u.email} />
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-1)' }}>
                            {u.email}
                          </p>
                          {!u.active && (
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Deactivated</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.orgRole === 'ORG_ADMIN' ? 'badge-indigo' : 'badge-gray'}`}>
                        {u.orgRole === 'ORG_ADMIN' ? 'Admin' : 'Member'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {u.active && u.orgRole !== 'ORG_ADMIN' && (
                        <button
                          className="btn-danger"
                          onClick={() => handleDeactivate(u.id)}
                          title="Deactivate user"
                          style={{ padding: '0.375rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite modal */}
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
                width: '100%', maxWidth: 420,
                padding: '1.5rem',
                background: 'var(--surface)',
                border: '1px solid var(--border-2)',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '1.25rem',
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>Invite User</h3>
                <button className="btn-ghost" onClick={() => { setShowModal(false); setError('') }} style={{ padding: '0.25rem' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p className="section-label">Email address</p>
                  <input
                    className="input"
                    type="email"
                    placeholder="colleague@company.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <p className="section-label">Temporary password</p>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <p className="section-label">Role</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['ORG_MEMBER', 'ORG_ADMIN'] as const).map(r => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setForm(f => ({ ...f, orgRole: r }))}
                        style={{
                          flex: 1, padding: '0.5rem 0.75rem',
                          borderRadius: '0.5rem', cursor: 'pointer',
                          fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 500,
                          transition: 'all 0.15s',
                          background: form.orgRole === r ? 'var(--accent)' : 'var(--surface-2)',
                          color: form.orgRole === r ? '#fff' : 'var(--text-2)',
                          border: form.orgRole === r ? '1px solid var(--accent)' : '1px solid var(--border)',
                        }}
                      >
                        {r === 'ORG_ADMIN' ? 'Admin' : 'Member'}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--error)' }}>{error}</p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setShowModal(false); setError('') }}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >Cancel</button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting || !form.email || !form.password}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {submitting
                      ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      : 'Send Invite'}
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
