import { z } from 'zod'
import { zBaseDoc, zTimestamp } from '../base'
import { zYuan } from '../money'

// Order models capture the business contract between a shopper and the
// fulfilment team: who placed the order, what they bought, how much they
// paid, and where the order currently sits in the post-purchase timeline.

// Status flow mirrors the real-world journey: pending payment → fulfillment →
// completion, with cancellation/refund captured as after-sale outcomes.
export const ORDER_STATUS_VALUES = ['pending', 'paid', 'shipped', 'completed', 'canceled', 'refunded'] as const
export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number]
export const zOrderStatus = z.enum(ORDER_STATUS_VALUES)
export const ORDER_STATUS_FLOW: readonly OrderStatus[] = ORDER_STATUS_VALUES.filter(
  (status): status is OrderStatus => status !== 'canceled' && status !== 'refunded',
)
export const ORDER_AFTER_SALE_STATUSES: readonly OrderStatus[] = ORDER_STATUS_VALUES.filter(
  (status): status is OrderStatus => status === 'canceled' || status === 'refunded',
)

// Each order line fixes the catalog reference and the unit price that the
// customer agreed to, so later price updates do not affect past invoices.
export const zOrderItem = z.object({
  productId: z.string().min(1),
  skuId: z.string().min(1).optional(),
  title: z.string().min(1),
  qty: z.number().int().min(1),
  priceYuan: zYuan.min(0),
})

export const zPaymentStatus = z.enum(['pending', 'ready', 'succeeded', 'failed', 'refunded'])
export type PaymentStatus = z.infer<typeof zPaymentStatus>

export const zPaymentPackage = z
  .object({
    timeStamp: z.string(),
    nonceStr: z.string(),
    package: z.string(),
    signType: z.string(),
    paySign: z.string(),
  })
  .partial()

export type PaymentPackage = z.infer<typeof zPaymentPackage>

// Payment data links the WeChat Pay transaction to the order so customer
// support can trace issues and the admin can reconcile payouts.
export const zPayment = z.object({
  method: z.literal('wechat_pay'),
  status: zPaymentStatus.default('pending'),
  amountYuan: zYuan.min(0),
  currency: z.literal('CNY').default('CNY'),
  outTradeNo: z.string().optional(),
  prepayId: z.string().optional(),
  transactionId: z.string().optional(),
  preparedAt: zTimestamp.optional(),
  paidAt: zTimestamp.optional(),
  lastError: z.string().optional(),
  paymentPackage: zPaymentPackage.optional(),
})

// End-to-end summary of a storefront purchase. Shipping/discounts are kept
// explicit so finance can audit promotions without additional joins.
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
export type Payment = z.infer<typeof zPayment>

export const zOrderWithId = zOrder.extend({ id: z.string() })
export type OrderWithId = z.infer<typeof zOrderWithId>
