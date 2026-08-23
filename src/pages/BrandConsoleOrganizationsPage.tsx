import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Loader2, Building2, ArrowRight } from 'lucide-react'
import { brandConsoleApi, type BrandOrgSummary } from '../lib/api'
import { useBrandConsoleStore } from '../store/brandConsoleStore'
import { useOrgStore } from '../store/orgStore'

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

const EMPTY_FORM = { orgName: '', orgSlug: '', adminEmail: '', adminPassword: '' }

// The self-service equivalent of what you (the platform operator) do for a
// brand itself, one level down: a brand's own SUPER_ADMIN onboarding a
// customer org (with its first admin) under their brand, without needing
// you in the loop — see BrandConsoleController.createOrganization.
export default function BrandConsoleOrganizationsPage() {
  const navigate = useNavigate()
  const { brandSlug, brandName } = useBrandConsoleStore()
  const { setOrg } = useOrgStore()
  const [orgs, setOrgs] = useState<BrandOrgSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { if (brandSlug) load() }, [brandSlug])

  // Reuses the exact same org-admin dashboard (Users, Roles & Permissions,
  // Applications) an ORG_ADMIN sees when they log in directly — OrgAccessFilter
  // on the backend now allows a brand's SUPER_ADMIN into any org under their
  // own brand, so this "just" points the existing orgStore at the selected
  // org and reuses the whole dashboard route tree as-is.
  function manageOrg(org: BrandOrgSummary) {
    setOrg(org.slug, org.name)
    navigate('/dashboard')
  }

  async function load() {
    setLoading(true)
    try {
      const data = await brandConsoleApi.listOrganizations(brandSlug!)
      setOrgs(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  function slugify(name: string) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      await brandConsoleApi.createOrganization(brandSlug!, {
        orgName: form.orgName,
        orgSlug: form.orgSlug || slugify(form.orgName),
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      })
      setShowModal(false)
      setForm(EMPTY_FORM)
      await load()
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to create organization.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.25rem' }}>Organizations</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>
            Customer orgs under {brandName || 'your brand'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Plus size={14} /> New Organization
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden', background: 'var(--surface)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
            <Loader2 size={20} style={{ color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : orgs.length === 0 ? (
          <div className="empty-state">
            <Building2 size={32} />
            <p style={{ fontWeight: 500, color: 'var(--text-2)', fontSize: '0.9rem' }}>No organizations yet</p>
            <p style={{ fontSize: '0.8125rem' }}>Create your first customer organization to get started.</p>
            <button className="btn-secondary" onClick={() => setShowModal(true)} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Plus size={14} /> New Organization
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o, i) => (
                  <motion.tr key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '0.375rem', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={13} style={{ color: 'var(--accent)' }} />
                        </div>
                        <span style={{ color: 'var(--text-1)', fontWeight: 500, fontSize: '0.875rem' }}>{o.name}</span>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.72rem', color: 'var(--text-2)', fontFamily: "'JetBrains Mono', monospace", background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '0.3rem' }}>
                        {o.slug}
                      </code>
                    </td>
                    <td>
                      <span className={o.active ? 'badge badge-green' : 'badge badge-gray'}>{o.active ? 'Active' : 'Deactivated'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => manageOrg(o)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', padding: '0.375rem 0.75rem' }}
                      >
                        Manage <ArrowRight size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" variants={MODAL_BG} initial="hidden" animate="visible" exit="exit" onClick={() => setShowModal(false)}>
            <motion.div variants={MODAL_CARD} initial="hidden" animate="visible" exit="exit" onClick={e => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 468, padding: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>New Organization</h3>
                <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '0.25rem' }}><X size={16} /></button>
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p className="section-label">Organization Name</p>
                  <input
                    className="input"
                    placeholder="Acme Corp"
                    value={form.orgName}
                    onChange={e => setForm(f => ({ ...f, orgName: e.target.value, orgSlug: f.orgSlug || slugify(e.target.value) }))}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <p className="section-label">Slug</p>
                  <input
                    className="input"
                    placeholder="acme-corp"
                    value={form.orgSlug}
                    onChange={e => setForm(f => ({ ...f, orgSlug: slugify(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <p className="section-label">Admin Email</p>
                  <input
                    className="input"
                    type="email"
                    placeholder="admin@acme.com"
                    value={form.adminEmail}
                    onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <p className="section-label">Admin Password <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(8+ characters)</span></p>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••••"
                    value={form.adminPassword}
                    onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                    required
                  />
                </div>

                {formError && <p style={{ fontSize: '0.8125rem', color: 'var(--error)' }}>{formError}</p>}

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting || !form.orgName || !form.orgSlug || !form.adminEmail || form.adminPassword.length < 8} style={{ flex: 1, justifyContent: 'center' }}>
                    {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Create'}
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
