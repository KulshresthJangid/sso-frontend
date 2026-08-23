import axios from 'axios'
import { usePlatformStore } from '../store/platformStore'

const api = axios.create({ baseURL: import.meta.env.VITE_SSO_API_URL ?? '', withCredentials: true })

// Separate instance for the platform-operator console — HTTP Basic instead
// of the session cookie every other instance/page relies on (see
// SecurityConfig.platformAdminFilterChain on the backend for why). No
// withCredentials needed since there's no session to send.
const platformApi = axios.create({ baseURL: import.meta.env.VITE_SSO_API_URL ?? '' })
platformApi.interceptors.request.use(config => {
  const { username, password } = usePlatformStore.getState()
  if (username && password) {
    config.headers.Authorization = 'Basic ' + btoa(`${username}:${password}`)
  }
  return config
})

// ── Signup (public — creates org + admin atomically) ─────────────────────────
export const signupApi = {
  signup: (data: { orgName: string; slug: string; adminEmail: string; adminPassword: string; brandSlug?: string }) =>
    api.post('/api/signup', data).then(r => r.data),
}

// ── Public brand lookup (unauthenticated) — used by LoginPage to verify a
// brand slug exists before showing the credentials step, same endpoint
// kaizex-frontend's BrandProvider fetches to skin itself. ─────────────────
export const publicBrandApi = {
  getConfig: (slug: string) =>
    api.get(`/api/brands/${slug}/config`).then(r => r.data as { slug: string; name: string }),
}

// ── Session (session-cookie "who am I", post-login) ──────────────────────
// Brand-prefixed so TenantResolutionFilter populates TenantContext — see
// SessionController. Works for both an ORG_ADMIN (returns orgSlug/orgName)
// and a brand-level SUPER_ADMIN (doesn't have one).
export interface SessionInfo {
  email: string
  orgRole: 'ORG_ADMIN' | 'ORG_MEMBER' | 'SUPER_ADMIN'
  brandSlug: string
  brandName: string
  orgSlug?: string
  orgName?: string
}
export const sessionApi = {
  me: (brandSlug: string) =>
    api.get(`/${brandSlug}/api/session/me`).then(r => r.data as SessionInfo),
}

// ── Brand Console (a brand's own SUPER_ADMIN — self-service org/client
// management scoped to their one brand) — session-cookie auth, brand-
// prefixed URLs, see BrandConsoleController. ──────────────────────────────
export interface BrandOrgSummary {
  id: string
  name: string
  slug: string
  active: boolean
}
export const brandConsoleApi = {
  listOrganizations: (brandSlug: string) =>
    api.get(`/${brandSlug}/api/brand-console/organizations`).then(r => r.data as BrandOrgSummary[]),

  createOrganization: (brandSlug: string, data: { orgName: string; orgSlug: string; adminEmail: string; adminPassword: string }) =>
    api.post(`/${brandSlug}/api/brand-console/organizations`, data).then(r => r.data as BrandOrgSummary),

  listClients: (brandSlug: string) =>
    api.get(`/${brandSlug}/api/brand-console/clients`).then(r => r.data),

  createClient: (brandSlug: string, data: { clientName: string; redirectUris: string[]; scopes: string[]; grantTypes: string[]; permissionsUri?: string }) =>
    api.post(`/${brandSlug}/api/brand-console/clients`, data).then(r => r.data),

  deleteClient: (brandSlug: string, clientId: string) =>
    api.delete(`/${brandSlug}/api/brand-console/clients/${clientId}`),
}

// ── Org Management ────────────────────────────────────────────────────────────
export const orgsApi = {
  create: (data: { name: string; slug: string }) =>
    api.post('/api/orgs', data).then(r => r.data),

  get: (slug: string) =>
    api.get(`/api/orgs/${slug}`).then(r => r.data),
}

// ── Client / App Management ───────────────────────────────────────────────────
export const clientsApi = {
  register: (slug: string, data: {
    clientName: string
    redirectUris: string[]
    scopes: string[]
    grantTypes: string[]
    permissionsUri?: string
  }) => api.post(`/api/orgs/${slug}/clients`, data).then(r => r.data),

  list: (slug: string) =>
    api.get(`/api/orgs/${slug}/clients`).then(r => r.data),

  delete: (slug: string, clientId: string) =>
    api.delete(`/api/orgs/${slug}/clients/${clientId}`),
}

// ── User Management ───────────────────────────────────────────────────────────
export const usersApi = {
  create: (slug: string, data: { email: string; password: string; orgRole?: string }) =>
    api.post(`/api/orgs/${slug}/users`, data).then(r => r.data),

  list: (slug: string) =>
    api.get(`/api/orgs/${slug}/users`).then(r => r.data),

  deactivate: (slug: string, userId: string) =>
    api.delete(`/api/orgs/${slug}/users/${userId}`),
}

// ── Roles & Permissions ───────────────────────────────────────────────────────
export const rolesApi = {
  createRole: (slug: string, data: { name: string; description?: string; clientId?: string }) =>
    api.post(`/api/orgs/${slug}/roles`, data).then(r => r.data),

  listRoles: (slug: string) =>
    api.get(`/api/orgs/${slug}/roles`).then(r => r.data),

  deleteRole: (slug: string, roleId: string) =>
    api.delete(`/api/orgs/${slug}/roles/${roleId}`),

  createPermission: (slug: string, data: { name: string; resource: string; action: string }) =>
    api.post(`/api/orgs/${slug}/permissions`, data).then(r => r.data),

  listPermissions: (slug: string) =>
    api.get(`/api/orgs/${slug}/permissions`).then(r => r.data),

  // Permission discovery — see PermissionCatalogService on the backend and
  // SMAT's PermissionCatalogController for the reference implementation.
  // catalog() previews what an app declares (live, not persisted);
  // syncPermissions() imports it into this org's own Permission rows.
  permissionCatalog: (slug: string, clientId: string) =>
    api.get(`/api/orgs/${slug}/clients/${clientId}/permissions/catalog`)
      .then(r => r.data as { name: string; resource: string; action: string; description?: string }[]),

  syncPermissions: (slug: string, clientId: string) =>
    api.post(`/api/orgs/${slug}/clients/${clientId}/permissions/sync`).then(r => r.data),

  assignPermission: (slug: string, roleId: string, permissionId: string) =>
    api.post(`/api/orgs/${slug}/roles/${roleId}/permissions/${permissionId}`),

  revokePermission: (slug: string, roleId: string, permissionId: string) =>
    api.delete(`/api/orgs/${slug}/roles/${roleId}/permissions/${permissionId}`),

  assignRoleToUser: (slug: string, userId: string, roleId: string, clientId: string) =>
    api.post(`/api/orgs/${slug}/users/${userId}/roles/${roleId}?clientId=${clientId}`).then(r => r.data),

  listUserRoles: (slug: string, userId: string) =>
    api.get(`/api/orgs/${slug}/users/${userId}/roles`).then(r => r.data),
}

// ── Brands (platform-operator console) ─────────────────────────────────────
export interface CreateBrandRequest {
  name: string
  slug: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  landingTemplate?: string
  dashboardTemplate?: string
  landingFont?: string
  dashboardFont?: string
}

// No slug — it's the brand's URL/tenant identifier, not editable post-onboarding.
export interface UpdateBrandRequest {
  name: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  landingTemplate?: string
  dashboardTemplate?: string
  landingFont?: string
  dashboardFont?: string
}

export const brandsApi = {
  // `credentials`, when passed, sends a one-off explicit Basic auth header
  // instead of relying on platformApi's interceptor (which reads from
  // platformStore) — used by PlatformLoginPage to verify a credential pair
  // *before* committing it to the store.
  list: (credentials?: { username: string; password: string }) =>
    platformApi.get('/api/brands', credentials
      ? { headers: { Authorization: 'Basic ' + btoa(`${credentials.username}:${credentials.password}`) } }
      : undefined
    ).then(r => r.data),

  create: (data: CreateBrandRequest) =>
    platformApi.post('/api/brands', data).then(r => r.data),

  get: (slug: string) =>
    platformApi.get(`/api/brands/${slug}`).then(r => r.data),

  update: (slug: string, data: UpdateBrandRequest) =>
    platformApi.put(`/api/brands/${slug}`, data).then(r => r.data),

  delete: (slug: string) =>
    platformApi.delete(`/api/brands/${slug}`),

  // The brand's one SUPER_ADMIN account — manages every org under the
  // brand (see kaizex-frontend's /super-admin console). Created once, from
  // the onboarding wizard's last step.
  createSuperAdmin: (slug: string, data: { email: string; password: string }) =>
    platformApi.post(`/api/brands/${slug}/super-admin`, data).then(r => r.data),

  getSuperAdmin: (slug: string) =>
    platformApi.get(`/api/brands/${slug}/super-admin`).then(r => r.data as { exists: boolean; email?: string }),
}
