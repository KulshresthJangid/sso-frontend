// Curated font set a brand can pick for its landing page / dashboard,
// independent of which visual template (Minimal/Aurora/Midnight/Bento) it
// picked — mirrors kaizex-frontend's lib/fonts.ts exactly (same IDs, same
// sso/backend Brand.landingFont/dashboardFont @Pattern validation). This
// copy adds `cssFamily` — the real Google Font family name, loaded via
// index.html's <link> — so the wizard's preview panel can render the
// actual font, not just a label (kaizex-frontend self-hosts these via
// next/font instead, so its copy references CSS vars rather than family
// names directly).

export type FontId = 'INTER' | 'OUTFIT' | 'SPACE_GROTESK' | 'DM_SANS' | 'POPPINS' | 'OPEN_SANS' | 'INSTRUMENT_SERIF'

export interface FontOption {
  id: FontId
  label: string
  cssFamily: string
  description: string
}

export const FONTS: FontOption[] = [
  { id: 'INTER', label: 'Inter', cssFamily: "'Inter', sans-serif", description: 'Neutral, highly legible — the default choice for most products.' },
  { id: 'OUTFIT', label: 'Outfit', cssFamily: "'Outfit', sans-serif", description: "Geometric and clean — this app's own default." },
  { id: 'SPACE_GROTESK', label: 'Space Grotesk', cssFamily: "'Space Grotesk', sans-serif", description: 'Distinctive, technical character — pairs well with dark/bold styles.' },
  { id: 'DM_SANS', label: 'DM Sans', cssFamily: "'DM Sans', sans-serif", description: 'Warm and rounded — friendly without being playful.' },
  { id: 'POPPINS', label: 'Poppins', cssFamily: "'Poppins', sans-serif", description: 'Rounded geometric sans — approachable, high readability at small sizes.' },
  { id: 'OPEN_SANS', label: 'Open Sans', cssFamily: "'Open Sans', sans-serif", description: 'Humanist and understated — safe, corporate-friendly default.' },
  { id: 'INSTRUMENT_SERIF', label: 'Instrument Serif', cssFamily: "'Instrument Serif', serif", description: 'Editorial serif — for a more upscale, publication-like feel.' },
]

export function getFont(id: string | null | undefined): FontOption | null {
  return FONTS.find(f => f.id === id) ?? null
}
