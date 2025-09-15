# Functions (CloudBase)

- Runtime: Node.js 18, CommonJS output.
- Packaging: build from `src/functions/*` → `./functions/*`.
- Pattern: single function `shop` with action router (e.g., `v1.system.ping`).

MVP Checklist (current)
- `v1.system.ping` responds with `{ success: true, message: 'pong' }`.
- Basic auth flow using WeChat OPENID/UNIONID: `v1.auth.login`, `v1.auth.profile.update`.
- Collections are kept minimal (users, products, orders, system) and modeled via `src/shared`.
