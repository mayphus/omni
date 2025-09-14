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
archive/           # previous codebase snapshots
```

## Commands

- WeApp
  - `npm run dev:weapp` – author with weapp‑vite; open via DevTools. Note: dev does not clean `weapp/`, preserving `weapp/miniprogram_npm`. Run `npm run build:weapp:npm` once before preview.
  - `npm run build:weapp` – build to `./weapp`
  - `npm run build:weapp:npm` – trigger DevTools NPM pack (Vant, etc.)
  - `npm run deploy:weapp` – build + npm pack + upload via miniprogram‑ci
- Functions
  - `npm run build:functions` – build `shop` to `./functions/shop` (CJS, Node 18)
  - `npm run build:functions:watch` – watch and rebuild on change
- Admin
  - `npm run dev:admin` – Vite dev (Hello World)
  - `npm run build:admin` – build to `./admin`
- All builds
  - `npm run build:all` – build weapp (+npm), functions, and admin
- Quality
  - `npm run typecheck` / `npm run test:ci` / `npm run verify`

## Notes

- Cloud runtime: Node.js 18.15 (Node 20 unsupported for functions)
- Miniprogram UI: Vant Weapp (integrate as needed)
- Keep things minimal; add only when required

## Hello World status

- WeApp: minimal index page using Vant components. Build with `npm run build:weapp`, run `npm run build:weapp:npm`, then open via WeChat DevTools.
- Functions: `shop` function provides `v1.system.ping`. Build with `npm run build:functions`; deploy via `npm run deploy:functions` (requires TCB CLI auth).
- Admin: minimal React page renders “Hello, Admin”. Run `npm run dev:admin` or build with `npm run build:admin`.

## Environment

- Vite/weapp-vite load `.env`, `.env.[mode]`, and `.env.local` automatically.
- Only variables prefixed with `VITE_` are exposed to client bundles (admin + weapp).
- Keep secrets out of client bundles; use `VITE_*` for non-sensitive flags and labels (e.g., `VITE_APP_NAME`).
- Put local secrets in `.env.local` (git-ignored). See `.env.example` for expected names.

## Commit hooks

- Pre-commit: runs `npm run test:ci` via Husky; blocks commits if tests fail.
- Optional: run `npm run verify` before pushing, or add a pre-push hook to automate.
