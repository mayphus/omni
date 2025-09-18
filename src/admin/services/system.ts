import { z } from 'zod'
import { callShopFunction } from '../lib/cloudbase'
import { zShopSuccess } from './shop'
import {
  zSystemBannerWithId,
  zSystemCategoryWithId,
  zSystemCouponWithId,
  type SystemBannerWithId,
  type SystemCategoryWithId,
  type SystemCouponWithId,
} from '@shared/models/system'

const zSystemListResponse = zShopSuccess.extend({
  categories: z.array(zSystemCategoryWithId),
  coupons: z.array(zSystemCouponWithId),
  banners: z.array(zSystemBannerWithId),
})

const zSystemPingResponse = zShopSuccess.extend({
  message: z.string().optional(),
})

const zBannerSaveResponse = zShopSuccess.extend({
  banner: zSystemBannerWithId,
})

const zBannerDeleteResponse = zShopSuccess.extend({
  bannerId: z.string(),
})

export type SystemOverview = {
  categories: SystemCategoryWithId[]
  coupons: SystemCouponWithId[]
  banners: SystemBannerWithId[]
}

export type SaveBannerPayload = {
  id?: string
  imageUrl: string
  title?: string
  linkUrl?: string
  sort?: number
  isActive?: boolean
  startAt?: number
  endAt?: number
}

export async function listSystemItems(): Promise<SystemOverview> {
  const res = await callShopFunction<{
    categories: unknown
    coupons: unknown
    banners: unknown
  }>('v1.admin.system.list')
  const parsed = zSystemListResponse.parse(res)
  return {
    categories: parsed.categories,
    coupons: parsed.coupons,
    banners: parsed.banners,
  }
}

export async function pingSystem(): Promise<string | undefined> {
  const res = await callShopFunction('v1.system.ping')
  const parsed = zSystemPingResponse.parse(res)
  return parsed.message
}

export async function saveBanner(payload: SaveBannerPayload): Promise<SystemBannerWithId> {
  const res = await callShopFunction('v1.admin.banners.save', payload)
  const parsed = zBannerSaveResponse.parse(res)
  return parsed.banner
}

export async function deleteBanner(bannerId: string): Promise<string> {
  const res = await callShopFunction('v1.admin.banners.delete', { id: bannerId })
  const parsed = zBannerDeleteResponse.parse(res)
  return parsed.bannerId
}
