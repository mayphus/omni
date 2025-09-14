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
  - `images` string[] (URLs)
  - `categoryId?` string, `spuId?` string
  - `price` { currency 'CNY', priceYuan number }
  - `stock` int, `isActive` bool, `attributes?` record, `skus?` [{ `skuId`, `priceYuan`, `stock`, `attributes?`, `isActive` }]
  - `createdAt`, `updatedAt`
  - Indexes: `isActive`; `categoryId`; text index on `title`

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
