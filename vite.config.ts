import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: 'localhost',
    port: 5780,
    strictPort: true,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/docs/**',
        '**/.git/**',
        '**/.idea/**',
        '**/.cursor/**'
      ]
    }
  },
  preview: {
    host: 'localhost',
    port: 4173,
    strictPort: true
  }
})
