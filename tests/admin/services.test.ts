import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductInput } from '../../src/admin/services/products'
import { listProducts, createProduct, updateProduct, deleteProduct } from '../../src/admin/services/products'
import { listOrders, updateOrderStatus } from '../../src/admin/services/orders'
import { listUsers } from '../../src/admin/services/users'
import { listSystemItems, saveBanner, deleteBanner, pingSystem } from '../../src/admin/services/system'
import { fetchDashboardSummary } from '../../src/admin/services/dashboard'

const callShopFunction = vi.hoisted(() => vi.fn())

vi.mock('../../src/admin/lib/cloudbase', async () => {
  const actual = await vi.importActual<typeof import('../../src/admin/lib/cloudbase')>('../../src/admin/lib/cloudbase')
  return {
    ...actual,
    callShopFunction,
  }
})

const baseMeta = () => ({
  success: true as const,
  executionTime: 5,
  timestamp: new Date().toISOString(),
})

const now = Date.now()
const product = {
  id: 'prod-1',
  title: 'Alpha',
  subtitle: 'Fresh',
  images: [{ fileId: 'img-1', url: 'https://example.com/a.jpg' }],
  category: 'groceries',
  price: { currency: 'CNY', priceYuan: 12.5 },
  stock: 3,
  isActive: true,
  createdAt: now,
  updatedAt: now,
}
const order = {
  id: 'order-1',
  userId: 'openid-1',
  items: [{ productId: 'prod-1', title: 'Alpha', qty: 1, priceYuan: 12.5 }],
  subtotalYuan: 12.5,
  shippingYuan: 0,
  discountYuan: 0,
  totalYuan: 12.5,
  status: 'pending' as const,
  createdAt: now,
  updatedAt: now,
}
const user = {
  id: 'user-1',
  openid: 'openid-1',
  roles: ['admin'],
  profile: { nickname: 'Alice', avatarUrl: 'https://example.com/avatar.png' },
  wallet: { currency: 'CNY', balanceYuan: 0, frozenYuan: 0 },
  createdAt: now,
  updatedAt: now,
}
const category = {
  id: 'cat-1',
  kind: 'category' as const,
  name: 'Snacks',
  slug: 'snacks',
  sort: 1,
  isActive: true,
  createdAt: now,
  updatedAt: now,
}
const coupon = {
  id: 'coupon-1',
  kind: 'coupon' as const,
  code: 'SAVE10',
  type: 'percent' as const,
  value: 10,
  minOrderYuan: 0,
  isActive: true,
  createdAt: now,
  updatedAt: now,
}
const banner = {
  id: 'banner-1',
  kind: 'banner' as const,
  imageUrl: 'https://example.com/banner.jpg',
  title: 'Hero',
  linkUrl: 'https://example.com/landing',
  sort: 1,
  isActive: true,
  createdAt: now,
  updatedAt: now,
}

describe('admin service layer', () => {
  beforeEach(() => {
    callShopFunction.mockReset()
  })

  describe('products', () => {
    it('lists products via the shop function', async () => {
      callShopFunction.mockResolvedValue({
        ...baseMeta(),
        action: 'v1.admin.products.list',
        products: [product],
      })

      const result = await listProducts()
      expect(result).toEqual([product])
      expect(callShopFunction).toHaveBeenCalledWith('v1.admin.products.list')
    })

    it('creates products with validated payloads', async () => {
      const input: ProductInput = {
        title: 'Beta',
        price: { currency: 'CNY', priceYuan: 9.9 },
        images: [{ fileId: 'img-2', url: 'https://example.com/b.jpg' }],
        stock: 2,
        isActive: true,
      }
      callShopFunction.mockResolvedValue({
        ...baseMeta(),
        action: 'v1.admin.products.create',
        product,
      })

      const created = await createProduct(input)
      expect(created).toEqual(product)
      expect(callShopFunction).toHaveBeenCalledWith('v1.admin.products.create', { product: input })
    })

    it('rejects invalid product input before hitting the API', async () => {
      const badInput = {
        title: '',
        price: { currency: 'CNY', priceYuan: -1 },
        stock: -5,
      } as unknown as ProductInput
      await expect(createProduct(badInput)).rejects.toThrow()
      expect(callShopFunction).not.toHaveBeenCalled()
    })

    it('updates and deletes products', async () => {
      callShopFunction.mockResolvedValueOnce({
        ...baseMeta(),
        action: 'v1.admin.products.update',
        product,
      })
      const updated = await updateProduct('prod-1', {
        title: 'Alpha',
        price: { currency: 'CNY', priceYuan: 12.5 },
        images: [{ fileId: 'img-1', url: 'https://example.com/a.jpg' }],
        stock: 3,
        isActive: true,
      })
      expect(updated.id).toBe('prod-1')
      expect(callShopFunction).toHaveBeenNthCalledWith(1, 'v1.admin.products.update', {
        productId: 'prod-1',
        product: {
          title: 'Alpha',
          price: { currency: 'CNY', priceYuan: 12.5 },
          images: [{ fileId: 'img-1', url: 'https://example.com/a.jpg' }],
          stock: 3,
          isActive: true,
        },
      })

      callShopFunction.mockResolvedValueOnce({
        ...baseMeta(),
        action: 'v1.admin.products.delete',
        productId: 'prod-1',
      })
      const removedId = await deleteProduct('prod-1')
      expect(removedId).toBe('prod-1')
      expect(callShopFunction).toHaveBeenLastCalledWith('v1.admin.products.delete', { productId: 'prod-1' })
    })

    it('raises when the response payload is invalid', async () => {
      callShopFunction.mockResolvedValue({
        ...baseMeta(),
        action: 'v1.admin.products.list',
        products: [{ ...product, price: { currency: 'CNY', priceYuan: -10 } }],
      })
      await expect(listProducts()).rejects.toThrow()
    })
  })

  describe('orders', () => {
    it('lists orders and updates status', async () => {
      callShopFunction.mockResolvedValueOnce({
        ...baseMeta(),
        action: 'v1.admin.orders.list',
        orders: [order],
      })
      const orders = await listOrders()
      expect(orders).toEqual([order])

      callShopFunction.mockResolvedValueOnce({
        ...baseMeta(),
        action: 'v1.admin.orders.updateStatus',
        order: { ...order, status: 'paid' },
      })
      const updated = await updateOrderStatus('order-1', 'paid')
      expect(updated.status).toBe('paid')
      expect(callShopFunction).toHaveBeenLastCalledWith('v1.admin.orders.updateStatus', {
        orderId: 'order-1',
        status: 'paid',
      })
    })
  })

  describe('users', () => {
    it('lists users from the cloud function', async () => {
      callShopFunction.mockResolvedValue({
        ...baseMeta(),
        action: 'v1.admin.users.list',
        users: [user],
      })
      const users = await listUsers()
      expect(users).toEqual([user])
    })
  })

  describe('system', () => {
    it('retrieves system overview data', async () => {
      callShopFunction.mockResolvedValueOnce({
        ...baseMeta(),
        action: 'v1.admin.system.list',
        categories: [category],
        coupons: [coupon],
        banners: [banner],
      })
      const overview = await listSystemItems()
      expect(overview.categories[0].slug).toBe('snacks')
      expect(overview.coupons[0].code).toBe('SAVE10')
      expect(overview.banners[0].id).toBe('banner-1')

      callShopFunction.mockResolvedValueOnce({
        ...baseMeta(),
        action: 'v1.system.ping',
        message: 'pong',
      })
      expect(await pingSystem()).toBe('pong')

      callShopFunction.mockResolvedValueOnce({
        ...baseMeta(),
        action: 'v1.admin.banners.save',
        banner,
      })
      const saved = await saveBanner({ id: 'banner-1', imageUrl: banner.imageUrl })
      expect(saved).toEqual(banner)

      callShopFunction.mockResolvedValueOnce({
        ...baseMeta(),
        action: 'v1.admin.banners.delete',
        bannerId: 'banner-1',
      })
      expect(await deleteBanner('banner-1')).toBe('banner-1')
    })
  })

  describe('dashboard', () => {
    it('parses dashboard summary data', async () => {
      callShopFunction.mockResolvedValue({
        ...baseMeta(),
        action: 'v1.admin.dashboard.summary',
        summary: {
          totalRevenueYuan: 30,
          totalOrders: 3,
          paidOrders: 2,
          pendingOrders: 1,
          customerCount: 2,
        },
        recentOrders: [order],
      })
      const { summary, recentOrders } = await fetchDashboardSummary()
      expect(summary.totalOrders).toBe(3)
      expect(recentOrders).toHaveLength(1)
    })
  })
})
