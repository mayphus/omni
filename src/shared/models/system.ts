import { z } from 'zod'
import { zBaseDoc } from '../base'
import { zYuan } from '../money'

export const zSystemCategory = z
  .object({
    kind: z.literal('category'),
    name: z.string().min(1),
    slug: z.string().min(1),
    parentId: z.string().optional(),
    sort: z.number().int().default(0),
    isActive: z.boolean().default(true),
    imageUrl: z.string().url().optional(),
    description: z.string().optional(),
  })
  .merge(zBaseDoc)

export type SystemCategory = z.infer<typeof zSystemCategory>

export const zSystemCoupon = z
  .object({
    kind: z.literal('coupon'),
    code: z.string().min(3).toUpperCase(),
    type: z.enum(['percent', 'fixed']),
    value: z.number().positive(),
    minOrderYuan: zYuan.min(0).default(0),
    validFrom: z.number().int().optional(),
    validTo: z.number().int().optional(),
    isActive: z.boolean().default(true),
    appliesToProductIds: z.array(z.string()).optional(),
    appliesToCategoryIds: z.array(z.string()).optional(),
  })
  .merge(zBaseDoc)

export type SystemCoupon = z.infer<typeof zSystemCoupon>

export const zSystemBanner = z
  .object({
    kind: z.literal('banner'),
    imageUrl: z.string().url(),
    title: z.string().optional(),
    linkUrl: z.string().url().optional(),
    sort: z.number().int().default(0),
    isActive: z.boolean().default(true),
    startAt: z.number().int().optional(),
    endAt: z.number().int().optional(),
  })
  .merge(zBaseDoc)

export type SystemBanner = z.infer<typeof zSystemBanner>

export const zSystemItem = z.discriminatedUnion('kind', [zSystemCategory, zSystemCoupon, zSystemBanner])
export type SystemItem = z.infer<typeof zSystemItem>

