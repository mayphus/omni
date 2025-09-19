# Operations

Quickstart
- Install deps: `pnpm install` (root)
- Miniapp dev: `pnpm run dev:weapp` → open `./project.config.json` in WeChat DevTools
- Admin dev: `pnpm run dev:admin`
- Cloud build: `pnpm run build:functions` (deploy with `tcb` CLI when ready)
- Pipeline check: `pnpm run verify` (Plan → Execute → Verify; see below)

WeApp (Miniapp)
- Build: `pnpm run build:weapp` → outputs to `./weapp`
- NPM components: enable “Use npm modules” in DevTools, then run:
  - `pnpm run build:weapp:npm` (weapp‑vite triggers DevTools packing)
- Deploy: `pnpm run deploy:weapp` (uses `miniprogram-ci` with appid from `project.config.json` and key at `.private-wx.key` or `WECHAT_PRIVATE_KEY_PATH`)
- DevTools: import the repo root; it uses `project.config.json` (`miniprogramRoot: weapp/`).
- Env: baseline does not inject env into builds; add runtime config or compile-time define later only if necessary.
- Planned: hook cart/checkout UI into future `v1.store.order.*` APIs once implemented; prepare UX for payment confirmation states.

Functions (CloudBase)
- Runtime: Nodejs18.15, CJS output
- Deploy:
  - Using config envId: `pnpm run deploy:functions`
  - Override envId: `tcb fn deploy shop --envId <env> --force`
  - Invoke example: `tcb fn invoke shop --envId <env> --params '{"action":"v1.system.ping"}'`
- Planned: add order/payment endpoints, admin role enforcement, and system collection mutation handlers.

Admin
- Dev: `pnpm run dev:admin` – Vite dev server with dashboard, catalog CRUD, orders/users/system views.
- Build: `pnpm run build:admin` → `./admin`
- Hosting (example): `npx tcb hosting deploy ./admin --envId <env>`
- Planned: surface order status updates, bulk product tools, and CMS features once corresponding APIs exist.

Env & secrets
- Optional: create `.env.local` later if build-time values are truly needed
- Recommended names:
  - `WECHAT_APP_ID`
  - `WECHAT_PRIVATE_KEY_PATH` – path to the local mini program CI private key file
  - `TCB_ENV_ID`
  - `TCB_PRIVATE_KEY` – path to the local CloudBase CLI private key file
- Real keys live as files: `.private-wx.key`, `.private-tcb.key` (both git-ignored)

CI hooks
- Keep `pnpm run verify` green. The script now performs the Plan → Execute → Verify loop:
  - Plan: `pnpm run typecheck`
  - Execute: build functions, weapp, and admin bundles
  - Verify: `pnpm run test:ci` plus `pnpm run test:e2e`
- Mini program E2E runs via `miniprogram-automator`. Set `WECHAT_DEVTOOLS_CLI` to the WeChat DevTools CLI path and export `SHOP_FORCE_E2E=1` before running the pipeline to execute the flow locally. Without those variables the suite is skipped but reported in the logs so you know automation was not exercised.
