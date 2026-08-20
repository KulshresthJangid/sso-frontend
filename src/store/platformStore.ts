import { create } from 'zustand'

// Deliberately separate from orgStore, not an extension of it — orgStore's
// clear() wipes ALL of sessionStorage, which would cross-invalidate a
// platform session and an org session open in the same tab. The platform
// operator identity is orthogonal to "which org am I logged into" and
// shouldn't share state with it.
interface PlatformState {
  username: string | null
  // Stored so every brandsApi call can attach Authorization: Basic — see
  // platformApi's request interceptor in lib/api.ts. Basic Auth chosen over
  // a session cookie deliberately (see SecurityConfig.platformAdminFilterChain
  // on the backend) — stateless, no session to share across the existing
  // org-scoped filter chains.
  password: string | null
  setCredentials: (username: string, password: string) => void
  clear: () => void
}

export const usePlatformStore = create<PlatformState>(set => ({
  username: sessionStorage.getItem('platform_username'),
  password: sessionStorage.getItem('platform_password'),

  setCredentials: (username, password) => {
    sessionStorage.setItem('platform_username', username)
    sessionStorage.setItem('platform_password', password)
    set({ username, password })
  },
  clear: () => {
    sessionStorage.removeItem('platform_username')
    sessionStorage.removeItem('platform_password')
    set({ username: null, password: null })
  },
}))
