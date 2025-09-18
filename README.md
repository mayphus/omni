# Children’s Dream Planet

 Fresh scaffold for a WeChat Mini Program + CloudBase functions + Admin console.

## Language

- Development language: English only (code, comments, commits, docs).
- UI copy: English for now. i18n can be introduced later; the app’s Chinese name may be used in UX/marketing when localization is enabled.

## Structure

```
src/
  weapp/           # authoring source → build to ./weapp
  functions/       # function source → build to ./functions
  admin/           # web console source → build to ./admin
  shared/          # cross‑runtime types + Zod schemas (imported by all)
  types/           # ambient .d.ts only (e.g., weapp API typings)

weapp/             # built mini app for DevTools
functions/         # built cloud function(s)
admin/             # built admin web app
archive/           # optional: previous codebase snapshots (if present)
```

Each source package (`src/admin`, `src/functions/*`, `src/shared`, `src/weapp`) owns its runtime dependencies. Run `pnpm install` from the repo root so pnpm can link all workspaces correctly before building.

## Commands

- WeApp
  - `pnpm run dev:weapp` – author with weapp‑vite; open via DevTools. Note: dev does not clean `weapp/`, preserving `weapp/miniprogram_npm`. Run `pnpm run build:weapp:npm` once before preview.
  - `pnpm run build:weapp` – build to `./weapp`
  - `pnpm run build:weapp:npm` – trigger DevTools NPM pack (Vant, etc.)
  - `pnpm run deploy:weapp` – build + npm pack + upload via miniprogram‑ci
- Functions
  - `pnpm run build:functions` – build `shop` to `./functions/shop` (CJS, Node 18)
  - Note: a watch/dev task is not implemented yet.
- Admin
  - `pnpm run dev:admin` – Vite dev (Hello World)
  - `pnpm run build:admin` – build to `./admin`
- All builds
  - `pnpm run build:all` – build weapp (+npm), functions, and admin
- Quality
  - `pnpm run typecheck` / `pnpm run test:ci` / `pnpm run verify`

## Notes

- Cloud runtime: Node.js 18.15 (Node 20 unsupported for functions)
- Miniprogram UI: Vant Weapp (integrate as needed)
- Keep things minimal; add only when required

## Current status

- **WeApp** – storefront with search, categories, cart, and checkout powered by WeChat Pay. Build with `pnpm run build:weapp`, run `pnpm run build:weapp:npm`, then open via WeChat DevTools.
- **Cloud function (`shop`)** – action router covering auth, catalogue queries, order creation, WeChat Pay preparation/confirmation, and admin order/product/system endpoints. Build with `pnpm run build:functions`; deploy via `pnpm run deploy:functions` (requires TCB CLI auth).
- **Admin console** – Vite + React dashboard for catalogue management, analytics, and order lifecycle controls. Run `pnpm run dev:admin` or build with `pnpm run build:admin`.

## Environment

- Vite/weapp-vite load `.env`, `.env.[mode]`, and `.env.local` automatically.
- Only variables prefixed with `VITE_` are exposed to client bundles (admin + weapp).
- Keep secrets out of client bundles; use `VITE_*` for non-sensitive flags and labels (e.g., `VITE_APP_NAME`).
- Put local secrets in `.env.local` (git-ignored). See `.env.example` for expected names.

## Commit hooks

- Pre-commit: runs `typecheck` + `test:ci` (see `.husky/pre-commit`).
- Pre-push: runs `verify` (typecheck, tests, and builds) — see `.husky/pre-push`.
