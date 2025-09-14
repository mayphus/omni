# Repository Guidelines

## Project Structure & Module Organization

```
src/
  weapp/      # WeChat Mini Program (weapp‑vite) → ./weapp
  functions/  # CloudBase function sources (Node 18 CJS) → ./functions
  admin/      # Admin (Vite + React) → ./admin
  shared/     # Cross‑runtime types + Zod schemas
  types/      # Ambient .d.ts only (e.g., miniprogram API typings)
tests/        # Vitest unit/integration tests
```

- English‑only code. Export only pure TypeScript from `src/shared`.
- Cloud function name: `shop` (single action router; e.g., `v1.system.ping`).

## Build, Test, and Development Commands

- `npm run dev:weapp` / `build:weapp` – develop/build the mini program.
- `npm run dev:admin` / `build:admin` – develop/build the admin app.
- `npm run build:functions:watch` / `build:functions` – watch/build CloudBase function (`shop`).
- `npm run deploy:functions` – build and deploy `shop` via `tcb`.
- `npm run typecheck` / `test` / `verify` – TS check, run tests, full pipeline.

## Coding Style & Naming Conventions

- Language: TypeScript. Indent 2 spaces, LF endings, final newline (`.editorconfig`).
- Names and comments in English. Prefer clear, explicit naming.
- Money in yuan (decimal, up to 2dp); timestamps in milliseconds.
- Vite configs: minimal and explicit; avoid hidden magic.
- WeApp UI: Vant Weapp only; use per‑page `usingComponents` (auto‑import enabled).
- Shared code: only runtime‑agnostic TS in `src/shared` (types + Zod schemas).

## Testing Guidelines

- Framework: Vitest. Place tests under `tests/**`, named `*.test.ts`.
- Run with `npm test`. Integration tests build weapp/admin/functions—keep them green.
- Add unit tests for new handlers and any new shared schemas.

## Commit & Pull Request Guidelines

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `ci:`.
- Hooks: pre‑commit runs `typecheck` + `test`; pre‑push runs `verify`.
- PRs: include a clear description, link issues, add tests/docs, and pass CI. Include screenshots/GIFs for UI changes.

## Security & Configuration Tips

- Never commit secrets. Use `.env.local`; note `VITE_*` variables are public.
- Store keys outside the repo (e.g., `~/.config/tongmeng-plant/keys`).
- CloudBase: configure environment via console/CI; avoid storing credentials in code.
- WeChat DevTools: enable “Use npm modules” and run Tools → “Build NPM”.
