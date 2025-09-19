import { z } from 'zod'
import { zBaseDoc } from '../base'
import { zYuan } from '../money'

// System items power the marketing layer of the store: navigation, banners,
// coupons. Admins curate these records to influence what customers see first.

// Allow either internal mini program routes or external URLs so marketing can
// deep-link to specific experiences.
const zLinkTarget = z
  .string()
  .trim()
  .min(1)
  .refine((value) => value.startsWith('/') || /^https?:\/\//i.test(value), {
    message: 'Link must be an http(s) URL or internal mini program path',
  })

// Category nodes power both storefront filters and admin navigation. We keep
// them separate from product documents so merchandising can iterate freely.
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

// Coupons are defined as generic incentives. Enforcement happens in the cloud
// function; here we only store the parameters marketing configures.
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

// Home page banners rotate promotions. Optional scheduling keeps flash sales
// lightweight without introducing another service.
export const zSystemBanner = z
  .object({
    kind: z.literal('banner'),
    imageUrl: z.string().url(),
    title: z.string().optional(),
    linkUrl: zLinkTarget.optional(),
    sort: z.number().int().default(0),
    isActive: z.boolean().default(true),
    startAt: z.number().int().optional(),
    endAt: z.number().int().optional(),
  })
  .merge(zBaseDoc)

export type SystemBanner = z.infer<typeof zSystemBanner>

export const zSystemItem = z.discriminatedUnion('kind', [zSystemCategory, zSystemCoupon, zSystemBanner])
export type SystemItem = z.infer<typeof zSystemItem>

export const zSystemCategoryWithId = zSystemCategory.extend({ id: z.string() })
export type SystemCategoryWithId = z.infer<typeof zSystemCategoryWithId>

export const zSystemCouponWithId = zSystemCoupon.extend({ id: z.string() })
export type SystemCouponWithId = z.infer<typeof zSystemCouponWithId>

export const zSystemBannerWithId = zSystemBanner.extend({ id: z.string() })
export type SystemBannerWithId = z.infer<typeof zSystemBannerWithId>

export const zSystemItemWithId = z.discriminatedUnion('kind', [
  zSystemCategoryWithId,
  zSystemCouponWithId,
  zSystemBannerWithId,
])
export type SystemItemWithId = z.infer<typeof zSystemItemWithId>
