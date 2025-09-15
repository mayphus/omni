# Operations

Quickstart
- Install deps: `npm i` (root)
- Miniapp dev: `npm run dev:weapp` → open `./project.config.json` in WeChat DevTools
- Admin dev: `npm run dev:admin`
- Cloud build: `npm run build:functions` (deploy with `tcb` CLI when ready)

WeApp (Miniapp)
- Build: `npm run build:weapp` → outputs to `./weapp`
- NPM components: enable “Use npm modules” in DevTools, then run:
  - `npm run build:weapp:npm` (weapp‑vite triggers DevTools packing)
- Deploy: `npm run deploy:weapp` (uses `miniprogram-ci` with appid from `project.config.json` and key at `.private-wx.key` or `WECHAT_PRIVATE_KEY_PATH`)
- DevTools: import the repo root; it uses `project.config.json` (`miniprogramRoot: weapp/`).
- Env: baseline does not inject env into builds; add runtime config or compile-time define later only if necessary.

Functions (CloudBase)
- Runtime: Nodejs18.15, CJS output
- Deploy:
  - Using config envId: `npm run deploy:functions`
  - Override envId: `tcb fn deploy shop --envId <env> --force`
  - Invoke example: `tcb fn invoke shop --envId <env> --params '{"action":"v1.system.ping"}'`

Admin
- Dev: `npm run dev:admin` – Vite dev server (Hello World)
- Build: `npm run build:admin` → `./admin`
- Hosting (example): `npx tcb hosting deploy ./admin --envId <env>`

Env & secrets
- Optional: create `.env.local` later if build-time values are truly needed
- Recommended names:
  - `WECHAT_APP_ID`
  - `WECHAT_PRIVATE_KEY_PATH` – path to the local mini program CI private key file
  - `TCB_ENV_ID`
  - `TCB_PRIVATE_KEY` – path to the local CloudBase CLI private key file
- Real keys live as files: `.private-wx.key`, `.private-tcb.key` (both git-ignored)

CI hooks
- Keep `verify` green: typecheck, tests, and builds for all targets.
