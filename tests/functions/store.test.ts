import { beforeEach, describe, expect, it } from 'vitest'
import { importShop, testCloud } from './helpers/cloud'
import { Collections } from '@shared/collections'
import { nowMs } from '@shared/base'

const { main } = await importShop()

beforeEach(() => {
  testCloud.reset()
})

describe('functions: store endpoints', () => {
  it('returns featured products sorted by updatedAt with active items', async () => {
    const now = nowMs()
    const firstId = testCloud.insert(Collections.Products, {
      title: 'Alpha Juice',
      subtitle: 'Freshly squeezed',
      description: 'Orange juice',
      images: [{ fileId: 'alpha-img', url: 'https://example.com/a.jpg' }],
      price: { currency: 'CNY', priceYuan: 15.5 },
      stock: 10,
      isActive: true,
      createdAt: now - 3000,
      updatedAt: now - 2000,
    })

    const secondId = testCloud.insert(Collections.Products, {
      title: 'Berry Mix',
      subtitle: 'Frozen berries',
      images: [{ fileId: 'berry-img', url: 'https://example.com/b.jpg' }],
      price: { currency: 'CNY', priceYuan: 28 },
      stock: 0,
      skus: [
        { skuId: 'pack-small', priceYuan: 18, stock: 2, isActive: true },
        { skuId: 'pack-large', priceYuan: 30, stock: 0, isActive: true },
      ],
      isActive: true,
      createdAt: now - 1000,
      updatedAt: now - 100,
    })

    testCloud.insert(Collections.Products, {
      title: 'Hidden Item',
      images: [{ fileId: 'hidden-img', url: 'https://example.com/h.jpg' }],
      price: { currency: 'CNY', priceYuan: 9.9 },
      stock: 5,
      isActive: false,
      createdAt: now - 500,
      updatedAt: now - 50,
    })

    const res = await main({ action: 'v1.store.home' })
    expect(res.success).toBe(true)
    expect(res.featuredProducts).toHaveLength(2)
    expect(res.featuredProducts[0].id).toBe(secondId)
    expect(res.featuredProducts[0].priceYuan).toBeCloseTo(18)
    expect(res.featuredProducts[0].hasStock).toBe(true)
    expect(res.featuredProducts[1].id).toBe(firstId)
    expect(res.featuredProducts[1].priceYuan).toBeCloseTo(15.5)
  })

  it('returns active categories grouped by parent', async () => {
    const now = nowMs()
    const freshId = testCloud.insert(Collections.System, {
      kind: 'category',
      name: 'Fresh',
      slug: 'fresh',
      sort: 2,
      isActive: true,
      createdAt: now - 2000,
      updatedAt: now - 1000,
    })
    const pantryId = testCloud.insert(Collections.System, {
      kind: 'category',
      name: 'Pantry',
      slug: 'pantry',
      sort: 1,
      isActive: true,
      createdAt: now - 3000,
      updatedAt: now - 1500,
    })
    testCloud.insert(Collections.System, {
      kind: 'category',
      name: 'Bananas',
      slug: 'bananas',
      parentId: freshId,
      sort: 1,
      isActive: true,
      createdAt: now - 1500,
      updatedAt: now - 1200,
    })
    testCloud.insert(Collections.System, {
      kind: 'category',
      name: 'Apples',
      slug: 'apples',
      parentId: freshId,
      sort: 2,
      isActive: true,
      createdAt: now - 1400,
      updatedAt: now - 1100,
    })
    testCloud.insert(Collections.System, {
      kind: 'category',
      name: 'Archived',
      slug: 'archived',
      sort: 0,
      isActive: false,
      createdAt: now - 1000,
      updatedAt: now - 900,
    })

    const res = await main({ action: 'v1.store.categories.list' })
    expect(res.success).toBe(true)
    expect(res.categories).toHaveLength(2)
    expect(res.categories[0].slug).toBe('pantry')
    expect(res.categories[1].slug).toBe('fresh')
    expect(res.categories[1].children.map((child: any) => child.slug)).toEqual(['bananas', 'apples'])
  })

  it('returns order counts for the current user', async () => {
    const now = nowMs()
    testCloud.setContext({ OPENID: 'user-1' })

    const common = {
      items: [{ productId: 'p', title: 'Item', qty: 1, priceYuan: 10 }],
      subtotalYuan: 10,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 10,
      createdAt: now - 1000,
      updatedAt: now - 500,
    }

    testCloud.insert(Collections.Orders, { ...common, userId: 'user-1', status: 'pending' })
    testCloud.insert(Collections.Orders, { ...common, userId: 'user-1', status: 'paid' })
    testCloud.insert(Collections.Orders, { ...common, userId: 'user-1', status: 'shipped' })
    testCloud.insert(Collections.Orders, { ...common, userId: 'user-1', status: 'refunded' })
    testCloud.insert(Collections.Orders, { ...common, userId: 'user-1', status: 'canceled' })
    testCloud.insert(Collections.Orders, { ...common, userId: 'user-2', status: 'pending' })

    const res = await main({ action: 'v1.store.profile.overview' })
    expect(res.success).toBe(true)
    expect(res.orderCounts.toPay).toBe(1)
    expect(res.orderCounts.toShip).toBe(1)
    expect(res.orderCounts.toReceive).toBe(1)
    expect(res.orderCounts.afterSale).toBe(2)
  })

  it('fails overview without OPENID context', async () => {
    testCloud.setContext({ OPENID: undefined })
    const res = await main({ action: 'v1.store.profile.overview' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Missing OPENID/)
  })
})
