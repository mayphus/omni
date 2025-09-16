type ShopCallSuccess<T> = {
  success: true
  action: string
  timestamp: string
  executionTime: number
} & T

type ShopCallResult<T> = ShopCallSuccess<T>

async function callShopFunction<T>(action: string, payload: Record<string, unknown> = {}): Promise<ShopCallResult<T>> {
  try {
    const response = (await wx.cloud.callFunction({
      name: 'shop',
      data: { action, ...payload },
    })) as { result?: any }

    const { result } = response || {}
    if (!result) throw new Error('Empty response from cloud function')
    if (result.success !== true) {
      const error = result.error || result.code || 'Request failed'
      throw new Error(typeof error === 'string' ? error : 'Request failed')
    }
    return result as ShopCallResult<T>
  } catch (error) {
    const err = error as { errMsg?: string; message?: string }
    throw new Error(err?.message || err?.errMsg || 'Request failed')
  }
}

export type StoreFeaturedProduct = {
  id: string
  title: string
  subtitle?: string
  priceYuan: number
  currency: 'CNY'
  imageUrl?: string
  hasStock: boolean
}

export type StoreCategoryNode = {
  id: string
  name: string
  slug: string
  imageUrl?: string
  description?: string
  children: Array<{ id: string; name: string; slug: string; imageUrl?: string; description?: string }>
}

export type StoreProfileOverview = {
  orderCounts: {
    toPay: number
    toShip: number
    toReceive: number
    afterSale: number
  }
}

export function fetchStoreHome() {
  return callShopFunction<{ featuredProducts: StoreFeaturedProduct[] }>('v1.store.home')
}

export function fetchStoreCategories() {
  return callShopFunction<{ categories: StoreCategoryNode[] }>('v1.store.categories.list')
}

export function fetchStoreProfileOverview() {
  return callShopFunction<StoreProfileOverview>('v1.store.profile.overview')
}

export { callShopFunction as callShop }

