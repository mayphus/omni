# Functions (CloudBase)

- Runtime: Node.js 18, CommonJS output.
- Packaging: build from `src/functions/*` → `./functions/*`.
- Pattern: single function `shop` with action router (e.g., `v1.system.ping`).

MVP Checklist (later)
- `v1.system.ping` responds with `{ success: true }`.
- Minimal auth flow using WeChat OpenID; store a user copy for custom needs.
- Collections to be defined later (best practice, minimal).

