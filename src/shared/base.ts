import { z } from 'zod'

export type TimestampMS = number

export const zTimestamp = z.number().int().nonnegative()
export const zDocId = z.string().min(1)

export const zBaseDoc = z.object({
  createdAt: zTimestamp,
  updatedAt: zTimestamp,
})
export type BaseDoc = z.infer<typeof zBaseDoc>

export type WithId<T> = T & { id: string }
export type WithServerId<T> = T & { _id: string }

export function nowMs(): TimestampMS {
  return Date.now()
}

export function fromServer<T extends object>(doc: WithServerId<T>): WithId<T> {
  const { _id, ...rest } = doc as any
  return { id: _id, ...(rest as T) }
}

export function toServer<T extends object>(doc: WithId<T>): WithServerId<T> {
  const { id, ...rest } = doc as any
  return { _id: id, ...(rest as T) }
}

