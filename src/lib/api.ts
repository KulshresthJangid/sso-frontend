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
  signup: (data: { orgName: string; slug: string; adminEmail: string; adminPassword: string }) =>
    api.post('/api/signup', data).then(r => r.data),
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

  assignPermission: (slug: string, roleId: string, permissionId: string) =>
    api.post(`/api/orgs/${slug}/roles/${roleId}/permissions/${permissionId}`),

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

  delete: (slug: string) =>
    platformApi.delete(`/api/brands/${slug}`),
}
