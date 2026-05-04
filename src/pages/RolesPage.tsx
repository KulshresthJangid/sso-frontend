import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, X, Shield, Lock } from 'lucide-react'
import { rolesApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

interface Role { id: string; name: string; description: string; clientId: string }
interface Permission { id: string; name: string; resource: string; action: string }

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
      const [r, p] = await Promise.all([rolesApi.listRoles(slug!), rolesApi.listPermissions(slug!)])
      setRoles(r); setPerms(p)
    } finally { setLoading(false) }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true)
    try {
      await rolesApi.createRole(slug!, roleForm)
      setShowModal(null); setRoleForm({ name: '', description: '', clientId: '' }); await load()
    } finally { setSubmitting(false) }
  }

  async function handleCreatePerm(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true)
    try {
      await rolesApi.createPermission(slug!, permForm)
      setShowModal(null); setPermForm({ name: '', resource: '', action: '' }); await load()
    } finally { setSubmitting(false) }
  }

  async function deleteRole(id: string) {
    await rolesApi.deleteRole(slug!, id)
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm mt-1" style={{ color: '#908fa0' }}>Control what users can do in each app</p>
        </div>
        <button onClick={() => setShowModal(activeTab === 'roles' ? 'role' : 'perm')}
          className="btn-primary w-auto px-5 flex items-center gap-2">
          <Plus size={15} /> Create {activeTab === 'roles' ? 'Role' : 'Permission'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['roles', 'permissions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize relative"
            style={{ color: activeTab === tab ? '#e4e1ed' : '#908fa0' }}>
            {activeTab === tab && (
              <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.2)' }} />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: '#6366f1' }} />
          </div>
        ) : activeTab === 'roles' ? (
          roles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔐</p>
              <p className="font-medium mb-1">No roles yet</p>
              <p className="text-sm" style={{ color: '#908fa0' }}>Create roles to control user access</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {roles.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-4 group"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Shield size={15} style={{ color: '#6366f1' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.name}</p>
                    {r.description && <p className="text-xs mt-0.5" style={{ color: '#908fa0' }}>{r.description}</p>}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: r.clientId === 'org-level' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                    color: r.clientId === 'org-level' ? '#f59e0b' : '#c0c1ff'
                  }}>{r.clientId === 'org-level' ? 'Org-wide' : 'App-specific'}</span>
                  <button onClick={() => deleteRole(r.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-500/15 transition-all"
                    style={{ color: '#908fa0' }}>
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          perms.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔑</p>
              <p className="font-medium mb-1">No permissions yet</p>
              <p className="text-sm" style={{ color: '#908fa0' }}>Create permissions like <code className="text-xs px-1 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>document:read</code></p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {perms.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-4"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <Lock size={15} style={{ color: '#22c55e' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: '#908fa0' }}>{p.resource}:{p.action}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal === 'role' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ ease: [0.22, 1, 0.36, 1] }}
              className="glass glow-indigo rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Create Role</h3>
                <button onClick={() => setShowModal(null)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: '#908fa0' }}><X size={16} /></button>
              </div>
              <form onSubmit={handleCreateRole} className="flex flex-col gap-4">
                <input className="input-pill" placeholder="Role name (e.g. editor)" value={roleForm.name}
                  onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                <input className="input-pill" placeholder="Description (optional)" value={roleForm.description}
                  onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))} />
                <input className="input-pill" placeholder="Client ID (leave blank for org-level)" value={roleForm.clientId}
                  onChange={e => setRoleForm(f => ({ ...f, clientId: e.target.value }))} />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(null)} className="btn-glass flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={submitting}>
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showModal === 'perm' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ ease: [0.22, 1, 0.36, 1] }}
              className="glass glow-indigo rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Create Permission</h3>
                <button onClick={() => setShowModal(null)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: '#908fa0' }}><X size={16} /></button>
              </div>
              <form onSubmit={handleCreatePerm} className="flex flex-col gap-4">
                <input className="input-pill" placeholder="Name (e.g. document:read)" value={permForm.name}
                  onChange={e => setPermForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                <input className="input-pill" placeholder="Resource (e.g. document)" value={permForm.resource}
                  onChange={e => setPermForm(f => ({ ...f, resource: e.target.value }))} required />
                <input className="input-pill" placeholder="Action (e.g. read)" value={permForm.action}
                  onChange={e => setPermForm(f => ({ ...f, action: e.target.value }))} required />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(null)} className="btn-glass flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={submitting}>
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : 'Create'}
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
