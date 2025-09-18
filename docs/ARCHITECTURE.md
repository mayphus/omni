# Architecture

Goal: keep it simple. Three apps authored under `src/` and built to separate output folders.

Structure
```
src/
  weapp/           # authored with weapp-vite → ./weapp
  functions/       # Node 18 CJS build → ./functions
  admin/           # React web build → ./admin
  shared/          # runtime-agnostic types + Zod schemas

weapp/             # WeChat DevTools project root
functions/         # Deployed functions (CloudBase)
admin/             # Static web assets for console
```

Build pipeline
- WeApp: `weapp-vite` compiles `src/weapp` → `weapp/` (includes `weapp/miniprogram_npm`). Vant components are copied post-build via `scripts/weapp-npm.js` when DevTools packing is unavailable.
- Functions: Vite builds `src/functions/shop` to CJS Node18 → `functions/shop/index.js` with its own `package.json`. The bundle keeps `wx-server-sdk`/`zod` external and mirrors the single router file.
- Admin: Vite builds `src/admin` → `admin/`. Tailwind configuration is scoped to the admin app.

Key decisions
- Cloud runtime: Node.js 18.15, CommonJS output (CloudBase friendly).
- UI: Vant Weapp in miniapp; shadcn-style components in admin; avoid custom widget work unless required.
- Configs: Separate Vite configs for miniapp vs admin/functions for clarity and to keep runtimes independent.
- Docs: Minimal but up to date; code + ADRs remain the source of truth for behaviour.
- Language: English-only for development (code/docs/commits). UI copy in English until localisation is required.

## Runtime modules

### Shared domain (`src/shared`)
- Zod schemas define `User`, `Product`, `Order`, and `SystemItem`. All payloads flowing between runtimes are validated against these contracts.
- Helpers (`base.ts`, `money.ts`) normalise timestamps, ids, and yuan handling (decimals with ≤2 dp). Admin + mini program format prices using the same helpers to avoid drift.
- `Collections` constant keeps CloudBase collection names consistent (users/products/orders/system).

### Cloud function router (`src/functions/shop/index.ts`)
- Single export `main(event)` expects `event.action` and dispatches to handlers in a table.
- Storefront handlers (`v1.store.*`) power the mini program: `home` surfaces featured products, `categories.list` returns parent/child trees, `profile.overview` counts orders for the authenticated user (OPENID).
- Auth handlers (`v1.auth.*`) create/update user documents keyed by `openid`. `ensureUserByOpenid` bootstraps new accounts with a default profile and wallet.
- Admin handlers (`v1.admin.*`) serve the React console. They require CloudBase context (`getAdminContext`) but currently only check for any authenticated identity; future work will introduce role checks against the stored user document.
- `v1.admin.dashboard.summary` aggregates orders/users, calculating revenue, paid/pending counts, and returning recent orders. Helper `fetchOrdersForStats` paginates up to 1k orders to avoid missing data.
- All successful responses include `{ success: true, action, executionTime }`, and failures echo validation issues for debugging.

### Mini program (`src/weapp`)
- Boot: `App` initialises i18n, patches `wx.getSystemInfoSync`, and calls `wx.cloud.init` with `VITE_TCB_ENV_ID` derived from build/runtime env (`config/cloud.ts`).
- API utilities (`utils/api.ts`) wrap `wx.cloud.callFunction('shop', { action })` and expose typed helpers (`fetchStoreHome`, `fetchStoreCategories`, `fetchStoreProfileOverview`). Auth helpers (`utils/auth.ts`) call `v1.auth.*`, caching users in storage and `globalData`.
- Pages use `withI18nPage` HOC for reactive locale data:
  - `pages/index` → loads featured products from `v1.store.home` and displays Vant cards. Error/empty states are fully wired.
  - `pages/category` → consumes `v1.store.categories.list` to build a tab view with parent/child categories.
  - `pages/profile` → reads cached user, triggers login/profile update flows, and pulls `orderCounts` from `v1.store.profile.overview`. Language switcher updates i18n and global state.
  - `pages/cart`, `pages/checkout`, `pages/orders`, `pages/product`, `pages/search` currently render demo/i18n-driven content without backend calls; they illustrate intended UX placeholders.
- Custom tab bar (`custom-tab-bar`) drives navigation and reflects the active route.

### Admin console (`src/admin`)
- Hash router (`lib/router.ts`) swaps between dashboard/products/orders/users/system routes. `App.tsx` gates on CloudBase login (`lib/cloudbase.ts`) using username/password auth, storing the signed-in admin user.
- Service layer (`services/*.ts`) shares Zod schemas with the function router. Each helper calls `callShopFunction` and parses the shape using `zShopSuccess` plus entity-specific schemas.
- Pages:
  - Dashboard: fetches `v1.admin.dashboard.summary` and user list to show metrics and recent orders with customer names.
  - Products: full CRUD over `v1.admin.products.*` with modal editor, SKU/attribute editing, and CloudBase-backed image uploads (`components/products/ImageUploader.tsx`).
  - Orders: read-only filterable table combining order list + users.
  - Users: read-only overview of user roles/wallet balances.
  - System: read-only listing plus health info via `v1.system.ping`.
- UI reuses Tailwind + shadcn primitives defined under `components/ui`.

## Data & business flow

1. Mini program initiates login via `v1.auth.login`, creating a minimal user profile (nickname placeholder, empty wallet) if missing. Profile updates (`v1.auth.profile.update`) ensure the document exists before writing.
2. Storefront data is read-only for now: featured products and categories rely on CloudBase documents curated via the admin console (products) or manual inserts (system collection).
3. Orders are read-only across the UI. `Order` schema supports `pending → paid → shipped → completed` life cycle plus `canceled/refunded` for after-sale, but no API currently mutates orders or triggers payment; those flows remain future work.
4. Admin console reads products/users/orders/system items via respective `v1.admin.*` actions. Product creation/edit flows normalise SKUs, enforce price precision, and stamp `createdAt/updatedAt` using shared helpers.
5. User wallets (`balanceYuan`, `frozenYuan`) are modelled but untouched; payment integration will update these fields and transition order statuses.

## Known follow-ups
- Harden `getAdminContext` by confirming the current identity holds an `admin` role in the users collection before allowing admin mutations.
- Flesh out cart → checkout → order creation flow in the mini program and expose complementary create/update actions in the function router.
- Provide management actions for system collection items if admins need to maintain categories/coupons/banners from the console.
- Replace placeholder mini program pages/links (`/pages/about/index`, support URLs) with actual implementations or guard against navigation.
