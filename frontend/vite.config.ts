import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    host: true
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  define: {
    // Replace process.env with import.meta.env for Vite
    'process.env': 'import.meta.env'
  }
})