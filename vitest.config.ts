import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      'vite/index.js': 'vite/dist/node/index.js',
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
    environmentMatchGlobs: [['tests/admin/**', 'jsdom']],
    setupFiles: ['tests/setup/test-env.ts'],
    exclude: ['node_modules/**', 'weapp/**', 'admin/**', 'dist/**'],
    deps: {
      inline: [/react/, /react-dom/],
    },
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/weapp/**', 'src/types/**', 'src/admin/index.html', 'src/admin/index.css'],
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
})
