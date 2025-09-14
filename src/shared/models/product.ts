import { z } from 'zod'
import { zBaseDoc } from '../base'
import { zYuan } from '../money'

export const zPrice = z.object({
  currency: z.literal('CNY').default('CNY'),
  priceYuan: zYuan.min(0),
})

export const zProduct = z
  .object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    images: z.array(z.string().url()).default([]),
    categoryId: z.string().optional(),
    sku: z.string().optional(),
    price: zPrice,
    stock: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
    attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .merge(zBaseDoc)

export type Product = z.infer<typeof zProduct>
