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
    richDescription: z.string().optional(),
    images: z.array(z.string().url()).default([]),
    categoryId: z.string().optional(),
    spuId: z.string().optional(),
    price: zPrice,
    stock: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
    attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    skus: z
      .array(
        z.object({
          skuId: z.string().min(1),
          priceYuan: zYuan.min(0),
          stock: z.number().int().min(0).default(0),
          attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
          isActive: z.boolean().default(true),
        }),
      )
      .optional(),
  })
  .merge(zBaseDoc)

export type Product = z.infer<typeof zProduct>

export const zProductInput = zProduct.omit({ createdAt: true, updatedAt: true })
export type ProductInput = z.infer<typeof zProductInput>

export const zProductWithId = zProduct.extend({ id: z.string() })
export type ProductWithId = z.infer<typeof zProductWithId>
