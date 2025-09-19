import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { importShop, testCloud } from './helpers/cloud'
import { Collections } from '@shared/collections'
import { nowMs } from '@shared/base'

const { main } = await importShop()

const originalAdminUuidAllow = process.env.SHOP_ADMIN_UUIDS

beforeAll(() => {
  process.env.SHOP_ADMIN_UUIDS = 'mock-admin'
})

afterAll(() => {
  if (originalAdminUuidAllow === undefined) delete process.env.SHOP_ADMIN_UUIDS
  else process.env.SHOP_ADMIN_UUIDS = originalAdminUuidAllow
})

beforeEach(() => {
  testCloud.reset()
})

describe('functions: admin overview', () => {
  it('rejects unauthenticated order queries', async () => {
    testCloud.setContext({ TCB_UUID: undefined, OPENID: undefined })
    const res = await main({ action: 'v1.admin.orders.list' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Not authenticated/)
  })

  it('rejects authenticated callers without admin role', async () => {
    const now = nowMs()
    const regularOpenid = 'regular-openid'
    testCloud.insert(Collections.Users, {
      openid: regularOpenid,
      roles: ['user'],
      profile: { nickname: 'Regular User', avatarUrl: '' },
      wallet: { currency: 'CNY', balanceYuan: 0, frozenYuan: 0 },
      createdAt: now,
      updatedAt: now,
    })
    testCloud.setContext({ OPENID: regularOpenid, TCB_UUID: undefined, TCB_CUSTOM_USER_ID: undefined })
    const res = await main({ action: 'v1.admin.orders.list' })
    expect(res.success).toBe(false)
    expect(res.error).toBe('Not authenticated')
  })

  it('rejects admin order status updates without authentication', async () => {
    testCloud.setContext({ TCB_UUID: undefined, OPENID: undefined })
    const res = await main({ action: 'v1.admin.orders.updateStatus', orderId: 'missing', status: 'paid' })
    expect(res.success).toBe(false)
    expect(res.error).toBe('Not authenticated')
  })

  it('fails admin order status update when the order does not exist', async () => {
    const res = await main({ action: 'v1.admin.orders.updateStatus', orderId: 'missing-order', status: 'paid' })
    expect(res.success).toBe(false)
    expect(res.error).toBe('Order not found')
  })

  it('lists orders sorted by createdAt desc', async () => {
    const now = nowMs()
    const firstId = testCloud.insert(Collections.Orders, {
      userId: 'u-1',
      items: [{ productId: 'p-1', title: 'Alpha', qty: 2, priceYuan: 19.5 }],
      subtotalYuan: 39,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 39,
      status: 'paid',
      createdAt: now - 5000,
      updatedAt: now - 4000,
    })
    const secondId = testCloud.insert(Collections.Orders, {
      userId: 'u-2',
      items: [{ productId: 'p-2', title: 'Bravo', qty: 1, priceYuan: 55 }],
      subtotalYuan: 55,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 55,
      status: 'pending',
      notes: 'Deliver ASAP',
      createdAt: now,
      updatedAt: now + 1000,
    })

    const res = await main({ action: 'v1.admin.orders.list' })
    expect(res.success).toBe(true)
    expect(res.orders).toHaveLength(2)
    expect(res.orders[0].id).toBe(secondId)
    expect(res.orders[1].id).toBe(firstId)
    expect(res.orders[0].items[0].title).toBe('Bravo')
  })

  it('returns dashboard summary metrics and recent orders', async () => {
    const now = nowMs()
    // Seed users
    testCloud.insert(Collections.Users, {
      openid: 'openid-1',
      roles: ['user'],
      profile: { nickname: 'Alice', avatarUrl: '' },
      wallet: { currency: 'CNY', balanceYuan: 10, frozenYuan: 0 },
      createdAt: now - 10000,
      updatedAt: now - 5000,
    })
    testCloud.insert(Collections.Users, {
      openid: 'openid-2',
      roles: ['user', 'admin'],
      profile: { nickname: 'Bob', avatarUrl: '' },
      wallet: { currency: 'CNY', balanceYuan: 20, frozenYuan: 0 },
      createdAt: now - 8000,
      updatedAt: now - 3000,
    })

    // Seed orders
    testCloud.insert(Collections.Orders, {
      userId: 'openid-1',
      items: [{ productId: 'p-1', title: 'Alpha', qty: 1, priceYuan: 40 }],
      subtotalYuan: 40,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 40,
      status: 'paid',
      createdAt: now - 4000,
      updatedAt: now - 3000,
    })
    testCloud.insert(Collections.Orders, {
      userId: 'openid-2',
      items: [{ productId: 'p-2', title: 'Beta', qty: 2, priceYuan: 30 }],
      subtotalYuan: 60,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 60,
      status: 'completed',
      createdAt: now - 2000,
      updatedAt: now - 1000,
    })
    const pendingId = testCloud.insert(Collections.Orders, {
      userId: 'openid-1',
      items: [{ productId: 'p-3', title: 'Gamma', qty: 1, priceYuan: 15 }],
      subtotalYuan: 15,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 15,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    const res = await main({ action: 'v1.admin.dashboard.summary' })
    expect(res.success).toBe(true)
    expect(res.summary.totalOrders).toBe(3)
    expect(res.summary.totalRevenueYuan).toBeCloseTo(100)
    expect(res.summary.pendingOrders).toBe(1)
    expect(res.summary.customerCount).toBe(2)
    expect(res.recentOrders[0].id).toBe(pendingId)
    expect(res.recentOrders).toHaveLength(3)
  })

  it('lists users for admin', async () => {
    const now = nowMs()
    const firstId = testCloud.insert(Collections.Users, {
      openid: 'openid-1',
      roles: ['user'],
      profile: { nickname: 'Alice', avatarUrl: '' },
      wallet: { currency: 'CNY', balanceYuan: 11, frozenYuan: 0 },
      createdAt: now - 3000,
      updatedAt: now - 2000,
    })
    const secondId = testCloud.insert(Collections.Users, {
      openid: 'openid-2',
      roles: ['user', 'admin'],
      profile: { nickname: 'Bob', avatarUrl: '' },
      wallet: { currency: 'CNY', balanceYuan: 22, frozenYuan: 0 },
      createdAt: now,
      updatedAt: now,
    })

    const res = await main({ action: 'v1.admin.users.list' })
    expect(res.success).toBe(true)
    expect(res.users).toHaveLength(2)
    expect(res.users[0].id).toBe(secondId)
    expect(res.users[1].id).toBe(firstId)
    expect(res.users[0].roles).toContain('admin')
  })

  it('lists system items grouped by kind', async () => {
    const now = nowMs()
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
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    testCloud.insert(Collections.System, {
      kind: 'banner',
      imageUrl: 'https://example.com/banner.jpg',
      title: 'Promo',
      sort: 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    })

    const res = await main({ action: 'v1.admin.system.list' })
    expect(res.success).toBe(true)
    expect(res.categories).toHaveLength(1)
    expect(res.coupons[0].code).toBe('SAVE10')
    expect(res.banners[0].isActive).toBe(false)
  })

  it('creates and updates banners via admin endpoint', async () => {
    const now = nowMs()
    const createRes = await main({
      action: 'v1.admin.banners.save',
      imageUrl: 'https://example.com/hero.jpg',
      title: 'Hero Banner',
      linkUrl: '/pages/promo/index',
      sort: 2,
      isActive: true,
      startAt: now - 1_000,
      endAt: now + 1_000,
    })

    expect(createRes.success).toBe(true)
    const bannerId = createRes.banner.id
    expect(bannerId).toBeDefined()
    const storedAfterCreate = testCloud
      .getData(Collections.System)
      .find((doc) => doc._id === bannerId)
    expect(storedAfterCreate?.kind).toBe('banner')
    expect(storedAfterCreate?.imageUrl).toBe('https://example.com/hero.jpg')
    expect(storedAfterCreate?.linkUrl).toBe('/pages/promo/index')

    const updateRes = await main({
      action: 'v1.admin.banners.save',
      id: bannerId,
      imageUrl: 'https://example.com/hero-updated.jpg',
      title: 'Updated Banner',
      sort: 5,
      isActive: false,
    })

    expect(updateRes.success).toBe(true)
    expect(updateRes.banner.title).toBe('Updated Banner')
    expect(updateRes.banner.linkUrl).toBe('/pages/promo/index')
    expect(updateRes.banner.isActive).toBe(false)

    const storedAfterUpdate = testCloud
      .getData(Collections.System)
      .find((doc) => doc._id === bannerId)
    expect(storedAfterUpdate?.imageUrl).toBe('https://example.com/hero-updated.jpg')
    expect(storedAfterUpdate?.linkUrl).toBe('/pages/promo/index')
    expect(storedAfterUpdate?.sort).toBe(5)
    expect(storedAfterUpdate?.updatedAt).toBeGreaterThan(storedAfterCreate?.updatedAt ?? 0)
  })

  it('rejects invalid banner inputs', async () => {
    const invalidLink = await main({
      action: 'v1.admin.banners.save',
      imageUrl: 'https://example.com/banner.jpg',
      linkUrl: 'ftp://invalid',
    })
    expect(invalidLink.success).toBe(false)
    expect(invalidLink.error).toBe('Invalid banner link')

    const invalidSchedule = await main({
      action: 'v1.admin.banners.save',
      imageUrl: 'https://example.com/banner.jpg',
      startAt: 2_000,
      endAt: 1_000,
    })
    expect(invalidSchedule.success).toBe(false)
    expect(invalidSchedule.error).toBe('Invalid schedule range')
  })

  it('deletes banners via admin endpoint', async () => {
    const createRes = await main({
      action: 'v1.admin.banners.save',
      imageUrl: 'https://example.com/delete.jpg',
      title: 'Delete Me',
    })
    const bannerId = createRes.banner.id
    const deleteRes = await main({ action: 'v1.admin.banners.delete', id: bannerId })
    expect(deleteRes.success).toBe(true)
    expect(deleteRes.bannerId).toBe(bannerId)
    const remaining = testCloud.getData(Collections.System).filter((doc) => doc.kind === 'banner')
    expect(remaining).toHaveLength(0)
  })

  it('creates, updates, and deletes categories via admin endpoint', async () => {
    const parentRes = await main({
      action: 'v1.admin.categories.save',
      name: 'Snacks',
      slug: 'snacks',
      sort: 2,
      imageUrl: 'https://example.com/snacks.jpg',
    })
    expect(parentRes.success).toBe(true)
    const parentId = parentRes.category.id

    const childRes = await main({
      action: 'v1.admin.categories.save',
      name: 'Chips',
      slug: 'chips',
      parentId,
    })
    expect(childRes.success).toBe(true)
    const childId = childRes.category.id

    const updateParent = await main({
      action: 'v1.admin.categories.save',
      id: parentId,
      name: 'Snack Foods',
      slug: 'snacks',
      description: 'Crunchy and tasty',
      isActive: false,
      sort: 5,
    })
    expect(updateParent.success).toBe(true)
    expect(updateParent.category.description).toBe('Crunchy and tasty')
    expect(updateParent.category.isActive).toBe(false)

    const storedParent = testCloud
      .getData(Collections.System)
      .find((doc) => doc._id === parentId)
    expect(storedParent?.name).toBe('Snack Foods')
    expect(storedParent?.description).toBe('Crunchy and tasty')

    const deleteParentWithChild = await main({ action: 'v1.admin.categories.delete', id: parentId })
    expect(deleteParentWithChild.success).toBe(false)
    expect(deleteParentWithChild.error).toBe('Category has child categories')

    const deleteChild = await main({ action: 'v1.admin.categories.delete', id: childId })
    expect(deleteChild.success).toBe(true)

    const deleteParent = await main({ action: 'v1.admin.categories.delete', id: parentId })
    expect(deleteParent.success).toBe(true)
    const remaining = testCloud.getData(Collections.System).filter((doc) => doc.kind === 'category')
    expect(remaining).toHaveLength(0)
  })

  it('prevents deleting categories when products reference them', async () => {
    const categoryRes = await main({
      action: 'v1.admin.categories.save',
      name: 'Produce',
      slug: 'produce',
    })
    const categoryId = categoryRes.category.id

    const now = nowMs()
    testCloud.insert(Collections.Products, {
      title: 'Tomato',
      images: [{ fileId: 'tomato', url: 'https://example.com/tomato.jpg' }],
      category: 'produce',
      price: { currency: 'CNY', priceYuan: 3.5 },
      stock: 10,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const deleteRes = await main({ action: 'v1.admin.categories.delete', id: categoryId })
    expect(deleteRes.success).toBe(false)
    expect(deleteRes.error).toBe('Category has products')
  })

  it('rejects banner saves without admin context', async () => {
    testCloud.setContext({ TCB_UUID: undefined, OPENID: undefined })
    const res = await main({ action: 'v1.admin.banners.save', imageUrl: 'https://example.com/no-admin.jpg' })
    expect(res.success).toBe(false)
    expect(res.error).toBe('Not authenticated')
  })

  it('allows admin to update order status following transition rules', async () => {
    const now = nowMs()
    const orderId = testCloud.insert(Collections.Orders, {
      userId: 'openid-1',
      items: [{ productId: 'p', title: 'Item', qty: 1, priceYuan: 10 }],
      subtotalYuan: 10,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 10,
      status: 'pending',
      payment: {
        method: 'wechat_pay',
        status: 'pending',
        amountYuan: 10,
        currency: 'CNY',
      },
      createdAt: now - 100,
      updatedAt: now - 50,
    })

    const res = await main({ action: 'v1.admin.orders.updateStatus', orderId, status: 'paid' })
    expect(res.success).toBe(true)
    expect(res.order.status).toBe('paid')
    expect(res.order.payment.status).toBe('succeeded')

    const stored = testCloud.getData(Collections.Orders).find((doc) => doc._id === orderId)
    expect(stored?.status).toBe('paid')
    expect(stored?.payment?.status).toBe('succeeded')
  })

  it('rejects invalid admin order status transitions', async () => {
    const now = nowMs()
    const orderId = testCloud.insert(Collections.Orders, {
      userId: 'openid-1',
      items: [{ productId: 'p', title: 'Item', qty: 1, priceYuan: 10 }],
      subtotalYuan: 10,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 10,
      status: 'completed',
      createdAt: now - 100,
      updatedAt: now - 50,
    })

    const res = await main({ action: 'v1.admin.orders.updateStatus', orderId, status: 'pending' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Invalid status transition/)
  })
})
