import { z } from 'zod'
import { zBaseDoc } from '../base'
import { zYuan } from '../money'

export const zOrderStatus = z.enum(['pending', 'paid', 'shipped', 'completed', 'canceled', 'refunded'])
export type OrderStatus = z.infer<typeof zOrderStatus>

export const zOrderItem = z.object({
  productId: z.string().min(1),
  title: z.string().min(1),
  qty: z.number().int().min(1),
  priceYuan: zYuan.min(0),
})

export const zPayment = z.object({
  method: z.enum(['wechat_pay']).default('wechat_pay'),
  transactionId: z.string().optional(),
})

export const zOrder = z
  .object({
    userId: z.string().min(1),
    items: z.array(zOrderItem).min(1),
    subtotalYuan: zYuan.min(0),
    shippingYuan: zYuan.min(0).default(0),
    discountYuan: zYuan.min(0).default(0),
    totalYuan: zYuan.min(0),
    status: zOrderStatus.default('pending'),
    payment: zPayment.optional(),
    address: z
      .object({
        contact: z.string().optional(),
        phone: z.string().optional(),
        detail: z.string().optional(),
      })
      .optional(),
    notes: z.string().optional(),
  })
  .merge(zBaseDoc)

export type Order = z.infer<typeof zOrder>
export type OrderItem = z.infer<typeof zOrderItem>

export const zOrderWithId = zOrder.extend({ id: z.string() })
export type OrderWithId = z.infer<typeof zOrderWithId>
