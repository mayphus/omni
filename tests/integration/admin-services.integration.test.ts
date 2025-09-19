import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Collections } from '@shared/collections'
import { importShop, testCloud } from '../functions/helpers/cloud'

const { main } = await importShop()

const callShopSpy = vi.fn(async (action: string, payload: Record<string, unknown> = {}) => {
  const result = await main({ action, ...payload })
  if (!result || result.success !== true) {
    const message = (result as any)?.error || 'Cloud function request failed'
    throw new Error(message)
  }
  return result
})

vi.mock('../../src/admin/lib/cloudbase', async () => {
  const actual = await vi.importActual<typeof import('../../src/admin/lib/cloudbase')>('../../src/admin/lib/cloudbase')
  return {
    ...actual,
    callShopFunction: callShopSpy,
  }
})

const { listProducts, createProduct, updateProduct, deleteProduct } = await import('../../src/admin/services/products')
const { listOrders, updateOrderStatus } = await import('../../src/admin/services/orders')
const { listUsers } = await import('../../src/admin/services/users')
const { listSystemItems, saveBanner, deleteBanner, pingSystem } = await import('../../src/admin/services/system')
const { fetchDashboardSummary } = await import('../../src/admin/services/dashboard')

const now = Date.now()

describe('admin services integration', () => {
  const originalAdminUuidAllow = process.env.SHOP_ADMIN_UUIDS

  beforeAll(() => {
    process.env.SHOP_ADMIN_UUIDS = 'admin-uuid'
  })

  afterAll(() => {
    if (originalAdminUuidAllow === undefined) delete process.env.SHOP_ADMIN_UUIDS
    else process.env.SHOP_ADMIN_UUIDS = originalAdminUuidAllow
  })

  beforeEach(() => {
    testCloud.reset()
    callShopSpy.mockClear()
    testCloud.setContext({ OPENID: 'admin-openid', TCB_UUID: 'admin-uuid' })
    testCloud.insert(Collections.Users, {
      openid: 'admin-openid',
      roles: ['user', 'admin'],
      profile: { nickname: 'Integration Admin', avatarUrl: '' },
      wallet: { currency: 'CNY', balanceYuan: 0, frozenYuan: 0 },
      createdAt: now,
      updatedAt: now,
    })
  })

  it('round-trips product CRUD through the cloud function', async () => {
    const created = await createProduct({
      title: 'Integration Alpha',
      price: { currency: 'CNY', priceYuan: 28.5 },
      images: [{ fileId: 'alpha', url: 'https://example.com/alpha.jpg' }],
      stock: 8,
      isActive: true,
    })
    expect(created.title).toBe('Integration Alpha')

    const updated = await updateProduct(created.id, {
      title: 'Integration Alpha+',
      price: { currency: 'CNY', priceYuan: 30 },
      images: [{ fileId: 'alpha', url: 'https://example.com/alpha.jpg' }],
      stock: 10,
      isActive: true,
    })
    expect(updated.title).toBe('Integration Alpha+')
    expect(updated.updatedAt).toBeGreaterThanOrEqual(created.updatedAt)

    const listed = await listProducts()
    expect(listed.map((item) => item.id)).toContain(updated.id)

    await deleteProduct(created.id)
    const afterDelete = await listProducts()
    expect(afterDelete.find((item) => item.id === created.id)).toBeUndefined()
  })

  it('lists orders and applies status transitions', async () => {
    const orderId = testCloud.insert(Collections.Orders, {
      userId: 'buyer-1',
      items: [{ productId: 'prod-1', title: 'Integration Item', qty: 1, priceYuan: 19.9 }],
      subtotalYuan: 19.9,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 19.9,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    const orders = await listOrders()
    expect(orders.find((item) => item.id === orderId)).toBeDefined()

    const updated = await updateOrderStatus(orderId, 'paid')
    expect(updated.status).toBe('paid')
    const stored = testCloud.getData(Collections.Orders).find((doc) => doc._id === orderId)
    expect(stored?.status).toBe('paid')
  })

  it('aggregates dashboard statistics from live data', async () => {
    testCloud.insert(Collections.Users, {
      openid: 'openid-1',
      roles: ['user'],
      profile: { nickname: 'Alice', avatarUrl: 'https://example.com/a.png' },
      wallet: { currency: 'CNY', balanceYuan: 0, frozenYuan: 0 },
      createdAt: now - 2000,
      updatedAt: now - 1000,
    })
    testCloud.insert(Collections.Users, {
      openid: 'openid-2',
      roles: ['admin'],
      profile: { nickname: 'Bob', avatarUrl: 'https://example.com/b.png' },
      wallet: { currency: 'CNY', balanceYuan: 0, frozenYuan: 0 },
      createdAt: now - 1000,
      updatedAt: now - 500,
    })
    testCloud.insert(Collections.Orders, {
      userId: 'openid-1',
      items: [{ productId: 'prod-1', title: 'Item A', qty: 1, priceYuan: 10 }],
      subtotalYuan: 10,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 10,
      status: 'paid',
      createdAt: now - 1500,
      updatedAt: now - 1200,
    })
    testCloud.insert(Collections.Orders, {
      userId: 'openid-2',
      items: [{ productId: 'prod-2', title: 'Item B', qty: 2, priceYuan: 15 }],
      subtotalYuan: 30,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 30,
      status: 'pending',
      createdAt: now - 500,
      updatedAt: now - 300,
    })

    const { summary, recentOrders } = await fetchDashboardSummary()
    expect(summary.totalOrders).toBeGreaterThanOrEqual(2)
    expect(summary.pendingOrders).toBeGreaterThanOrEqual(1)
    expect(summary.customerCount).toBeGreaterThanOrEqual(2)
    expect(recentOrders.length).toBeGreaterThan(0)
  })

  it('retrieves system inventories and supports banner mutations', async () => {
    testCloud.insert(Collections.System, {
      kind: 'category',
      name: 'Fruits',
      slug: 'fruits',
      sort: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    testCloud.insert(Collections.System, {
      kind: 'coupon',
      code: 'SAVE10',
      type: 'percent',
      value: 10,
      minOrderYuan: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    testCloud.insert(Collections.Products, {
      title: 'Fruit Box',
      category: 'fruits',
      images: [{ fileId: 'fruit', url: 'https://example.com/fruit.jpg' }],
      price: { currency: 'CNY', priceYuan: 20 },
      stock: 5,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const overview = await listSystemItems()
    expect(overview.categories.length).toBe(1)
    expect(overview.coupons[0].code).toBe('SAVE10')

    const saved = await saveBanner({ imageUrl: 'https://example.com/banner.jpg', title: 'Banner' })
    expect(saved.id).toBeDefined()

    const deletedId = await deleteBanner(saved.id)
    expect(deletedId).toBe(saved.id)

    expect(await pingSystem()).toBe('pong')
  })

  it('lists users through the admin endpoint', async () => {
    const userId = testCloud.insert(Collections.Users, {
      openid: 'openid-3',
      roles: ['admin'],
      profile: { nickname: 'Charlie', avatarUrl: 'https://example.com/c.png' },
      wallet: { currency: 'CNY', balanceYuan: 0, frozenYuan: 0 },
      createdAt: now,
      updatedAt: now,
    })

    const users = await listUsers()
    expect(users.find((u) => u.id === userId)).toBeDefined()
  })
})
