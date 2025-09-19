import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    include: ['tests/**/*.e2e.ts'],
    environment: 'node',
    setupFiles: ['tests/setup/test-env.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    reporters: ['default'],
  },
})
