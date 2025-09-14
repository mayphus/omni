import { z } from 'zod'
import { zBaseDoc } from '../base'

export const zReferralEvent = z
  .object({
    userId: z.string().min(1), // the referred user
    referrerId: z.string().min(1),
    type: z.enum(['registration', 'order']),
    orderId: z.string().optional(),
    note: z.string().optional(),
  })
  .merge(zBaseDoc)

export type ReferralEvent = z.infer<typeof zReferralEvent>

