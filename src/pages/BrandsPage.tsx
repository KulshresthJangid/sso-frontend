import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Loader2, Store, Check, ArrowLeft, ArrowRight, ShieldCheck, Pencil } from 'lucide-react'
import { brandsApi, type CreateBrandRequest, type UpdateBrandRequest } from '../lib/api'
import { TEMPLATES, type Template, type TemplateId } from '../lib/templates'
import { FONTS, getFont, type FontId, type FontOption } from '../lib/fonts'

interface Brand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  landingTemplate: string | null
  dashboardTemplate: string | null
  landingFont: string | null
  dashboardFont: string | null
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
const STEP_CONTENT: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24, transition: { duration: 0.15 } }),
}

const EMPTY_FORM: Omit<CreateBrandRequest, 'landingTemplate' | 'dashboardTemplate' | 'landingFont' | 'dashboardFont'> & {
  landingTemplate: TemplateId
  dashboardTemplate: TemplateId
  landingFont: FontId | null
  dashboardFont: FontId | null
  superAdminEmail: string
  superAdminPassword: string
} = {
  name: '', slug: '', logoUrl: '',
  primaryColor: TEMPLATES[0].primaryColor, secondaryColor: TEMPLATES[0].secondaryColor,
  landingTemplate: 'MINIMAL', dashboardTemplate: 'MINIMAL',
  landingFont: null, dashboardFont: null,
  superAdminEmail: '', superAdminPassword: '',
}

const STEPS = ['Name & Slug', 'Landing Page', 'Dashboard', 'Colors', 'Super Admin'] as const

// Where a brand's own frontend actually lives — was hardcoded to
// "buildwithkulshresth.com" which is wrong for local testing (and for any
// future deployment on a different domain). VITE_APP_BASE_URL lets it be
// pinned explicitly (e.g. in .env.production); with nothing set, it falls
// back to wherever this console itself is being served from — correct in
// prod (sso-frontend and kaizex-frontend share the same domain, just
// different nginx paths) and honestly "local" during local testing, rather
// than a domain that flatly isn't where anything is running right now.
const entryHost = import.meta.env.VITE_APP_BASE_URL ?? window.location.host

// Structural clone of AppsPage — same table/modal/loading/empty-state
// conventions, same CSS classes and framer-motion variants, applied to
// Brand instead of OAuth2 client. The onboard modal is now a 4-step wizard
// (name/slug → landing style → dashboard style → colors) instead of a
// single flat form.
export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  // Set once brandsApi.create() succeeds — lets a failed super-admin step
  // retry just that call instead of re-submitting the whole brand (which
  // would 409 on the now-taken slug).
  const [createdBrandSlug, setCreatedBrandSlug] = useState<string | null>(null)

  // Edit modal — separate from the onboard wizard: a single-page form
  // (not stepped) since you're tweaking an already-onboarded brand, not
  // walking through first-time setup. Slug isn't editable here (see
  // UpdateBrandRequest); no super-admin step either, that's created once.
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [editForm, setEditForm] = useState<Omit<UpdateBrandRequest, 'landingTemplate' | 'dashboardTemplate' | 'landingFont' | 'dashboardFont'> & {
    landingTemplate: TemplateId
    dashboardTemplate: TemplateId
    landingFont: FontId | null
    dashboardFont: FontId | null
  }>({
    name: '', logoUrl: '', primaryColor: TEMPLATES[0].primaryColor, secondaryColor: TEMPLATES[0].secondaryColor,
    landingTemplate: 'MINIMAL', dashboardTemplate: 'MINIMAL',
    landingFont: null, dashboardFont: null,
  })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

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

  function openModal() {
    setForm(EMPTY_FORM)
    setStep(0)
    setDir(1)
    setFormError('')
    setCreatedBrandSlug(null)
    setShowModal(true)
  }

  function goTo(next: number) {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  function pickLandingTemplate(t: Template) {
    // Pre-fills the color step's defaults from whichever landing style was
    // picked — still fully editable in step 4.
    setForm(f => ({ ...f, landingTemplate: t.id, primaryColor: t.primaryColor, secondaryColor: t.secondaryColor }))
  }

  async function handleOnboard() {
    setSubmitting(true)
    setFormError('')
    try {
      let slug = createdBrandSlug
      if (!slug) {
        slug = form.slug || slugify(form.name)
        await brandsApi.create({
          name: form.name,
          slug,
          logoUrl: form.logoUrl || undefined,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          landingTemplate: form.landingTemplate,
          dashboardTemplate: form.dashboardTemplate,
          landingFont: form.landingFont ?? undefined,
          dashboardFont: form.dashboardFont ?? undefined,
        })
        // The brand now exists regardless of what happens below — record
        // it so a failed/retried super-admin call never re-POSTs the brand.
        setCreatedBrandSlug(slug)
      }

      await brandsApi.createSuperAdmin(slug, {
        email: form.superAdminEmail,
        password: form.superAdminPassword,
      })

      setShowModal(false)
      setForm(EMPTY_FORM)
      setCreatedBrandSlug(null)
      await load()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to onboard brand.'
      setFormError(createdBrandSlug
        ? `Brand "${createdBrandSlug}" was created, but the super admin account failed: ${msg} — fix the fields below and try again.`
        : msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(slug: string) {
    await brandsApi.delete(slug)
    setBrands(prev => prev.map(b => b.slug === slug ? { ...b, active: false } : b))
  }

  function openEditModal(b: Brand) {
    setEditingBrand(b)
    setEditForm({
      name: b.name,
      logoUrl: b.logoUrl ?? '',
      primaryColor: b.primaryColor ?? TEMPLATES[0].primaryColor,
      secondaryColor: b.secondaryColor ?? TEMPLATES[0].secondaryColor,
      landingTemplate: (b.landingTemplate as TemplateId) ?? 'MINIMAL',
      dashboardTemplate: (b.dashboardTemplate as TemplateId) ?? 'MINIMAL',
      landingFont: (b.landingFont as FontId) ?? null,
      dashboardFont: (b.dashboardFont as FontId) ?? null,
    })
    setEditError('')
  }

  async function handleUpdate() {
    if (!editingBrand) return
    setEditSubmitting(true)
    setEditError('')
    try {
      await brandsApi.update(editingBrand.slug, {
        name: editForm.name,
        logoUrl: editForm.logoUrl || undefined,
        primaryColor: editForm.primaryColor,
        secondaryColor: editForm.secondaryColor,
        landingTemplate: editForm.landingTemplate,
        dashboardTemplate: editForm.dashboardTemplate,
        landingFont: editForm.landingFont ?? undefined,
        dashboardFont: editForm.dashboardFont ?? undefined,
      })
      setEditingBrand(null)
      await load()
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Failed to update brand.')
    } finally {
      setEditSubmitting(false)
    }
  }

  const canLeaveStep0 = !!form.name && !!(form.slug || slugify(form.name))
  const selectedLandingTemplate = TEMPLATES.find(t => t.id === form.landingTemplate) ?? TEMPLATES[0]
  const selectedDashboardTemplate = TEMPLATES.find(t => t.id === form.dashboardTemplate) ?? TEMPLATES[0]
  const editLandingTemplate = TEMPLATES.find(t => t.id === editForm.landingTemplate) ?? TEMPLATES[0]
  const editDashboardTemplate = TEMPLATES.find(t => t.id === editForm.dashboardTemplate) ?? TEMPLATES[0]

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
          onClick={openModal}
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
              onClick={openModal}
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
                  <th>Templates</th>
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
                        {entryHost}/{b.slug}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-gray" style={{ fontSize: '0.68rem' }}>
                          {b.landingTemplate ?? 'MINIMAL'}
                        </span>
                        <span className="badge badge-gray" style={{ fontSize: '0.68rem' }}>
                          {b.dashboardTemplate ?? 'MINIMAL'}
                        </span>
                      </div>
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
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {b.active && (
                          <button
                            className="btn-secondary"
                            onClick={() => openEditModal(b)}
                            title="Edit theme & branding"
                            style={{ padding: '0.375rem' }}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
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
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard wizard */}
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
                width: '100%', maxWidth: 860,
                padding: '1.5rem',
                background: 'var(--surface)',
                border: '1px solid var(--border-2)',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '1rem',
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>Onboard Brand</h3>
                <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '0.25rem' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
                {STEPS.map((label, i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: i < STEPS.length - 1 ? 1 : undefined }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      fontSize: '0.7rem', fontWeight: 600,
                      background: i <= step ? 'var(--accent)' : 'var(--surface-2)',
                      color: i <= step ? '#fff' : 'var(--text-3)',
                      border: i <= step ? 'none' : '1px solid var(--border)',
                      transition: 'background 0.2s',
                    }}>
                      {i < step ? <Check size={12} /> : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, borderRadius: 1, background: i < step ? 'var(--accent)' : 'var(--border)', transition: 'background 0.2s' }} />
                    )}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)', marginBottom: '1rem', marginTop: '-0.75rem' }}>
                Step {step + 1} of {STEPS.length} — {STEPS[step]}
              </p>

              <div style={{ minHeight: 280, overflow: 'hidden' }}>
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={STEP_CONTENT}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    {step === 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <p className="section-label">Brand Name</p>
                          <input
                            className="input"
                            placeholder="Zoralis"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))}
                            autoFocus
                          />
                        </div>
                        <div>
                          <p className="section-label">Slug <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>({entryHost}/&lt;slug&gt;)</span></p>
                          <input
                            className="input"
                            placeholder="zoralis"
                            value={form.slug}
                            onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
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
                      </div>
                    )}

                    {step === 1 && (
                      <div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '0.875rem' }}>
                          Pick the landing page design shown to visitors before they sign in.
                        </p>
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', width: 300, flexShrink: 0 }}>
                            {TEMPLATES.map(t => (
                              <TemplateCard
                                key={t.id}
                                template={t}
                                selected={form.landingTemplate === t.id}
                                onClick={() => pickLandingTemplate(t)}
                                mockup={<LandingMockup t={t} />}
                              />
                            ))}
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <BigLandingPreview t={selectedLandingTemplate} fontOverride={getFont(form.landingFont)} />
                            <FontPicker
                              template={selectedLandingTemplate}
                              value={form.landingFont}
                              onChange={f => setForm(prev => ({ ...prev, landingFont: f }))}
                              label="Landing"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '0.875rem' }}>
                          Pick the theme applied to their admin dashboard after login.
                        </p>
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', width: 300, flexShrink: 0 }}>
                            {TEMPLATES.map(t => (
                              <TemplateCard
                                key={t.id}
                                template={t}
                                selected={form.dashboardTemplate === t.id}
                                onClick={() => setForm(f => ({ ...f, dashboardTemplate: t.id }))}
                                mockup={<DashboardMockup t={t} />}
                              />
                            ))}
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <BigDashboardPreview t={selectedDashboardTemplate} fontOverride={getFont(form.dashboardFont)} />
                            <FontPicker
                              template={selectedDashboardTemplate}
                              value={form.dashboardFont}
                              onChange={f => setForm(prev => ({ ...prev, dashboardFont: f }))}
                              label="Dashboard"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>
                          Pre-filled from the <strong style={{ color: 'var(--text-1)' }}>{form.landingTemplate}</strong> template — tweak to match their brand.
                        </p>
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

                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.875rem', borderRadius: '0.5rem',
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                        }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: form.primaryColor, border: '1px solid var(--border)' }} />
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: form.secondaryColor, border: '1px solid var(--border)' }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
                            {form.name || 'Brand'} · {form.landingTemplate} landing · {form.dashboardTemplate} dashboard
                          </span>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                          display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                          padding: '0.75rem 0.875rem', borderRadius: '0.5rem',
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                        }}>
                          <ShieldCheck size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
                            This account manages <strong style={{ color: 'var(--text-1)' }}>every org</strong> under{' '}
                            {form.name || 'this brand'} — not scoped to any single org. There's exactly one per brand.
                          </p>
                        </div>

                        <div>
                          <p className="section-label">Super Admin Email</p>
                          <input
                            className="input"
                            type="email"
                            placeholder="admin@zoralis.com"
                            value={form.superAdminEmail}
                            onChange={e => setForm(f => ({ ...f, superAdminEmail: e.target.value }))}
                            autoFocus
                          />
                        </div>
                        <div>
                          <p className="section-label">Password <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(8+ characters)</span></p>
                          <input
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={form.superAdminPassword}
                            onChange={e => setForm(f => ({ ...f, superAdminPassword: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {formError && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--error)', marginTop: '0.75rem' }}>{formError}</p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!!createdBrandSlug}
                  title={createdBrandSlug ? 'The brand is already created — finish the super admin account to continue.' : undefined}
                  onClick={() => step === 0 ? setShowModal(false) : goTo(step - 1)}
                  style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  {step === 0 ? 'Cancel' : (<><ArrowLeft size={14} /> Back</>)}
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={step === 0 && !canLeaveStep0}
                    onClick={() => goTo(step + 1)}
                    style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={submitting || !form.superAdminEmail || form.superAdminPassword.length < 8}
                    onClick={handleOnboard}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {submitting
                      ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      : createdBrandSlug ? 'Retry Super Admin' : 'Onboard'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal — single page, not stepped; no slug/super-admin fields */}
      <AnimatePresence>
        {editingBrand && (
          <motion.div
            className="modal-overlay"
            variants={MODAL_BG}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setEditingBrand(null)}
          >
            <motion.div
              variants={MODAL_CARD}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={e => e.stopPropagation()}
              className="card"
              style={{
                width: '100%', maxWidth: 860, maxHeight: '85vh', overflowY: 'auto',
                padding: '1.5rem',
                background: 'var(--surface)',
                border: '1px solid var(--border-2)',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '1.25rem',
              }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)' }}>Edit Brand</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>
                    {entryHost}/{editingBrand.slug} <span style={{ opacity: 0.7 }}>(slug isn't editable)</span>
                  </p>
                </div>
                <button className="btn-ghost" onClick={() => setEditingBrand(null)} style={{ padding: '0.25rem' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <p className="section-label">Brand Name</p>
                    <input
                      className="input"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div>
                    <p className="section-label">Logo URL <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(optional)</span></p>
                    <input
                      className="input"
                      placeholder="https://..."
                      value={editForm.logoUrl}
                      onChange={e => setEditForm(f => ({ ...f, logoUrl: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <p className="section-label" style={{ marginBottom: '0.625rem' }}>Landing Page</p>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', width: 300, flexShrink: 0 }}>
                      {TEMPLATES.map(t => (
                        <TemplateCard
                          key={t.id}
                          template={t}
                          selected={editForm.landingTemplate === t.id}
                          onClick={() => setEditForm(f => ({ ...f, landingTemplate: t.id }))}
                          mockup={<LandingMockup t={t} />}
                        />
                      ))}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <BigLandingPreview t={editLandingTemplate} fontOverride={getFont(editForm.landingFont)} />
                      <FontPicker
                        template={editLandingTemplate}
                        value={editForm.landingFont}
                        onChange={f => setEditForm(prev => ({ ...prev, landingFont: f }))}
                        label="Landing"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="section-label" style={{ marginBottom: '0.625rem' }}>Dashboard</p>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', width: 300, flexShrink: 0 }}>
                      {TEMPLATES.map(t => (
                        <TemplateCard
                          key={t.id}
                          template={t}
                          selected={editForm.dashboardTemplate === t.id}
                          onClick={() => setEditForm(f => ({ ...f, dashboardTemplate: t.id }))}
                          mockup={<DashboardMockup t={t} />}
                        />
                      ))}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <BigDashboardPreview t={editDashboardTemplate} fontOverride={getFont(editForm.dashboardFont)} />
                      <FontPicker
                        template={editDashboardTemplate}
                        value={editForm.dashboardFont}
                        onChange={f => setEditForm(prev => ({ ...prev, dashboardFont: f }))}
                        label="Dashboard"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="section-label" style={{ marginBottom: '0.625rem' }}>Colors</p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.375rem' }}>Primary</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="color"
                          value={editForm.primaryColor}
                          onChange={e => setEditForm(f => ({ ...f, primaryColor: e.target.value }))}
                          style={{ width: 36, height: 36, padding: 0, border: '1px solid var(--border)', borderRadius: '0.4rem', cursor: 'pointer' }}
                        />
                        <input
                          className="input"
                          value={editForm.primaryColor}
                          onChange={e => setEditForm(f => ({ ...f, primaryColor: e.target.value }))}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.375rem' }}>Secondary</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="color"
                          value={editForm.secondaryColor}
                          onChange={e => setEditForm(f => ({ ...f, secondaryColor: e.target.value }))}
                          style={{ width: 36, height: 36, padding: 0, border: '1px solid var(--border)', borderRadius: '0.4rem', cursor: 'pointer' }}
                        />
                        <input
                          className="input"
                          value={editForm.secondaryColor}
                          onChange={e => setEditForm(f => ({ ...f, secondaryColor: e.target.value }))}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {editError && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--error)', marginTop: '1rem' }}>{editError}</p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingBrand(null)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >Cancel</button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={editSubmitting || !editForm.name}
                  onClick={handleUpdate}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {editSubmitting
                    ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Template picker card + CSS-only mockup previews ─────────────────────────
// No screenshots/iframes — each mockup is a small stylized representation of
// the template built directly from its palette, cheap to render and always
// in sync with templates.ts.

function TemplateCard({ template, selected, onClick, mockup }: {
  template: Template
  selected: boolean
  onClick: () => void
  mockup: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.625rem',
        padding: '0.625rem', borderRadius: '0.625rem', textAlign: 'left',
        background: selected ? 'var(--surface-2)' : 'var(--surface)',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {mockup}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-1)' }}>{template.name}</span>
        {selected && (
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', color: '#fff', flexShrink: 0,
          }}>
            <Check size={10} />
          </span>
        )}
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', lineHeight: 1.4 }}>{template.description}</p>
    </button>
  )
}

function LandingMockup({ t }: { t: Template }) {
  const p = t.preview
  return (
    <div style={{ borderRadius: p.radius, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', background: p.canvas, height: 96 }}>
      {/* fake browser chrome */}
      <div style={{ display: 'flex', gap: 3, padding: '5px 7px', background: p.surface }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.textMuted, opacity: 0.5 }} />
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.textMuted, opacity: 0.5 }} />
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.textMuted, opacity: 0.5 }} />
      </div>
      {/* hero */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
        <div style={{ width: '62%', height: 7, borderRadius: 2, background: p.text, opacity: 0.85 }} />
        <div style={{ width: '42%', height: 5, borderRadius: 2, background: p.textMuted, opacity: 0.6 }} />
        <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
          <div style={{ width: 28, height: 10, borderRadius: p.radius, background: p.accent }} />
          <div style={{ width: 20, height: 10, borderRadius: p.radius, background: 'transparent', border: `1px solid ${p.textMuted}` }} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4, width: '100%' }}>
          <div style={{ flex: 1, height: 14, borderRadius: 3, background: p.accent2, opacity: 0.35 }} />
          <div style={{ flex: 1, height: 14, borderRadius: 3, background: p.accent, opacity: 0.25 }} />
          <div style={{ flex: 1, height: 14, borderRadius: 3, background: p.textMuted, opacity: 0.15 }} />
        </div>
      </div>
    </div>
  )
}

// ── Font picker ──────────────────────────────────────────────────────────
// Independent of template choice — overrides the template's own font
// pairing on both landing/dashboard when set. Curated set only (see
// lib/fonts.ts) so there's always a real, already-loaded font behind it.

function FontPicker({ template, value, onChange, label }: {
  template: Template
  value: FontId | null
  onChange: (v: FontId | null) => void
  label: string
}) {
  return (
    <div>
      <p className="section-label">{label} Font</p>
      <select
        className="input"
        value={value ?? ''}
        onChange={e => onChange((e.target.value || null) as FontId | null)}
        style={{ cursor: 'pointer' }}
      >
        <option value="">Template default ({template.headingFont} / {template.bodyFont})</option>
        {FONTS.map(f => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Big live preview panels ──────────────────────────────────────────────
// Bigger, more detailed siblings of TemplateCard's small mockups — shows
// whichever template + font is currently selected, updates live as either
// changes. Still CSS-built (no screenshots/iframes), just closer to
// full-size with real text instead of color bars, so font choice is
// actually visible. fontOverride null → falls back to the template's own
// heading/body pairing (exactly what ships when nothing's picked here).

function resolveFontFamily(fontOverride: FontOption | null, templateFont: string): string {
  return fontOverride ? fontOverride.cssFamily : `'${templateFont}', sans-serif`
}

function BigLandingPreview({ t, fontOverride }: { t: Template; fontOverride: FontOption | null }) {
  const p = t.preview
  const headingFamily = resolveFontFamily(fontOverride, t.headingFont)
  const bodyFamily = resolveFontFamily(fontOverride, t.bodyFont)
  return (
    <div style={{ borderRadius: p.radius, overflow: 'hidden', border: '1px solid var(--border)', background: p.canvas, minHeight: 260 }}>
      <div style={{ display: 'flex', gap: 5, padding: '9px 12px', background: p.surface, borderBottom: `1px solid ${p.textMuted}22` }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.textMuted, opacity: 0.4 }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.textMuted, opacity: 0.4 }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.textMuted, opacity: 0.4 }} />
      </div>
      <div style={{ padding: '30px 26px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', padding: '4px 11px', borderRadius: 999,
          background: p.surface, fontSize: 10, fontWeight: 600, color: p.textMuted,
          marginBottom: 16, fontFamily: bodyFamily, letterSpacing: '0.03em',
        }}>
          NOW ONBOARDING
        </div>
        <h1 style={{ fontFamily: headingFamily, fontSize: 27, fontWeight: 700, color: p.text, margin: '0 0 9px', lineHeight: 1.15 }}>
          Everything your team needs
        </h1>
        <p style={{ fontFamily: bodyFamily, fontSize: 13, color: p.textMuted, maxWidth: 340, margin: '0 auto 20px' }}>
          One workspace for your whole team — built to get out of the way and let you move fast.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          <span style={{ padding: '9px 18px', borderRadius: p.radius, background: p.accent, color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: bodyFamily }}>Get Started</span>
          <span style={{ padding: '9px 18px', borderRadius: p.radius, border: `1px solid ${p.textMuted}55`, color: p.text, fontSize: 12, fontWeight: 600, fontFamily: bodyFamily }}>Sign In</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, height: 48, borderRadius: 6, background: p.accent2, opacity: 0.35 }} />
          <div style={{ flex: 1, height: 48, borderRadius: 6, background: p.accent, opacity: 0.25 }} />
          <div style={{ flex: 1, height: 48, borderRadius: 6, background: p.textMuted, opacity: 0.12 }} />
        </div>
      </div>
    </div>
  )
}

function BigDashboardPreview({ t, fontOverride }: { t: Template; fontOverride: FontOption | null }) {
  const p = t.preview
  const family = resolveFontFamily(fontOverride, t.headingFont)
  const NAV_ITEMS = ['Dashboard', 'Pipelines', 'Channels', 'Settings']
  return (
    <div style={{ borderRadius: p.radius, overflow: 'hidden', border: '1px solid var(--border)', background: p.canvas, minHeight: 260, display: 'flex' }}>
      <div style={{ width: 92, background: p.surface, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 15, flexShrink: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: p.accent }} />
        {NAV_ITEMS.map(label => (
          <div key={label} style={{ fontSize: 10, color: p.textMuted, fontFamily: family }}>{label}</div>
        ))}
      </div>
      <div style={{ flex: 1, padding: '18px 20px' }}>
        <div style={{ fontFamily: family, fontSize: 16, fontWeight: 700, color: p.text, marginBottom: 16 }}>Dashboard</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {['128', '64', '12'].map((v, i) => (
            <div key={i} style={{ background: p.surface, borderRadius: 8, padding: '10px 12px', border: `1px solid ${p.textMuted}22` }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: p.text, fontFamily: family }}>{v}</div>
              <div style={{ fontSize: 9.5, color: p.textMuted, marginTop: 2 }}>metric {i + 1}</div>
            </div>
          ))}
        </div>
        <div style={{ background: p.surface, borderRadius: 8, height: 96, border: `1px solid ${p.textMuted}22`, padding: 11 }}>
          <div style={{ height: 8, width: '38%', background: p.accent, opacity: 0.7, borderRadius: 2, marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 42 }}>
            {[32, 55, 40, 70, 50, 65].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: p.accent2, opacity: 0.5, borderRadius: 2 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardMockup({ t }: { t: Template }) {
  const p = t.preview
  return (
    <div style={{ borderRadius: p.radius, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', background: p.canvas, height: 96, display: 'flex' }}>
      {/* sidebar */}
      <div style={{ width: 22, background: p.surface, padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: 3, background: p.accent }} />
        <div style={{ width: 8, height: 3, borderRadius: 1, background: p.textMuted, opacity: 0.5 }} />
        <div style={{ width: 8, height: 3, borderRadius: 1, background: p.textMuted, opacity: 0.5 }} />
        <div style={{ width: 8, height: 3, borderRadius: 1, background: p.textMuted, opacity: 0.5 }} />
      </div>
      {/* main area */}
      <div style={{ flex: 1, padding: '8px 9px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ width: '48%', height: 6, borderRadius: 2, background: p.text, opacity: 0.85 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 2 }}>
          <div style={{ height: 22, borderRadius: 4, background: p.surface, border: `1px solid ${p.textMuted}22` }} />
          <div style={{ height: 22, borderRadius: 4, background: p.accent, opacity: 0.85 }} />
          <div style={{ height: 22, borderRadius: 4, background: p.surface, border: `1px solid ${p.textMuted}22` }} />
          <div style={{ height: 22, borderRadius: 4, background: p.surface, border: `1px solid ${p.textMuted}22` }} />
        </div>
      </div>
    </div>
  )
}
