# Shared Domain Models

Purpose
- Define cross-runtime types and validation schemas for core entities.
- Use Zod for runtime validation + TypeScript inference.
- Keep models minimal, evolvable, and platform-agnostic.

Guidelines
- Field names use camelCase.
- Monetary values are represented in yuan (decimal, up to 2dp) to avoid confusion. Use helpers in `money.ts` to convert to/from cents when integrating with payment providers.
- Include `createdAt`/`updatedAt` (ms since epoch). Avoid auto-added fields; set explicitly.
- Client shape uses `id`; database records may use `_id`. Use mappers in `base.ts`.

Collections (initial)
- users, products, orders, carts, transactions, referrals, audit_logs, settings

Files
- `base.ts` – shared primitives, base doc, id mappers.
- `collections.ts` – canonical collection name constants.
- `money.ts` – yuan schema and helpers (`zYuan`, `yuanToCents`, `centsToYuan`, `formatCNY`).
- `models/*.ts` – entity models (User, Product, Order, Cart, Transaction, Referral, Audit, Settings).
