import { defineConfig } from 'weapp-vite/config'
import { VantResolver } from 'weapp-vite/auto-import-components/resolvers'
import fs from 'fs'
import path from 'path'

// Minimal weapp-vite config with conditional clean:
// - Do not empty output dir during `dev` to preserve `weapp/miniprogram_npm`
// - Clean on `build` for reproducible production output
export default defineConfig(({ command }: { command: 'build' | 'serve' | string }) => ({
  weapp: {
    srcRoot: './src/weapp',
    enhance: {
      // Auto import Vant Weapp components used in usingComponents
      autoImportComponents: {
        resolvers: [VantResolver()],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    outDir: './weapp',
    emptyOutDir: command === 'build',
  },
  plugins: [
    {
      name: 'copy-package-json',
      writeBundle() {
        const src = path.resolve('./src/weapp/package.json')
        const dest = path.resolve('./weapp/package.json')
        const destDir = path.dirname(dest)

        if (!fs.existsSync(src)) {
          throw new Error(`Missing required file: ${src}`)
        }

        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }
        fs.copyFileSync(src, dest)
        console.log('✔ Copied package.json to weapp/')
      }
    }
  ]
}))
