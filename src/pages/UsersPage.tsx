import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, X, Users, Shield, ShieldPlus } from 'lucide-react'
import { usersApi, rolesApi, clientsApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

interface User {
  id: string
  email: string
  orgRole: string
  active: boolean
}

interface Role { id: string; name: string; description: string; clientId: string }
interface Client { id: string; clientId: string; clientName: string }
interface UserRoleAssignment { roleId: string; roleName: string; clientId: string }

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

  // Role-management modal — separate from the org-wide `roles`/`clients`
  // lists (fetched once, lazily, on first open) and the per-user assignment
  // list (refetched every time a different user's modal opens, since it's
  // small and can change from other tabs/sessions).
  const [rolesLoaded, setRolesLoaded] = useState(false)
  const [orgRoles, setOrgRoles] = useState<Role[]>([])
  const [orgClients, setOrgClients] = useState<Client[]>([])
  const [rolesModalUser, setRolesModalUser] = useState<User | null>(null)
  const [userRoles, setUserRoles] = useState<UserRoleAssignment[]>([])
  const [userRolesLoading, setUserRolesLoading] = useState(false)
  const [assignForm, setAssignForm] = useState({ roleId: '', clientId: '' })
  const [assigning, setAssigning] = useState(false)
  const [rolesError, setRolesError] = useState('')

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

  async function openRolesModal(user: User) {
    setRolesModalUser(user)
    setRolesError('')
    setAssignForm({ roleId: '', clientId: '' })
    if (!rolesLoaded) {
      try {
        const [r, c] = await Promise.all([rolesApi.listRoles(slug!), clientsApi.list(slug!)])
        setOrgRoles(Array.isArray(r) ? r : [])
        setOrgClients(Array.isArray(c) ? c : [])
        setRolesLoaded(true)
      } catch {
        setRolesError('Failed to load roles/apps for this org.')
      }
    }
    await loadUserRoles(user.id)
  }

  async function loadUserRoles(userId: string) {
    setUserRolesLoading(true)
    try {
      const data = await rolesApi.listUserRoles(slug!, userId)
      setUserRoles(Array.isArray(data) ? data : [])
    } catch {
      setRolesError('Failed to load this user\'s current roles.')
    } finally {
      setUserRolesLoading(false)
    }
  }

  async function handleAssignRole() {
    if (!rolesModalUser || !assignForm.roleId || !assignForm.clientId) return
    setAssigning(true)
    setRolesError('')
    try {
      await rolesApi.assignRoleToUser(slug!, rolesModalUser.id, assignForm.roleId, assignForm.clientId)
      setAssignForm({ roleId: '', clientId: '' })
      await loadUserRoles(rolesModalUser.id)
    } catch (err: any) {
      setRolesError(err?.response?.data?.message || 'Failed to assign role.')
    } finally {
      setAssigning(false)
    }
  }

  async function handleRevokeRole(roleId: string, clientId: string) {
    if (!rolesModalUser) return
    setRolesError('')
    try {
      await rolesApi.revokeRoleFromUser(slug!, rolesModalUser.id, roleId, clientId)
      setUserRoles(prev => prev.filter(ur => !(ur.roleId === roleId && ur.clientId === clientId)))
    } catch (err: any) {
      setRolesError(err?.response?.data?.message || 'Failed to revoke role.')
    }
  }

  function clientName(clientId: string): string {
    return orgClients.find(c => c.clientId === clientId)?.clientName || clientId
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
                  <th style={{ width: 92 }}></th>
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
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        {u.active && (
                          <button
                            className="btn-secondary"
                            onClick={() => openRolesModal(u)}
                            title="Manage roles"
                            style={{ padding: '0.375rem' }}
                          >
                            <ShieldPlus size={14} />
                          </button>
                        )}
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
                      </div>
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

      {/* Manage Roles modal — assign/revoke this user's app-scoped roles.
          A role assignment is always tied to one app (clientId), even for
          an org-wide role, because SSOTokenCustomizer resolves a JWT's
          permissions[] per (workspace, user, client) — see RoleService's
          own comment on assignRoleToUser. */}
      <AnimatePresence>
        {rolesModalUser && (
          <motion.div
            className="modal-overlay"
            variants={MODAL_BG}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setRolesModalUser(null)}
          >
            <motion.div
              variants={MODAL_CARD}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={e => e.stopPropagation()}
              className="card"
              style={{ width: '100%', maxWidth: 460, padding: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border-2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={15} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>Manage Roles</h3>
                </div>
                <button className="btn-ghost" onClick={() => setRolesModalUser(null)} style={{ padding: '0.25rem' }}>
                  <X size={16} />
                </button>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '1.25rem' }}>{rolesModalUser.email}</p>

              {/* Current assignments */}
              <div style={{ marginBottom: '1.25rem' }}>
                <p className="section-label">Assigned roles</p>
                {userRolesLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
                    <Loader2 size={16} style={{ color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : userRoles.length === 0 ? (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', padding: '0.5rem 0' }}>No roles assigned yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {userRoles.map(ur => (
                      <div
                        key={`${ur.roleId}:${ur.clientId}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.5rem 0.625rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border)', background: 'var(--surface-2)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-1)' }}>{ur.roleName}</span>
                          <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{clientName(ur.clientId)}</span>
                        </div>
                        <button
                          className="btn-ghost"
                          onClick={() => handleRevokeRole(ur.roleId, ur.clientId)}
                          title="Revoke role"
                          style={{ padding: '0.25rem', flexShrink: 0 }}
                        >
                          <Trash2 size={13} style={{ color: 'var(--error)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign new */}
              <div>
                <p className="section-label">Assign a role</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <select
                    className="input"
                    value={assignForm.roleId}
                    onChange={e => setAssignForm(f => ({ ...f, roleId: e.target.value }))}
                  >
                    <option value="">Choose a role…</option>
                    {orgRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={assignForm.clientId}
                    onChange={e => setAssignForm(f => ({ ...f, clientId: e.target.value }))}
                  >
                    <option value="">Choose an app…</option>
                    {orgClients.map(c => (
                      <option key={c.clientId} value={c.clientId}>{c.clientName}</option>
                    ))}
                  </select>
                  {orgRoles.length === 0 && rolesLoaded && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      No roles exist in this org yet — create one on the Roles &amp; Permissions page first.
                    </p>
                  )}
                  <button
                    className="btn-primary"
                    onClick={handleAssignRole}
                    disabled={assigning || !assignForm.roleId || !assignForm.clientId}
                    style={{ justifyContent: 'center' }}
                  >
                    {assigning ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Assign'}
                  </button>
                </div>
              </div>

              {rolesError && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--error)', marginTop: '0.875rem' }}>{rolesError}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
