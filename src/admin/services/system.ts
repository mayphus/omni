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

export type SystemOverview = {
  categories: SystemCategoryWithId[]
  coupons: SystemCouponWithId[]
  banners: SystemBannerWithId[]
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
