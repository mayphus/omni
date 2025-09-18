# Docs Index

- Architecture: `ARCHITECTURE.md`
- Operations & build commands: `OPERATIONS.md`
- Collections & data contracts: `collections.md`
- ADRs (decision history): `ADR/`
- Environment conventions: `ENVIRONMENT.md`

Use this folder as a high-level guide: the docs summarise intent, current capabilities, and planned work. Implementation details live in the code.

## Current capabilities snapshot

- **Mini program** – full browsing and checkout flow backed by WeChat Pay. Users can search, manage the cart, place orders, and complete payment directly inside the mini program.
- **Cloud function router** – action-based API powering storefront and admin. Handles auth bootstrap, catalogue queries, order creation, payment preparation/confirmation, and admin-side product/user/system data plus order lifecycle mutations.
- **Admin console** – CloudBase-authenticated console for catalogue management, dashboard metrics, and operational tooling. Operators can review payment metadata and transition orders through fulfillment states.
- **Shared models** – Zod schemas for users/products/orders/system items (including payment contracts) to keep validation consistent across runtimes.

## Upcoming work / required APIs

These items are prioritised to unlock end-to-end transactions. Track them as they graduate into ADRs or code.

1. **Wallet and settlement ledger** – reconcile payments with user wallets (`balanceYuan`/`frozenYuan`) and record ledger entries for payouts/refunds.
2. **Admin role enforcement** – extend `getAdminContext` to verify the caller’s user record includes the `admin` role before granting access to `v1.admin.*` actions.
3. **System content management** – implement CRUD APIs for categories/coupons/banners so admins can maintain storefront configuration through the console.
4. **Media persistence strategy** – decide on long-lived file storage (CloudBase file IDs, CDN) and expose APIs or policies for serving product assets to the mini program.
5. **Analytics & audit trail** – capture admin actions and key order events (e.g., `audit_logs` collection) to support future ops reviews.
6. **Asynchronous payment webhooks** – handle CloudBase pay notifications for redundancy and to support refunds at scale.

## Language

- Development is conducted in English: code, comments, commit messages, and documentation.
- Product UI is English for now; localisation can be added later.

Update rule: keep docs curated and intent-focused. When cross-cutting decisions change, update the relevant doc and, if applicable, add an ADR.
