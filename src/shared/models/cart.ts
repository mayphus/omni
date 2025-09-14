import { z } from 'zod'
import { zBaseDoc } from '../base'

export const zCartItem = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1),
})

export const zCart = z
  .object({
    userId: z.string().min(1),
    items: z.array(zCartItem).default([]),
  })
  .merge(zBaseDoc)

export type CartItem = z.infer<typeof zCartItem>
export type Cart = z.infer<typeof zCart>

