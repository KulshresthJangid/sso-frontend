import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      // Proxy tenant-scoped oauth2 paths
      '^/[^/]+/oauth2': 'http://localhost:8080',
      '^/[^/]+/login': 'http://localhost:8080',
    }
  }
})
