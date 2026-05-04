import { create } from 'zustand'

interface OrgState {
  slug: string | null
  orgName: string | null
  userEmail: string | null
  setOrg: (slug: string, name: string) => void
  setUser: (email: string) => void
  clear: () => void
}

export const useOrgStore = create<OrgState>(set => ({
  slug: sessionStorage.getItem('org_slug'),
  orgName: sessionStorage.getItem('org_name'),
  userEmail: sessionStorage.getItem('user_email'),

  setOrg: (slug, name) => {
    sessionStorage.setItem('org_slug', slug)
    sessionStorage.setItem('org_name', name)
    set({ slug, orgName: name })
  },
  setUser: (email) => {
    sessionStorage.setItem('user_email', email)
    set({ userEmail: email })
  },
  clear: () => {
    sessionStorage.clear()
    set({ slug: null, orgName: null, userEmail: null })
  }
}))
