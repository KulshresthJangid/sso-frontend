import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/sso',
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:9000', changeOrigin: true, xfwd: true, autoRewrite: true },
      // Negative lookahead excludes "sso" — that's not a brand slug, it's
      // this app's own `base: '/sso'` mount point (basename in App.tsx
      // too). Without it, a direct navigation/reload of the login page
      // itself (browser URL /sso/login) matched this same pattern and got
      // proxied straight to the backend, which then 404'd trying to
      // resolve "sso" as a tenant slug — a Whitelabel Error Page instead
      // of the login page. Only real tenant-prefixed requests (issued via
      // fetch() from within the already-loaded app, e.g. /zoralis/login)
      // should ever hit these.
      '^/(?!sso(?:/|$))[^/]+/oauth2': { target: 'http://localhost:9000', changeOrigin: true, xfwd: true, autoRewrite: true },
      '^/(?!sso(?:/|$))[^/]+/login': { target: 'http://localhost:9000', changeOrigin: true, xfwd: true, autoRewrite: true },
      // Brand-prefixed API calls (sessionApi.me, brandConsoleApi.* — see
      // lib/api.ts) — the bare '/api' rule above only matches paths that
      // literally start with "/api", not "/{brandSlug}/api/...", so these
      // need their own rule the same way /login and /oauth2 do.
      '^/(?!sso(?:/|$))[^/]+/api/': { target: 'http://localhost:9000', changeOrigin: true, xfwd: true, autoRewrite: true },
    }
  }
})
