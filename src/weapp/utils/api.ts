import type { ProductWithId } from '@shared/models/product'
import type { OrderWithId, PaymentPackage } from '@shared/models/order'
import type { SystemBannerWithId } from '@shared/models/system'

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

export type StoreBanner = SystemBannerWithId

export function fetchStoreHome() {
  return callShopFunction<{ featuredProducts: StoreFeaturedProduct[]; banners?: StoreBanner[] }>('v1.store.home')
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

export async function fetchStoreOrderDetail(orderId: string) {
  try {
    return await callShopFunction<{ order: OrderWithId }>('v1.store.order.detail', { orderId })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (typeof message === 'string' && message.includes('Unknown action')) {
      const fallback = await fetchStoreOrders(undefined, 200)
      const order = (fallback.orders || []).find((item) => item.id === orderId)
      if (!order) throw new Error('Order not found')
      return {
        success: true,
        action: 'fallback.store.order.detail',
        timestamp: new Date().toISOString(),
        executionTime: 0,
        order,
      }
    }
    throw error
  }
}

export async function cancelStoreOrder(orderId: string) {
  try {
    return await callShopFunction<{ order: OrderWithId }>('v1.store.order.cancel', { orderId })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (typeof message === 'string' && message.includes('Unknown action')) {
      throw new Error('Order cancellation is not yet available')
    }
    throw error
  }
}

export type CreateOrderPayload = {
  items: Array<{ productId: string; skuId?: string; quantity: number }>
  notes?: string
  address?: { contact?: string; phone?: string; detail?: string }
}

export function createStoreOrder(payload: CreateOrderPayload) {
  return callShopFunction<{ order: OrderWithId }>('v1.store.order.create', payload)
}

export type PreparePaymentResult = {
  payment: {
    status: string
    amountYuan: number
    currency: string
    prepayId?: string
    outTradeNo?: string
    preparedAt?: number
  }
  paymentPackage?: PaymentPackage
}

export function prepareOrderPayment(orderId: string) {
  return callShopFunction<PreparePaymentResult>('v1.store.order.payment.prepare', { orderId })
}

export function confirmOrderPayment(orderId: string) {
  return callShopFunction<{ order: OrderWithId }>('v1.store.order.payment.confirm', { orderId })
}

export { callShopFunction as callShop }
