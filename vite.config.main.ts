import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const alias = {
    '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  }

  if (mode === 'admin') {
    return {
      plugins: [react()],
      root: 'src/admin',
      resolve: { alias },
      build: {
        outDir: '../../admin',
        emptyOutDir: true,
      },
    }
  }

  if (mode === 'functions') {
    return {
      plugins: [],
      resolve: { alias },
      build: {
        outDir: 'functions/shop',
        target: 'node18',
        sourcemap: true,
        emptyOutDir: true,
        lib: {
          entry: fileURLToPath(new URL('./src/functions/shop/index.ts', import.meta.url)),
          formats: ['cjs'],
          fileName: () => 'index',
        },
        rollupOptions: {
          treeshake: false,
          output: {
            exports: 'named',
            entryFileNames: 'index.js',
          }
        }
      }
    }
  }

  throw new Error('Please specify --mode admin or --mode functions')
})
