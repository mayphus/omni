# CloudBase Collections (Shop)

Purpose: minimal, evolvable NoSQL design for a shop using CloudBase.

Conventions
- IDs: `_id` on server; map to `id` in app via `fromServer`/`toServer`.
- Timestamps: `createdAt`, `updatedAt` (ms since epoch).
- Money: yuan decimals (<=2dp). See `src/shared/money.ts`.

Collections and fields (minimal)

- `users`
  - `_id` string
  - `openid` string, `unionid?` string
  - `roles` string[] ('user'|'admin')
  - `profile` { `nickname` string, `avatarUrl?` string, `phone?` string }
  - `referrerId?` string, `referralCode?` string
  - `wallet` { currency 'CNY', balanceYuan number, frozenYuan number }
  - `createdAt`, `updatedAt`
  - Indexes: `openid` unique; `unionid` sparse unique

- `products`
  - `_id` string
  - `title` string, `subtitle?` string, `description?` string, `richDescription?` string
  - `images` [{ `fileId`, `url` }]
  - `category?` string slug, `spuId?` string
  - `price` { currency 'CNY', priceYuan number }
  - `stock` int, `isActive` bool, `attributes?` record, `skus?` [{ `skuId`, `priceYuan`, `stock`, `attributes?`, `isActive` }]
  - `createdAt`, `updatedAt`
  - Indexes: `isActive`; `category`; text index on `title`

- `orders`
  - `_id` string
  - `userId` string
  - `items` [{ `productId`, `title`, `qty`, `priceYuan` }]
  - `subtotalYuan`, `shippingYuan`, `discountYuan`, `totalYuan`
  - `status` enum('pending','paid','shipped','completed','canceled','refunded')
  - `payment?` { method 'wechat_pay', transactionId? string }
  - `notes?` string
  - `createdAt`, `updatedAt`
  - Indexes: `userId`+`createdAt`; `status`+`createdAt`

- `system`
  - Mixed structured items to keep collections minimal: categories, coupons, banners
  - Common fields: `_id`, `kind` ('category'|'coupon'|'banner'), `createdAt`, `updatedAt`
  - When `kind = 'category'`: `name`, `slug`, `parentId?`, `sort`, `isActive`, `imageUrl?`, `description?`
    - Indexes: `slug` unique; `parentId`+`sort`
  - When `kind = 'coupon'`: `code`, `type` ('percent'|'fixed'), `value`, `minOrderYuan`, `validFrom?`, `validTo?`, `isActive`, `appliesToProductIds?`, `appliesToCategoryIds?`
    - Indexes: `code` unique; `validTo`; `isActive`
  - When `kind = 'banner'`: `imageUrl`, `title?`, `linkUrl?`, `sort`, `isActive`, `startAt?`, `endAt?`
    - Indexes: `isActive`+`sort`; `endAt`

- `audit_logs` (optional)
  - `_id` string
  - `actorId?` string, `action` string, `target?` { type, id? }, `ip?` string, `meta?` record
  - `createdAt`, `updatedAt`
  - Indexes: `createdAt`

Notes
- Use Zod schemas in `src/shared/models/**` to validate writes/reads.
- Cart lives client-side (local storage) initially; no `carts` collection.
- Start with virtual products: no `shipments` or `user_addresses` collections.
- Keep referrals simple: just `referrerId` on `users` for now.

## Planned API surface & collection evolution

Use this as forward guidance when expanding the backend:

- **Orders** – introduce write endpoints for cart checkout, status updates (paid/shipped/completed/refunded), and attach payment metadata (`payment.transactionId`, settlement timestamps). Consider a `order_events` or `audit_logs` collection to chronicle transitions.
- **Payments & wallet** – model wallet transactions (credit/debit/freeze) and persist them either as an embedded array or a dedicated `wallet_ledger` collection. Tie mutations to payment confirmation APIs.
- **System items** – provide admin CRUD endpoints for `system` items, enforcing slug/code uniqueness server-side. Track history via optional `audit_logs` entries.
- **Products** – add price history or inventory movement logs (`inventory_adjustments`) once stock synchronization is required.
- **Customer data** – when shipping addresses or invoices become necessary, introduce `user_addresses`/`invoices` collections linked to users and orders.
- **Referrals & marketing** – expand `referralCode` usage with a supporting `referrals` collection if campaigns require tracking and reward issuance.
