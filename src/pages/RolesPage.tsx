import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, X, Shield, Lock } from 'lucide-react'
import { rolesApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

interface Role { id: string; name: string; description: string; clientId: string }
interface Permission { id: string; name: string; resource: string; action: string }

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

export default function RolesPage() {
  const { slug } = useOrgStore()
  const [roles, setRoles] = useState<Role[]>([])
  const [perms, setPerms] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles')
  const [showModal, setShowModal] = useState<'role' | 'perm' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [roleForm, setRoleForm] = useState({ name: '', description: '', clientId: '' })
  const [permForm, setPermForm] = useState({ name: '', resource: '', action: '' })

  useEffect(() => { if (slug) load() }, [slug])

  async function load() {
    setLoading(true)
    try {
      const [r, p] = await Promise.all([
        rolesApi.listRoles(slug!).catch(() => []),
        rolesApi.listPermissions(slug!).catch(() => []),
      ])
      setRoles(Array.isArray(r) ? r : [])
      setPerms(Array.isArray(p) ? p : [])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await rolesApi.createRole(slug!, roleForm)
      setShowModal(null)
      setRoleForm({ name: '', description: '', clientId: '' })
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreatePerm(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await rolesApi.createPermission(slug!, permForm)
      setShowModal(null)
      setPermForm({ name: '', resource: '', action: '' })
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteRole(id: string) {
    await rolesApi.deleteRole(slug!, id)
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  function Modal({ type }: { type: 'role' | 'perm' }) {
    const isRole = type === 'role'
    return (
      <motion.div
        className="modal-overlay"
        variants={MODAL_BG}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={() => setShowModal(null)}
      >
        <motion.div
          variants={MODAL_CARD}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={e => e.stopPropagation()}
          className="card"
          style={{
            width: '100%', maxWidth: 420, padding: '1.5rem',
            background: 'var(--surface)', border: '1px solid var(--border-2)',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isRole
                ? <Shield size={15} style={{ color: 'var(--accent)' }} />
                : <Lock size={15} style={{ color: 'var(--accent)' }} />}
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>
                {isRole ? 'Create Role' : 'Create Permission'}
              </h3>
            </div>
            <button className="btn-ghost" onClick={() => setShowModal(null)} style={{ padding: '0.25rem' }}>
              <X size={16} />
            </button>
          </div>

          {isRole ? (
            <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p className="section-label">Role name</p>
                <input className="input" placeholder="editor" value={roleForm.name}
                  onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
              </div>
              <div>
                <p className="section-label">Description <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(optional)</span></p>
                <input className="input" placeholder="Can edit content" value={roleForm.description}
                  onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <p className="section-label">Client ID <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(leave blank for org-wide)</span></p>
                <input className="input" placeholder="550e8400-..." value={roleForm.clientId}
                  onChange={e => setRoleForm(f => ({ ...f, clientId: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(null)}
                  style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}
                  style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Create Role'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreatePerm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p className="section-label">Permission name</p>
                <input className="input" placeholder="document:read" value={permForm.name}
                  onChange={e => setPermForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
              </div>
              <div>
                <p className="section-label">Resource</p>
                <input className="input" placeholder="document" value={permForm.resource}
                  onChange={e => setPermForm(f => ({ ...f, resource: e.target.value }))} required />
              </div>
              <div>
                <p className="section-label">Action</p>
                <input className="input" placeholder="read" value={permForm.action}
                  onChange={e => setPermForm(f => ({ ...f, action: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(null)}
                  style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}
                  style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Create Permission'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div style={{ padding: '1.75rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.25rem' }}>
            Roles & Permissions
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>
            Control what users can do in each application.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowModal(activeTab === 'roles' ? 'role' : 'perm')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <Plus size={14} />
          Create {activeTab === 'roles' ? 'Role' : 'Permission'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.25rem',
        padding: '0.25rem',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.625rem', width: 'fit-content',
      }}>
        {(['roles', 'permissions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.4rem 1rem', borderRadius: '0.375rem',
              fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
              background: activeTab === tab ? 'var(--surface-2)' : 'transparent',
              color: activeTab === tab ? 'var(--text-1)' : 'var(--text-3)',
              border: activeTab === tab ? '1px solid var(--border)' : '1px solid transparent',
              textTransform: 'capitalize',
            }}
          >{tab}</button>
        ))}
      </div>

      {/* Content card */}
      <div className="card" style={{ overflow: 'hidden', background: 'var(--surface)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
            <Loader2 size={20} style={{ color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : activeTab === 'roles' ? (
          roles.length === 0 ? (
            <div className="empty-state">
              <Shield size={32} />
              <p style={{ fontWeight: 500, color: 'var(--text-2)', fontSize: '0.9rem' }}>No roles yet</p>
              <p style={{ fontSize: '0.8125rem' }}>Create roles to control user access in your apps.</p>
              <button className="btn-secondary" onClick={() => setShowModal('role')}
                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Plus size={14} /> Create Role
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Description</th>
                    <th>Scope</th>
                    <th style={{ width: 52 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '0.375rem',
                            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Shield size={13} style={{ color: 'var(--accent)' }} />
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-1)' }}>{r.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-3)', fontSize: '0.8125rem' }}>
                        {r.description || '—'}
                      </td>
                      <td>
                        <span className={`badge ${!r.clientId || r.clientId === 'org-level' ? 'badge-indigo' : 'badge-gray'}`}>
                          {!r.clientId || r.clientId === 'org-level' ? 'Org-wide' : 'App-specific'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-danger"
                          onClick={() => deleteRole(r.id)}
                          title="Delete role"
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
          )
        ) : (
          perms.length === 0 ? (
            <div className="empty-state">
              <Lock size={32} />
              <p style={{ fontWeight: 500, color: 'var(--text-2)', fontSize: '0.9rem' }}>No permissions yet</p>
              <p style={{ fontSize: '0.8125rem' }}>
                Create permissions like{' '}
                <code className="code-inline">document:read</code>
              </p>
              <button className="btn-secondary" onClick={() => setShowModal('perm')}
                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Plus size={14} /> Create Permission
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Resource</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {perms.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '0.375rem',
                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Lock size={13} style={{ color: '#f59e0b' }} />
                          </div>
                          <code className="code-inline">{p.name}</code>
                        </div>
                      </td>
                      <td><code className="code-inline">{p.resource}</code></td>
                      <td><span className="badge badge-amber">{p.action}</span></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal === 'role' && <Modal type="role" key="role-modal" />}
        {showModal === 'perm' && <Modal type="perm" key="perm-modal" />}
      </AnimatePresence>
    </div>
  )
}
