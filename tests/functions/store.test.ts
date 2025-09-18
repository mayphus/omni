import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { importShop, testCloud } from './helpers/cloud'
import { Collections } from '@shared/collections'
import { nowMs } from '@shared/base'

const { main } = await importShop()

const originalEnv = {
  subMchId: process.env.WECHAT_PAY_SUB_MCH_ID,
  envId: process.env.WECHAT_PAY_ENV_ID,
  notify: process.env.WECHAT_PAY_NOTIFY_FUNCTION,
}

beforeAll(() => {
  process.env.WECHAT_PAY_SUB_MCH_ID = 'sub-mch-test'
  process.env.WECHAT_PAY_ENV_ID = 'env-test'
  process.env.WECHAT_PAY_NOTIFY_FUNCTION = 'shop'
})

afterAll(() => {
  if (originalEnv.subMchId === undefined) delete process.env.WECHAT_PAY_SUB_MCH_ID
  else process.env.WECHAT_PAY_SUB_MCH_ID = originalEnv.subMchId

  if (originalEnv.envId === undefined) delete process.env.WECHAT_PAY_ENV_ID
  else process.env.WECHAT_PAY_ENV_ID = originalEnv.envId

  if (originalEnv.notify === undefined) delete process.env.WECHAT_PAY_NOTIFY_FUNCTION
  else process.env.WECHAT_PAY_NOTIFY_FUNCTION = originalEnv.notify
})

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
      category: 'beverages',
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
      category: 'beverages',
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
      category: 'beverages',
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

    const commonProduct = {
      images: [{ fileId: 'img', url: 'https://example.com/img.jpg' }],
      price: { currency: 'CNY', priceYuan: 10 },
      stock: 5,
      isActive: true,
      createdAt: now - 500,
      updatedAt: now - 100,
    }
    testCloud.insert(Collections.Products, {
      title: 'Pantry Staples',
      category: 'pantry',
      ...commonProduct,
    })
    testCloud.insert(Collections.Products, {
      title: 'Bananas Bunch',
      category: 'bananas',
      ...commonProduct,
    })
    testCloud.insert(Collections.Products, {
      title: 'Red Apples',
      category: 'apples',
      ...commonProduct,
    })

    const res = await main({ action: 'v1.store.categories.list' })
    expect(res.success).toBe(true)
    expect(res.categories).toHaveLength(2)
    expect(res.categories[0].slug).toBe('pantry')
    expect(res.categories[1].slug).toBe('fresh')
    expect(res.categories[1].children.map((child: any) => child.slug)).toEqual(['bananas', 'apples'])
  })

  it('skips invalid category documents instead of failing', async () => {
    const now = nowMs()
    testCloud.insert(Collections.System, {
      kind: 'category',
      name: 'Valid Category',
      slug: 'valid',
      isActive: true,
      createdAt: now - 2000,
      updatedAt: now - 1000,
    })

    testCloud.insert(Collections.System, {
      kind: 'category',
      name: 'Broken Category',
      // Intentionally invalid slug to trigger safeParse failure
      slug: 123 as any,
      isActive: true,
      createdAt: now - 1500,
      updatedAt: now - 500,
    })

    testCloud.insert(Collections.Products, {
      title: 'Valid Product',
      category: 'valid',
      images: [{ fileId: 'valid', url: 'https://example.com/valid.jpg' }],
      price: { currency: 'CNY', priceYuan: 12 },
      stock: 3,
      isActive: true,
      createdAt: now - 600,
      updatedAt: now - 100,
    })

    const res = await main({ action: 'v1.store.categories.list' })
    expect(res.success).toBe(true)
    expect(res.categories).toHaveLength(1)
    expect(res.categories[0].slug).toBe('valid')
  })

  it('creates fallback categories for products missing system metadata', async () => {
    const now = nowMs()
    testCloud.insert(Collections.Products, {
      title: 'Special Sauce',
      category: 'sauces',
      images: [{ fileId: 'sauce', url: 'https://example.com/sauce.jpg' }],
      price: { currency: 'CNY', priceYuan: 18 },
      stock: 2,
      isActive: true,
      createdAt: now - 300,
      updatedAt: now - 100,
    })

    const res = await main({ action: 'v1.store.categories.list' })
    expect(res.success).toBe(true)
    expect(res.categories).toHaveLength(1)
    expect(res.categories[0].slug).toBe('sauces')
    expect(res.categories[0].children).toHaveLength(0)
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

  it('searches products by keyword', async () => {
    const now = nowMs()
    testCloud.insert(Collections.Products, {
      title: 'Organic Honey',
      subtitle: 'Sweet and natural',
      description: 'Harvested locally',
      images: [{ fileId: 'honey', url: 'https://example.com/honey.jpg' }],
      category: 'pantry',
      price: { currency: 'CNY', priceYuan: 25 },
      stock: 4,
      isActive: true,
      createdAt: now - 200,
      updatedAt: now - 100,
    })
    testCloud.insert(Collections.Products, {
      title: 'Sea Salt',
      images: [{ fileId: 'salt', url: 'https://example.com/salt.jpg' }],
      category: 'pantry',
      price: { currency: 'CNY', priceYuan: 5 },
      stock: 10,
      isActive: true,
      createdAt: now - 300,
      updatedAt: now - 250,
    })

    const res = await main({ action: 'v1.store.products.search', keyword: 'honey' })
    expect(res.success).toBe(true)
    expect(res.products).toHaveLength(1)
    expect(res.products[0].title).toBe('Organic Honey')
  })

  it('searches across multiple pages of products', async () => {
    const now = nowMs()
    for (let index = 0; index < 120; index += 1) {
      testCloud.insert(Collections.Products, {
        title: `Staple ${index}`,
        subtitle: `Stock item ${index}`,
        description: 'Bulk supply',
        images: [{ fileId: `staple-${index}`, url: `https://example.com/staple-${index}.jpg` }],
        category: 'pantry',
        price: { currency: 'CNY', priceYuan: 10 + index },
        stock: 20,
        isActive: true,
        createdAt: now + index,
        updatedAt: now + index,
      })
    }

    testCloud.insert(Collections.Products, {
      title: 'Herbal Tea Blend',
      subtitle: 'Relaxing infusion',
      description: 'Calming herbs for evening routines',
      images: [{ fileId: 'tea', url: 'https://example.com/tea.jpg' }],
      category: 'beverages',
      price: { currency: 'CNY', priceYuan: 48 },
      stock: 3,
      isActive: true,
      createdAt: now - 5000,
      updatedAt: now - 5000,
    })

    const res = await main({ action: 'v1.store.products.search', keyword: 'herbal' })
    expect(res.success).toBe(true)
    expect(res.products).toHaveLength(1)
    expect(res.products[0].title).toBe('Herbal Tea Blend')
  })

  it('lists products by category slug', async () => {
    const now = nowMs()
    const vegId = testCloud.insert(Collections.Products, {
      title: 'Fresh Carrots',
      images: [{ fileId: 'carrot', url: 'https://example.com/carrot.jpg' }],
      category: 'produce',
      price: { currency: 'CNY', priceYuan: 6 },
      stock: 12,
      isActive: true,
      createdAt: now - 400,
      updatedAt: now - 300,
    })
    testCloud.insert(Collections.Products, {
      title: 'Kitchen Towels',
      images: [{ fileId: 'towel', url: 'https://example.com/towel.jpg' }],
      category: 'household',
      price: { currency: 'CNY', priceYuan: 12 },
      stock: 5,
      isActive: true,
      createdAt: now - 200,
      updatedAt: now - 150,
    })

    const res = await main({ action: 'v1.store.products.byCategory', category: 'produce' })
    expect(res.success).toBe(true)
    expect(res.products).toHaveLength(1)
    expect(res.products[0].id).toBe(vegId)
  })

  it('returns product detail by id', async () => {
    const now = nowMs()
    const insertedId = testCloud.insert(Collections.Products, {
      title: 'Matcha Latte',
      images: [{ fileId: 'matcha', url: 'https://example.com/matcha.jpg' }],
      category: 'beverages',
      price: { currency: 'CNY', priceYuan: 18.5 },
      stock: 6,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const res = await main({ action: 'v1.store.product.detail', productId: insertedId })
    expect(res.success).toBe(true)
    expect(res.product.title).toBe('Matcha Latte')

    const missing = await main({ action: 'v1.store.product.detail', productId: 'missing-id' })
    expect(missing.success).toBe(false)
    expect(missing.error).toMatch(/not found/i)
  })

  it('lists user orders with status filter', async () => {
    const now = nowMs()
    testCloud.setContext({ OPENID: 'customer-1' })
    const common = {
      items: [{ productId: 'p', title: 'Item', qty: 1, priceYuan: 10 }],
      subtotalYuan: 10,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 10,
      createdAt: now - 100,
      updatedAt: now - 50,
    }
    testCloud.insert(Collections.Orders, { ...common, userId: 'customer-1', status: 'paid' })
    testCloud.insert(Collections.Orders, { ...common, userId: 'customer-1', status: 'pending', createdAt: now - 80, updatedAt: now - 40 })

    const listAll = await main({ action: 'v1.store.orders.list' })
    expect(listAll.success).toBe(true)
    expect(listAll.orders).toHaveLength(2)

    const filtered = await main({ action: 'v1.store.orders.list', status: 'pending' })
    expect(filtered.success).toBe(true)
    expect(filtered.orders).toHaveLength(1)
    expect(filtered.orders[0].status).toBe('pending')
  })

  it('requires login for order listing', async () => {
    testCloud.setContext({ OPENID: undefined })
    const res = await main({ action: 'v1.store.orders.list' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Missing OPENID/)
  })

  it('creates order from cart payload', async () => {
    const now = nowMs()
    testCloud.setContext({ OPENID: 'buyer-1' })
    const productId = testCloud.insert(Collections.Products, {
      title: 'Notebook',
      images: [{ fileId: 'notebook', url: 'https://example.com/notebook.jpg' }],
      category: 'stationery',
      price: { currency: 'CNY', priceYuan: 12.5 },
      stock: 20,
      isActive: true,
      createdAt: now - 50,
      updatedAt: now - 25,
    })

    const res = await main({
      action: 'v1.store.order.create',
      items: [
        { productId, quantity: 2 },
        { productId, quantity: 1 },
      ],
      notes: 'Leave at door',
      address: { contact: 'Tester', phone: '1234567890', detail: 'No.1 Road' },
    })

    expect(res.success).toBe(true)
    expect(res.order.items).toHaveLength(1)
    expect(res.order.items[0]).toMatchObject({ productId, qty: 3, priceYuan: 12.5 })
    expect(res.order.totalYuan).toBeCloseTo(37.5)

    const stored = testCloud.getData(Collections.Orders)
    expect(stored).toHaveLength(1)
    expect(stored[0].userId).toBe('buyer-1')
  })

  it('keeps different skus separate in orders', async () => {
    const now = nowMs()
    testCloud.setContext({ OPENID: 'buyer-2' })
    const productId = testCloud.insert(Collections.Products, {
      title: 'Tea Blend',
      images: [{ fileId: 'tea', url: 'https://example.com/tea.jpg' }],
      category: 'grocery',
      price: { currency: 'CNY', priceYuan: 20 },
      stock: 0,
      skus: [
        { skuId: 'small', priceYuan: 10, stock: 5, isActive: true },
        { skuId: 'large', priceYuan: 15, stock: 3, isActive: true },
      ],
      isActive: true,
      createdAt: now - 50,
      updatedAt: now - 25,
    })

    const res = await main({
      action: 'v1.store.order.create',
      items: [
        { productId, skuId: 'small', quantity: 1 },
        { productId, skuId: 'large', quantity: 2 },
      ],
    })

    expect(res.success).toBe(true)
    expect(res.order.items).toHaveLength(2)
    const small = res.order.items.find((item: any) => item.skuId === 'small')
    const large = res.order.items.find((item: any) => item.skuId === 'large')
    expect(small).toMatchObject({ productId, qty: 1, priceYuan: 10 })
    expect(large).toMatchObject({ productId, qty: 2, priceYuan: 15 })
    expect(res.order.totalYuan).toBeCloseTo(40)
  })

  it('rejects invalid order payloads', async () => {
    testCloud.setContext({ OPENID: 'buyer-2' })
    const res = await main({ action: 'v1.store.order.create', items: [] })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Invalid order payload/)
  })

  it('requires login for order creation', async () => {
    testCloud.setContext({ OPENID: undefined })
    const res = await main({ action: 'v1.store.order.create', items: [{ productId: 'p', quantity: 1 }] })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Missing OPENID/)
  })

  it('prepares payment for a pending order', async () => {
    const now = nowMs()
    testCloud.setContext({ OPENID: 'buyer-pay' })
    const productId = testCloud.insert(Collections.Products, {
      title: 'Payment Widget',
      images: [{ fileId: 'pay', url: 'https://example.com/pay.jpg' }],
      category: 'gadgets',
      price: { currency: 'CNY', priceYuan: 42.5 },
      stock: 5,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const createRes = await main({
      action: 'v1.store.order.create',
      items: [{ productId, quantity: 1 }],
    })
    expect(createRes.success).toBe(true)
    const orderId = createRes.order.id

    const prepareRes = await main({ action: 'v1.store.order.payment.prepare', orderId })
    expect(prepareRes.success).toBe(true)
    expect(prepareRes.payment.status).toBe('ready')
    expect(prepareRes.payment.prepayId).toMatch(/prepay-/)
    expect(prepareRes.paymentPackage.package).toContain('prepay_id')

    const stored = testCloud.getData(Collections.Orders).find((doc) => doc._id === orderId)
    expect(stored?.payment?.status).toBe('ready')
    expect(stored?.payment?.outTradeNo).toBeDefined()
  })

  it('confirms payment and marks order as paid', async () => {
    const now = nowMs()
    testCloud.setContext({ OPENID: 'buyer-confirm' })
    const productId = testCloud.insert(Collections.Products, {
      title: 'Confirmation Item',
      images: [{ fileId: 'confirm', url: 'https://example.com/confirm.jpg' }],
      category: 'gadgets',
      price: { currency: 'CNY', priceYuan: 18 },
      stock: 5,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const createRes = await main({
      action: 'v1.store.order.create',
      items: [{ productId, quantity: 2 }],
    })
    const orderId = createRes.order.id
    await main({ action: 'v1.store.order.payment.prepare', orderId })

    const confirmRes = await main({ action: 'v1.store.order.payment.confirm', orderId })
    expect(confirmRes.success).toBe(true)
    expect(confirmRes.order.status).toBe('paid')
    expect(confirmRes.order.payment.status).toBe('succeeded')
    expect(confirmRes.order.payment.transactionId).toMatch(/txn-/)

    const stored = testCloud.getData(Collections.Orders).find((doc) => doc._id === orderId)
    expect(stored?.status).toBe('paid')
    expect(stored?.payment?.status).toBe('succeeded')
  })

  it('keeps order pending when payment query is not successful', async () => {
    const now = nowMs()
    testCloud.setContext({ OPENID: 'buyer-fail' })
    const productId = testCloud.insert(Collections.Products, {
      title: 'Pending Item',
      images: [{ fileId: 'pending', url: 'https://example.com/pending.jpg' }],
      category: 'gadgets',
      price: { currency: 'CNY', priceYuan: 10 },
      stock: 5,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const createRes = await main({
      action: 'v1.store.order.create',
      items: [{ productId, quantity: 1 }],
    })
    const orderId = createRes.order.id
    await main({ action: 'v1.store.order.payment.prepare', orderId })

    testCloud.mockCloudPay({
      queryOrder: async () => ({
        tradeState: 'NOTPAY',
        resultCode: 'SUCCESS',
        returnCode: 'SUCCESS',
        totalFee: 1000,
      }),
    })

    const confirmRes = await main({ action: 'v1.store.order.payment.confirm', orderId })
    expect(confirmRes.success).toBe(false)
    expect(confirmRes.error).toMatch(/pending/i)

    const stored = testCloud.getData(Collections.Orders).find((doc) => doc._id === orderId)
    expect(stored?.status).toBe('pending')
    expect(stored?.payment?.status).toBe('ready')
  })
})
