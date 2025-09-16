# Docs Index

- Architecture: `ARCHITECTURE.md`
- Operations & build commands: `OPERATIONS.md`
- Collections & data contracts: `collections.md`
- ADRs (decision history): `ADR/`
- Environment conventions: `ENVIRONMENT.md`

Use this folder as a high-level guide: the docs summarise intent, current capabilities, and planned work. Implementation details live in the code.

## Current capabilities snapshot

- **Mini program** – read-only storefront showing featured products, categories, profile overview, and seeded content for cart/search/product detail. Authentication captures user profile basics via cloud functions.
- **Cloud function router** – action-based API powering storefront and admin. Supports auth bootstrap, featured listings, category trees, profile order counts, and admin product/order/user/system reads plus product CRUD.
- **Admin console** – CloudBase-authenticated web app for catalog management and operational reporting (dashboard metrics, order/user/system overviews).
- **Shared models** – Zod schemas for users/products/orders/system items ensure consistent validation across runtimes.

## Upcoming work / required APIs

These items are prioritised to unlock end-to-end transactions. Track them as they graduate into ADRs or code.

1. **Order lifecycle APIs** – add actions for cart checkout, order creation, status transitions, and cancellation/refund flows. Mini program pages should consume them; admin needs mutation endpoints for fulfillment updates.
2. **Payment integration** – wire WeChat Pay (or interim mock) to confirm payments, adjust user wallets (`balanceYuan`/`frozenYuan`), and update order statuses atomically.
3. **Admin role enforcement** – extend `getAdminContext` to verify the caller’s user record includes the `admin` role before granting access to `v1.admin.*` actions.
4. **System content management** – implement CRUD APIs for categories/coupons/banners so admins can maintain storefront configuration through the console.
5. **Media persistence strategy** – decide on long-lived file storage (CloudBase file IDs, CDN) and expose APIs or policies for serving product assets to the mini program.
6. **Analytics & audit trail** – capture admin actions and key order events (e.g., `audit_logs` collection) to support future ops reviews.

## Language

- Development is conducted in English: code, comments, commit messages, and documentation.
- Product UI is English for now; localisation can be added later.

Update rule: keep docs curated and intent-focused. When cross-cutting decisions change, update the relevant doc and, if applicable, add an ADR.
