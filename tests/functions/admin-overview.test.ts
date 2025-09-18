import { beforeEach, describe, expect, it } from 'vitest'
import { importShop, testCloud } from './helpers/cloud'
import { Collections } from '@shared/collections'
import { nowMs } from '@shared/base'

const { main } = await importShop()

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
