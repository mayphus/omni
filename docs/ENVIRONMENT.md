# Environment Strategy

Goals
- Align with Vite/weapp-vite conventions.
- Avoid leaking secrets into client bundles (admin + weapp).
- Keep local credentials out of Git.

Files
- `.env.example` – documented variable names and sample values (tracked).
- `.env` – optional, non-sensitive defaults (usually untracked here).
- `.env.local` – developer machine secrets (git-ignored).
- `.env.development`, `.env.production` – mode-specific non-sensitive values.

Conventions
- Client-exposed: use `VITE_*` prefix. These are replaced at build time and become part of bundles. Do not put secrets here.
- Server/runtime (functions): read from `process.env` at runtime provided by CloudBase or deployment settings. Avoid bundling secrets into code.

Variables
- `VITE_APP_NAME` – product label visible in UI.
- `VITE_ENV` – optional flag for UI/debug (e.g., `development`, `production`).
- `VITE_TCB_ENV_ID` – CloudBase environment ID used by Mini Program (`wx.cloud.init`).
- `WECHAT_APP_ID`, `WECHAT_PRIVATE_KEY` – used by miniprogram-ci locally.
- `TCB_ENV_ID`, `TCB_PRIVATE_KEY` – used by `tcb` CLI locally.

Why
- Vite/weapp-vite only expose `VITE_*` to client code, reducing accidental secret leaks.
- `.env.local` is git-ignored by default to keep credentials off the repo.
- Functions read `process.env` at runtime; secrets are managed by the platform instead of being compiled into JS.

Mini Program → CloudBase
- Set `VITE_TCB_ENV_ID` in `.env.local` to pin all `wx.cloud.*` calls to the intended CloudBase environment.
- Example: `VITE_TCB_ENV_ID=cloud1-xxxxxxxxxxxxxxxx`.
