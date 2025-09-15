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
    // For cloud functions, we need simple transpilation, not bundling
    // Using Vite in library mode with all node modules as external
    return {
      plugins: [],
      resolve: { alias },
      build: {
        outDir: 'functions/shop',
        target: 'node18',
        sourcemap: false,
        emptyOutDir: true,
        minify: false,
        lib: {
          entry: fileURLToPath(new URL('./src/functions/shop/index.ts', import.meta.url)),
          formats: ['cjs'],
          fileName: () => 'index',
        },
        rollupOptions: {
          treeshake: false,
          // External only real npm packages, bundle local code
          external: (id) => {
            // These are npm packages that should be external
            const externalPackages = ['wx-server-sdk', 'zod']
            // Check if it's one of our external packages
            return externalPackages.some(pkg => id === pkg || id.startsWith(`${pkg}/`))
          },
          output: {
            exports: 'named',
            entryFileNames: 'index.js',
            // Preserve the require() statements for external modules
            format: 'cjs',
            interop: 'auto',
          }
        }
      }
    }
  }

  throw new Error('Please specify --mode admin or --mode functions')
})
