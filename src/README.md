# Source Layout

Top‑level source is organized by runtime. Keep implementations minimal and share only what’s necessary.

- `weapp/` – WeChat Mini Program source (weapp‑vite). Output → `./weapp/`.
- `functions/` – CloudBase functions source (Node 18, CJS). Output → `./functions/`.
- `admin/` – Admin console source (React). Output → `./admin/`.
- `shared/` – Small cross‑runtime utilities (pure TS) shared across targets.
- `types/` – Central TypeScript interfaces and schema definitions.

Notes
- WeChat‑only for miniapp. UI library: Vant Weapp. English UI for now.
- Cloud functions use an action router pattern (e.g., `v1.*`) under a single `shop` function to stay minimal.
- Admin will use CloudBase auth (no dev login). Start from a simple dashboard.

Open Questions
- Confirm admin auth method (CloudBase Email/Password vs other).
- Confirm initial collections (users, products, orders) when ready.
