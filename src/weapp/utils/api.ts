import type { ProductWithId } from '@shared/models/product'
import type { OrderWithId } from '@shared/models/order'

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

export function searchStoreProducts(keyword: string, limit?: number) {
  const payload: Record<string, unknown> = { keyword }
  if (typeof limit === 'number') payload.limit = limit
  return callShopFunction<{ products: ProductWithId[] }>('v1.store.products.search', payload)
}

export function fetchProductDetail(productId: string) {
  return callShopFunction<{ product: ProductWithId }>('v1.store.product.detail', { productId })
}

export function fetchProductsByCategory(category: string) {
  return callShopFunction<{ products: ProductWithId[] }>('v1.store.products.byCategory', { category })
}

export function fetchStoreOrders(status?: string, limit?: number) {
  const payload: Record<string, unknown> = {}
  if (status) payload.status = status
  if (typeof limit === 'number') payload.limit = limit
  return callShopFunction<{ orders: OrderWithId[] }>('v1.store.orders.list', payload)
}

export type CreateOrderPayload = {
  items: Array<{ productId: string; skuId?: string; quantity: number }>
  notes?: string
  address?: { contact?: string; phone?: string; detail?: string }
}

export function createStoreOrder(payload: CreateOrderPayload) {
  return callShopFunction<{ order: OrderWithId }>('v1.store.order.create', payload)
}

export { callShopFunction as callShop }
