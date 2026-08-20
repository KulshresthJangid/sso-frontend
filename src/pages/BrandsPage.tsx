import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Loader2, Store } from 'lucide-react'
import { brandsApi, type CreateBrandRequest } from '../lib/api'

interface Brand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
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

const EMPTY_FORM: CreateBrandRequest = {
  name: '', slug: '', logoUrl: '', primaryColor: '#465fff', secondaryColor: '#3641f5',
}

// Structural clone of AppsPage — same table/modal/loading/empty-state
// conventions, same CSS classes and framer-motion variants, applied to
// Brand instead of OAuth2 client.
export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CreateBrandRequest>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await brandsApi.list()
      setBrands(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  function slugify(name: string) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      await brandsApi.create({
        name: form.name,
        slug: form.slug || slugify(form.name),
        logoUrl: form.logoUrl || undefined,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
      })
      setShowModal(false)
      setForm(EMPTY_FORM)
      await load()
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to onboard brand.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(slug: string) {
    await brandsApi.delete(slug)
    setBrands(prev => prev.map(b => b.slug === slug ? { ...b, active: false } : b))
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
            Brands
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>
            White-label resellers onboarded on this platform.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <Plus size={14} /> Onboard Brand
        </button>
      </div>

      {/* Table card */}
      <div className="card" style={{ overflow: 'hidden', background: 'var(--surface)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
            <Loader2 size={20} style={{ color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : brands.length === 0 ? (
          <div className="empty-state">
            <Store size={32} />
            <p style={{ fontWeight: 500, color: 'var(--text-2)', fontSize: '0.9rem' }}>No brands onboarded yet</p>
            <p style={{ fontSize: '0.8125rem' }}>Onboard your first white-label brand to get started.</p>
            <button
              className="btn-secondary"
              onClick={() => setShowModal(true)}
              style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <Plus size={14} /> Onboard Brand
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Slug</th>
                  <th>Colors</th>
                  <th>Status</th>
                  <th style={{ width: 48 }}></th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        {b.logoUrl ? (
                          <img
                            src={b.logoUrl}
                            alt={b.name}
                            style={{
                              width: 28, height: 28, borderRadius: '0.375rem',
                              objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div style={{
                            width: 28, height: 28, borderRadius: '0.375rem',
                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Store size={13} style={{ color: 'var(--accent)' }} />
                          </div>
                        )}
                        <span style={{ color: 'var(--text-1)', fontWeight: 500, fontSize: '0.875rem' }}>
                          {b.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <code style={{
                        fontSize: '0.72rem', color: 'var(--text-2)',
                        fontFamily: "'JetBrains Mono', monospace",
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        padding: '0.2rem 0.5rem', borderRadius: '0.3rem',
                      }}>
                        buildwithkulshresth.com/{b.slug}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {b.primaryColor && (
                          <span title={b.primaryColor} style={{
                            width: 18, height: 18, borderRadius: '50%',
                            background: b.primaryColor, border: '1px solid var(--border)',
                          }} />
                        )}
                        {b.secondaryColor && (
                          <span title={b.secondaryColor} style={{
                            width: 18, height: 18, borderRadius: '50%',
                            background: b.secondaryColor, border: '1px solid var(--border)',
                          }} />
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={b.active ? 'badge badge-green' : 'badge badge-gray'}>
                        {b.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      {b.active && (
                        <button
                          className="btn-danger"
                          onClick={() => handleDeactivate(b.slug)}
                          title="Deactivate brand"
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

      {/* Onboard modal */}
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
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>Onboard Brand</h3>
                <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '0.25rem' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleOnboard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p className="section-label">Brand Name</p>
                  <input
                    className="input"
                    placeholder="Zoralis"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <p className="section-label">Slug <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(buildwithkulshresth.com/&lt;slug&gt;)</span></p>
                  <input
                    className="input"
                    placeholder="zoralis"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                    required
                  />
                </div>

                <div>
                  <p className="section-label">Logo URL <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(optional)</span></p>
                  <input
                    className="input"
                    placeholder="https://..."
                    value={form.logoUrl}
                    onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <p className="section-label">Primary Color</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="color"
                        value={form.primaryColor}
                        onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                        style={{ width: 36, height: 36, padding: 0, border: '1px solid var(--border)', borderRadius: '0.4rem', cursor: 'pointer' }}
                      />
                      <input
                        className="input"
                        value={form.primaryColor}
                        onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="section-label">Secondary Color</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="color"
                        value={form.secondaryColor}
                        onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                        style={{ width: 36, height: 36, padding: 0, border: '1px solid var(--border)', borderRadius: '0.4rem', cursor: 'pointer' }}
                      />
                      <input
                        className="input"
                        value={form.secondaryColor}
                        onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                        style={{ flex: 1 }}
                      />
                    </div>
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
                    disabled={submitting || !form.name || !form.slug}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {submitting
                      ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      : 'Onboard'}
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
