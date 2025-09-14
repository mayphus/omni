import { z } from 'zod'
import { zBaseDoc } from '../base'

export const zAuditLog = z
  .object({
    actorId: z.string().optional(), // system if absent
    action: z.string().min(1),
    target: z
      .object({
        type: z.enum(['user', 'product', 'order', 'transaction', 'referral', 'settings', 'other']).default('other'),
        id: z.string().optional(),
      })
      .optional(),
    ip: z.string().optional(),
    meta: z.record(z.string(), z.any()).optional(),
  })
  .merge(zBaseDoc)

export type AuditLog = z.infer<typeof zAuditLog>
