/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/index.tsx',
        'src/reportWebVitals.ts',
        'src/**/*.d.ts',
        'src/mocks/**',
        'src/setupTests.ts',
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'src/utils/__tests__/testUtils.ts',
        '**/*.stories.*',
        '**/node_modules/**',
        'dist/**',
        'cypress/**'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 85,
          statements: 85
        }
      },
      reportsDirectory: './coverage',
      clean: true,
      // Include detailed coverage information
      all: true,
      // Generate coverage for all files, even untested ones
      skipFull: false
    },

    // Test execution configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,

    // Reporter configuration
    reporter: ['default', 'json', 'html'],
    outputFile: {
      json: './test-results/test-results.json',
      html: './test-results/test-results.html'
    },

    // Watch configuration
    watch: {
      ignore: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/test-results/**']
    },

    // Performance monitoring
    logHeapUsage: true,

    // Test isolation
    isolate: true,

    // Concurrent testing for better performance
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false
      }
    }
  },

  // Build configuration for tests
  build: {
    sourcemap: true
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils',
      '@contexts': '/src/contexts',
      '@store': '/src/store'
    }
  }
})