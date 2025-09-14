import { defineConfig } from 'weapp-vite/config'
import { VantResolver } from 'weapp-vite/auto-import-components/resolvers'

// Minimal weapp-vite config with conditional clean:
// - Do not empty output dir during `dev` to preserve `weapp/miniprogram_npm`
// - Clean on `build` for reproducible production output
export default defineConfig(({ command }) => ({
  weapp: {
    srcRoot: './src/weapp',
    enhance: {
      // Auto import Vant Weapp components used in usingComponents
      autoImportComponents: {
        resolvers: [VantResolver()],
      },
    },
  },
  build: {
    outDir: './weapp',
    emptyOutDir: command === 'build',
  },
}))
