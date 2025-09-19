import { z } from 'zod'

// Base primitives shared across runtimes. These helpers keep our cloud
// functions, admin app, and mini program talking about documents the same way.

export type TimestampMS = number

// Tencent Cloud stores timestamps as integer milliseconds since epoch.
// Normalising here avoids divergence between clients when they create docs.
export const zTimestamp = z.number().int().nonnegative()
export const zDocId = z.string().min(1)

// Every persisted record records its creation/update moments. Consumers can
// rely on these fields for ordering, cache busting, and optimistic locking.
export const zBaseDoc = z.object({
  createdAt: zTimestamp,
  updatedAt: zTimestamp,
})
export type BaseDoc = z.infer<typeof zBaseDoc>

// Utility types help callers express when IDs come from CloudBase vs local
// assembly. Prefer these helpers over ad-hoc `{ id: string }` in the codebase.
export type WithId<T> = T & { id: string }
export type WithServerId<T> = T & { _id: string }

export function nowMs(): TimestampMS {
  return Date.now()
}

// CloudBase returns `_id` on documents. `fromServer` lifts that into the
// friendly `id` property we expose to the rest of the app.
export function fromServer<T extends object>(doc: WithServerId<T>): WithId<T> {
  const { _id, ...rest } = doc as any
  return { id: _id, ...(rest as T) }
}

// When persisting back to CloudBase, convert our `id` back into `_id` so the
// driver performs an upsert instead of creating duplicate records.
export function toServer<T extends object>(doc: WithId<T>): WithServerId<T> {
  const { id, ...rest } = doc as any
  return { _id: id, ...(rest as T) }
}
