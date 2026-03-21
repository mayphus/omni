# WeApp (WeChat Mini Program)

- Build tool: `weapp-vite` → output to `./weapp/`.
- UI: Vant Weapp. Keep defaults; avoid custom UI to reduce complexity.
- Language: English only for now (i18n can be added later).
- Cloud: Enable `wx.cloud`, call CloudBase functions as needed.

Dependencies live in `src/weapp/package.json`; pnpm links them when you run `pnpm install` at the repo root. If you tweak the list and want to reinstall just this package, use `pnpm install --filter @omni/weapp`.

Vue Mini
- Runtime: `@vue-mini/core` is integrated. Use `definePage()`/`ref()` in page TS.
- Example: `import { definePage, ref } from '@vue-mini/core'` in `pages/index`.

MVP Checklist (later)
- Verify build succeeds and DevTools compiles without errors.
- Add basic page structure and confirm Vant components render.
- Implement WeChat login (get user) and store a copy server-side.
