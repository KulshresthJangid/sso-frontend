import axios from 'axios'

const api = axios.create({ baseURL: '' })

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
