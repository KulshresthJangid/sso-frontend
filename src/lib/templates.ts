// Single source of truth for the 4 landing-page / dashboard style templates
// offered in the brand onboarding wizard (BrandsPage.tsx). Sourced from
// concrete, distinct design systems (Minimalism/Swiss, Aurora gradients,
// OLED dark-mode, Bento grids) via the ui-ux-pro-max skill rather than
// invented arbitrary variations. Landing and dashboard pickers share this
// same catalog — a brand can independently pick e.g. Aurora landing +
// Midnight dashboard.
//
// `preview` drives the CSS-only mockup thumbnail rendered on each picker
// card (no screenshots/iframes — see TemplateCard in BrandsPage.tsx).

export type TemplateId = 'MINIMAL' | 'AURORA' | 'MIDNIGHT' | 'BENTO'

export interface Template {
  id: TemplateId
  name: string
  description: string
  primaryColor: string
  secondaryColor: string
  headingFont: string
  bodyFont: string
  preview: {
    canvas: string
    surface: string
    text: string
    textMuted: string
    accent: string
    accent2: string
    radius: string
  }
}

export const TEMPLATES: Template[] = [
  {
    id: 'MINIMAL',
    name: 'Minimal',
    description: 'Swiss-style whitespace, high contrast, sky-blue accent. Enterprise-clean.',
    primaryColor: '#0EA5E9',
    secondaryColor: '#38BDF8',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    preview: {
      canvas: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#0F172A',
      textMuted: '#64748B',
      accent: '#0EA5E9',
      accent2: '#F97316',
      radius: '0.375rem',
    },
  },
  {
    id: 'AURORA',
    name: 'Aurora',
    description: 'Bold mesh gradients, startup energy, violet-to-cyan. Animated hero glow.',
    primaryColor: '#7C3AED',
    secondaryColor: '#A78BFA',
    headingFont: 'Space Grotesk',
    bodyFont: 'DM Sans',
    preview: {
      canvas: '#F5F3FF',
      surface: '#FFFFFF',
      text: '#1E1B3A',
      textMuted: '#6D6795',
      accent: '#7C3AED',
      accent2: '#22D3EE',
      radius: '0.75rem',
    },
  },
  {
    id: 'MIDNIGHT',
    name: 'Midnight',
    description: 'OLED-dark, technical, monospace accents. Built for dev-tool audiences.',
    primaryColor: '#1E293B',
    secondaryColor: '#0F172A',
    headingFont: 'Space Grotesk',
    bodyFont: 'Inter',
    preview: {
      canvas: '#0F172A',
      surface: '#1E293B',
      text: '#E2E8F0',
      textMuted: '#94A3B8',
      accent: '#22C55E',
      accent2: '#38BDF8',
      radius: '0.5rem',
    },
  },
  {
    id: 'BENTO',
    name: 'Bento',
    description: 'Modular card grid, warm and approachable, teal accent. Friendly SaaS.',
    primaryColor: '#0D9488',
    secondaryColor: '#14B8A6',
    headingFont: 'Poppins',
    bodyFont: 'Open Sans',
    preview: {
      canvas: '#FFF7ED',
      surface: '#FFFFFF',
      text: '#1C1917',
      textMuted: '#78716C',
      accent: '#0D9488',
      accent2: '#F97316',
      radius: '1rem',
    },
  },
]

export function getTemplate(id: string | undefined | null): Template {
  return TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0]
}
