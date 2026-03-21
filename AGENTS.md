# Repository Guidelines

## Project Structure & Module Organization

```
src/
  weapp/      # WeChat Mini Program sources (weapp-vite) → builds to ./weapp
  functions/  # CloudBase function sources (Node 18 CJS) → builds to ./functions
  admin/      # Admin (Vite + React) → builds to ./admin
  shared/     # Cross-runtime types + Zod schemas
  types/      # Ambient .d.ts only (e.g., miniprogram API typings)
tests/        # Vitest unit/integration tests
```

- English-only code. Export only pure TypeScript from `src/shared`.
- Cloud function name: `shop` (single action router; e.g., `v1.system.ping`).
- Package manager: `pnpm` only—do not run `npm`, `npx`, or `yarn`.

## Build, Test, and Development Commands

- `pnpm dev:weapp` – run the mini program via `weapp-vite dev`.
- `pnpm build:weapp` – build the mini program, run the WeChat NPM packaging step, and sync output to `./weapp` (calls `scripts/weapp-npm.js` and `scripts/weapp-deploy.js`).
- `pnpm build:weapp:npm` – run only the WeChat NPM packaging step (requires a fresh `build:weapp`).
- `pnpm dev:admin` – start the admin app with `vite --config vite.config.main.ts --mode admin`.
- `pnpm build:admin` – build the admin bundle.
- `pnpm dev:functions` – placeholder; prints that function watch/dev mode is not implemented yet.
- `pnpm build:functions` – build the CloudBase `shop` function via Vite (`--mode functions`).
- `pnpm dev:all` / `pnpm build:all` / `pnpm deploy:all` – orchestrate the respective dev/build/deploy tasks for weapp, functions, and admin using `scripts/*` helpers.
- `pnpm deploy:weapp` – wrapper around the full weapp build pipeline.
- `pnpm deploy:functions` – build then deploy `shop` via `tcb fn deploy shop --force`.
- `pnpm deploy:admin` – build then deploy the admin hosting via `tcb hosting deploy`.

- `pnpm typecheck` – run TypeScript in no-emit mode.
- `pnpm test` – run `vitest` once and then `build:all`; expect longer runtime.
- `pnpm test:ci` – lightweight Vitest run (dot reporter).
- `pnpm verify` – pipeline (typecheck → `test:ci` → `build:functions` → `build:weapp` → `build:admin`).

## Coding Style & Naming Conventions

- Language: TypeScript. Indent 2 spaces, LF endings, final newline (`.editorconfig`).
- Names and comments in English. Prefer clear, explicit naming.
- Money in yuan (decimal, up to 2dp); timestamps in milliseconds.
- Vite configs: minimal and explicit; avoid hidden magic.
- WeApp UI: Vant Weapp only; use per-page `usingComponents` (auto-import enabled).
- Shared code: only runtime-agnostic TS in `src/shared` (types + Zod schemas).

## Testing Guidelines

- Framework: Vitest. Place tests under `tests/**`, named `*.test.ts`.
- `pnpm test` executes Vitest and then builds all targets; use it before commits.
- Use `pnpm test:ci` for focused/unit runs when you do not need the builds.
- Add unit tests for new handlers and any new shared schemas.

## Commit & Pull Request Guidelines

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `ci:`.
- Hooks: pre-commit runs `typecheck` + `test`; pre-push runs `verify`.
- PRs: include a clear description, link issues, add tests/docs, and pass CI. Include screenshots/GIFs for UI changes.

## Documentation Practices

- Keep `docs/` aligned with the current implementation and roadmap; update relevant pages whenever behaviour or plans change so the folder remains a reliable high-level guide.
- Treat documentation as a living contract: every significant feature or plan update should accompany a doc refresh before the work is considered complete.

## Security & Configuration Tips

- Never commit secrets. Use `.env.local`; note `VITE_*` variables are public.
- Store keys outside the repo (e.g., `~/.config/omni/keys`).
- CloudBase: configure environment via console/CI; avoid storing credentials in code.
- WeChat DevTools: enable “Use npm modules” and run Tools → “Build NPM”.
