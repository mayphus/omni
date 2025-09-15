# Architecture

Goal: keep it simple. Three apps authored under `src/` and built to separate output folders.

Structure
```
src/
  weapp/           # authored with weapp-vite → ./weapp
  functions/       # Node 18 CJS build → ./functions
  admin/           # React web build → ./admin

weapp/             # WeChat DevTools project root
functions/         # Deployed functions (CloudBase)
admin/             # Static web assets for console
archive/           # Optional: historical snapshots (if present)
```

Build pipeline
- WeApp: `weapp-vite` compiles `src/weapp` → `weapp/` (includes `weapp/miniprogram_npm`).
- Functions: Vite builds `src/functions/shop` to CJS Node18 → `functions/shop/index.js` with its own `package.json`.
- Admin: Vite builds `src/admin` → `admin/`.

Key decisions
- Cloud runtime: Node.js 18.15, CommonJS output (CloudBase friendly).
- UI: Vant Weapp in miniapp; no custom UI unless necessary.
- Configs: Separate Vite configs for miniapp vs others for clarity.
- Docs: Minimal; code + ADRs are the source of truth.
- Language: English-only for development (code/docs/commits). UI copy in English for now; i18n later if needed.
