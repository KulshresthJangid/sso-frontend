import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, X, Shield, Lock, RefreshCw, Settings2, Check } from 'lucide-react'
import { rolesApi, clientsApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

interface Role { id: string; name: string; description: string; clientId: string; permissionIds: string[] }
interface Permission { id: string; name: string; resource: string; action: string }
interface Client { id: string; clientId: string; clientName: string; permissionsUri?: string | null }

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

function PermissionChecklist({
  perms, checked, onToggle,
}: { perms: Permission[]; checked: string[]; onToggle: (id: string) => void }) {
  if (perms.length === 0) {
    return (
      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', padding: '0.5rem 0' }}>
        No permissions in this org yet — create some or sync from an app on the Permissions tab first.
      </p>
    )
  }
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
      maxHeight: 220, overflowY: 'auto',
      border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.5rem',
      background: 'var(--surface-2)',
    }}>
      {perms.map(p => {
        const isChecked = checked.includes(p.id)
        return (
          <label
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.4rem 0.5rem', borderRadius: '0.375rem',
              cursor: 'pointer', fontSize: '0.8125rem',
              background: isChecked ? 'rgba(99,102,241,0.08)' : 'transparent',
            }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: '0.25rem', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: isChecked ? '1px solid var(--accent)' : '1px solid var(--border-2)',
              background: isChecked ? 'var(--accent)' : 'transparent',
            }}>
              {isChecked && <Check size={11} style={{ color: '#fff' }} />}
            </span>
            <input type="checkbox" checked={isChecked} onChange={() => onToggle(p.id)} style={{ display: 'none' }} />
            <code className="code-inline" style={{ fontSize: '0.75rem' }}>{p.name}</code>
            <span style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>{p.resource} · {p.action}</span>
          </label>
        )
      })}
    </div>
  )
}

export default function RolesPage() {
  const { slug } = useOrgStore()
  const [roles, setRoles] = useState<Role[]>([])
  const [perms, setPerms] = useState<Permission[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles')
  const [showModal, setShowModal] = useState<'role' | 'perm' | 'rolePerms' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [roleForm, setRoleForm] = useState<{ name: string; description: string; clientId: string; permissionIds: string[] }>({ name: '', description: '', clientId: '', permissionIds: [] })
  const [permForm, setPermForm] = useState({ name: '', resource: '', action: '' })
  const [syncClientId, setSyncClientId] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')
  // Which role's "Edit permissions" modal is open, and the checkbox state
  // being edited — seeded from that role's current permissionIds, diffed
  // against on save so only the actual changes hit assign/revoke.
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editingPermIds, setEditingPermIds] = useState<string[]>([])

  useEffect(() => { if (slug) load() }, [slug])

  async function load() {
    setLoading(true)
    try {
      const [r, p, c] = await Promise.all([
        rolesApi.listRoles(slug!).catch(() => []),
        rolesApi.listPermissions(slug!).catch(() => []),
        clientsApi.list(slug!).catch(() => []),
      ])
      setRoles(Array.isArray(r) ? r : [])
      setPerms(Array.isArray(p) ? p : [])
      setClients(Array.isArray(c) ? c : [])
    } finally {
      setLoading(false)
    }
  }

  // Apps that actually declared a permissionsUri at registration — see
  // RegisteredClientEntity.permissionsUri / SMAT's PermissionCatalogController
  // for the reference implementation an app implements to show up here.
  const syncableClients = clients.filter(c => c.permissionsUri)

  async function handleSync() {
    if (!syncClientId) return
    setSyncing(true)
    setSyncError('')
    try {
      await rolesApi.syncPermissions(slug!, syncClientId)
      await load()
    } catch (err: any) {
      setSyncError(err?.response?.data?.message || 'Failed to sync permissions from this app.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const created = await rolesApi.createRole(slug!, {
        name: roleForm.name, description: roleForm.description, clientId: roleForm.clientId,
      })
      // Role has to exist before permissions can attach to it — assign
      // whatever was checked in the create form as a second step.
      await Promise.all(roleForm.permissionIds.map(pid => rolesApi.assignPermission(slug!, created.id, pid)))
      setShowModal(null)
      setRoleForm({ name: '', description: '', clientId: '', permissionIds: [] })
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  function toggleRoleFormPerm(id: string) {
    setRoleForm(f => ({
      ...f,
      permissionIds: f.permissionIds.includes(id) ? f.permissionIds.filter(x => x !== id) : [...f.permissionIds, id],
    }))
  }

  function openEditPermissions(role: Role) {
    setEditingRole(role)
    setEditingPermIds(role.permissionIds)
    setShowModal('rolePerms')
  }

  function toggleEditingPerm(id: string) {
    setEditingPermIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSaveRolePermissions() {
    if (!editingRole) return
    setSubmitting(true)
    try {
      const before = new Set(editingRole.permissionIds)
      const after = new Set(editingPermIds)
      const toAdd = editingPermIds.filter(id => !before.has(id))
      const toRemove = editingRole.permissionIds.filter(id => !after.has(id))
      await Promise.all([
        ...toAdd.map(id => rolesApi.assignPermission(slug!, editingRole.id, id)),
        ...toRemove.map(id => rolesApi.revokePermission(slug!, editingRole.id, id)),
      ])
      setShowModal(null)
      setEditingRole(null)
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
                <p className="section-label">App <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(leave as org-wide unless this role is for one app)</span></p>
                <select className="input" value={roleForm.clientId}
                  onChange={e => setRoleForm(f => ({ ...f, clientId: e.target.value }))}>
                  <option value="">Org-wide (no specific app)</option>
                  {clients.map(c => (
                    <option key={c.clientId} value={c.clientId}>{c.clientName}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="section-label">Permissions <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(optional — can also edit later)</span></p>
                <PermissionChecklist
                  perms={perms}
                  checked={roleForm.permissionIds}
                  onToggle={toggleRoleFormPerm}
                />
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

      {/* Sync from app — only apps that declared a permissionsUri at
          registration show up here (see RegisteredClientEntity.permissionsUri).
          Populates the org's own Permission rows from what the app itself
          says it supports, instead of typing exact strings by hand. */}
      {activeTab === 'permissions' && syncableClients.length > 0 && (
        <div className="card" style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.875rem 1.125rem', marginBottom: '1.25rem',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <RefreshCw size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', flexShrink: 0 }}>Sync permissions from</span>
          <select
            className="input"
            value={syncClientId}
            onChange={e => { setSyncClientId(e.target.value); setSyncError('') }}
            style={{ maxWidth: 240 }}
          >
            <option value="">Choose an app…</option>
            {syncableClients.map(c => (
              <option key={c.clientId} value={c.clientId}>{c.clientName}</option>
            ))}
          </select>
          <button
            className="btn-secondary"
            onClick={handleSync}
            disabled={!syncClientId || syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            {syncing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Sync'}
          </button>
          {syncError && <span style={{ fontSize: '0.8rem', color: 'var(--error)' }}>{syncError}</span>}
        </div>
      )}

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
                    <th>Permissions</th>
                    <th style={{ width: 84 }}></th>
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
                        <span className={r.permissionIds.length > 0 ? 'badge badge-amber' : 'badge badge-gray'}>
                          {r.permissionIds.length} {r.permissionIds.length === 1 ? 'permission' : 'permissions'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button
                            className="btn-secondary"
                            onClick={() => openEditPermissions(r)}
                            title="Edit permissions"
                            style={{ padding: '0.375rem' }}
                          >
                            <Settings2 size={14} />
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => deleteRole(r.id)}
                            title="Delete role"
                            style={{ padding: '0.375rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
        {showModal === 'rolePerms' && editingRole && (
          <motion.div
            key="role-perms-modal"
            className="modal-overlay"
            variants={MODAL_BG}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => { setShowModal(null); setEditingRole(null) }}
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
                  <Settings2 size={15} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>
                    Permissions for {editingRole.name}
                  </h3>
                </div>
                <button className="btn-ghost" onClick={() => { setShowModal(null); setEditingRole(null) }} style={{ padding: '0.25rem' }}>
                  <X size={16} />
                </button>
              </div>

              <PermissionChecklist
                perms={perms}
                checked={editingPermIds}
                onToggle={toggleEditingPerm}
              />

              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(null); setEditingRole(null) }}
                  style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="button" className="btn-primary" disabled={submitting} onClick={handleSaveRolePermissions}
                  style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
