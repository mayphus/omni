import { z } from 'zod'
import { zBaseDoc } from '../base'
import { zYuan } from '../money'

export const zTxnType = z.enum(['deposit', 'withdrawal', 'purchase', 'refund', 'adjustment'])
export type TxnType = z.infer<typeof zTxnType>

export const zTransaction = z
  .object({
    userId: z.string().min(1),
    type: zTxnType,
    amountYuan: zYuan, // positive or negative; apply business rules in service layer
    currency: z.literal('CNY').default('CNY'),
    relatedOrderId: z.string().optional(),
    memo: z.string().optional(),
  })
  .merge(zBaseDoc)

export type Transaction = z.infer<typeof zTransaction>
