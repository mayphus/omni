import type { defineConfig as defineConfigFn } from 'rolldown-vite'

declare module 'vite' {
  export * from 'rolldown-vite'
  export { default } from 'rolldown-vite'
  export const defineConfig: typeof defineConfigFn
}
