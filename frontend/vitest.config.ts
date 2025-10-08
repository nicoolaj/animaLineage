import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/index.tsx',
        'src/reportWebVitals.ts',
        'src/**/*.d.ts',
        'src/mocks/**'
      ],
      thresholds: {
        branches: 10,
        functions: 25,
        lines: 20,
        statements: 20
      }
    }
  }
})