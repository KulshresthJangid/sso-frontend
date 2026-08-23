import { create } from 'zustand'

// Session for a brand's own SUPER_ADMIN, logged in via the normal
// brand-prefixed /{slug}/login form (same session-cookie mechanism the
// org-admin dashboard uses) — separate from orgStore (org-admins) and
// platformStore (fixed platform-operator creds, HTTP Basic). Actual
// enforcement is server-side per request (see BrandConsoleController's
// requireSuperAdmin) — this just remembers who's logged in for the UI.
interface BrandConsoleState {
  brandSlug: string | null
  brandName: string | null
  email: string | null
  setSession: (brandSlug: string, brandName: string, email: string) => void
  clear: () => void
}

export const useBrandConsoleStore = create<BrandConsoleState>(set => ({
  brandSlug: sessionStorage.getItem('bc_brand_slug'),
  brandName: sessionStorage.getItem('bc_brand_name'),
  email: sessionStorage.getItem('bc_email'),

  setSession: (brandSlug, brandName, email) => {
    sessionStorage.setItem('bc_brand_slug', brandSlug)
    sessionStorage.setItem('bc_brand_name', brandName)
    sessionStorage.setItem('bc_email', email)
    set({ brandSlug, brandName, email })
  },
  clear: () => {
    sessionStorage.removeItem('bc_brand_slug')
    sessionStorage.removeItem('bc_brand_name')
    sessionStorage.removeItem('bc_email')
    set({ brandSlug: null, brandName: null, email: null })
  },
}))
