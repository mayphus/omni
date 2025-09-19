import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Collections } from '@shared/collections'
import { nowMs } from '@shared/base'
import { importShop, testCloud } from './helpers/cloud'
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

describe('functions: products admin', () => {
  it('rejects unauthenticated calls', async () => {
    testCloud.setContext({ TCB_UUID: undefined, OPENID: undefined })
    const list = await main({ action: 'v1.admin.products.list' })
    expect(list.success).toBe(false)
    expect(list.error).toMatch(/Not authenticated/)

    const create = await main({
      action: 'v1.admin.products.create',
      product: {
        title: 'Test Product',
        price: { currency: 'CNY', priceYuan: 10 },
        stock: 5,
        isActive: true,
      },
    })
    expect(create.success).toBe(false)
    expect(create.error).toMatch(/Not authenticated/)
    testCloud.reset()
    expect(testCloud.getContext().TCB_UUID).toBeTruthy()
  })

  it('rejects authenticated users without admin role', async () => {
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
    const list = await main({ action: 'v1.admin.products.list' })
    expect(list.success).toBe(false)
    expect(list.error).toBe('Not authenticated')
  })

  it('creates a product and returns it in the list (sorted desc)', async () => {
    expect(testCloud.getContext().TCB_UUID).toBeTruthy()
    const first = await main({
      action: 'v1.admin.products.create',
      product: {
        title: 'Alpha',
        price: { currency: 'CNY', priceYuan: 12.5 },
        stock: 10,
        isActive: true,
      },
    })
    if (!first.success) throw new Error(`create failed: ${first.error}`)
    expect(first).toHaveProperty('product.id')

    const second = await main({
      action: 'v1.admin.products.create',
      product: {
        title: 'Bravo',
        price: { currency: 'CNY', priceYuan: 8.99 },
        stock: 3,
        isActive: false,
        images: [{ fileId: 'mock-file-a', url: 'https://example.com/a.jpg' }],
      },
    })
    if (!second.success) throw new Error(`create failed: ${second.error}`)

    const list = await main({ action: 'v1.admin.products.list' })
    expect(list.success).toBe(true)
    expect(list.products).toHaveLength(2)
    expect(list.products[0].title).toBe('Bravo')
    expect(list.products[1].title).toBe('Alpha')
    expect(list.products[0].createdAt).toBeTypeOf('number')
    expect(list.products[0].id).toBe(second.product.id)
  })

  it('updates an existing product', async () => {
    const create = await main({
      action: 'v1.admin.products.create',
      product: {
        title: 'Rocket',
        subtitle: 'V1',
        price: { currency: 'CNY', priceYuan: 15.75 },
        stock: 50,
        isActive: true,
        images: [{ fileId: 'rocket-base', url: 'https://example.com/rocket.png' }],
      },
    })
    if (!create.success) throw new Error(`create failed: ${create.error}`)
    const { product } = create
    const update = await main({
      action: 'v1.admin.products.update',
      productId: product.id,
      product: {
        title: 'Rocket Mk II',
        subtitle: 'V2',
        description: 'Upgraded model',
        richDescription: '<p>Now with boosters</p>',
        price: { currency: 'CNY', priceYuan: 18.5 },
        stock: 45,
        isActive: false,
        images: [
          { fileId: 'rocket-new', url: 'https://example.com/rocket-new.png' },
          { fileId: 'rocket-detail', url: 'https://example.com/rocket-detail.png' },
        ],
        skus: [
          { skuId: '  rocket-std  ', priceYuan: 18.5, stock: 10, isActive: true },
          { skuId: 'rocket-deluxe', priceYuan: 22.5, stock: 5, isActive: false },
        ],
      },
    })
    if (!update.success) throw new Error(`update failed: ${update.error}`)
    expect(update.product.title).toBe('Rocket Mk II')
    expect(update.product.isActive).toBe(false)
    expect(update.product.skus).toBeDefined()
    expect(update.product.skus).toHaveLength(2)
    expect(update.product.skus?.[0].skuId).toBe('rocket-std')
    expect(update.product.createdAt).toBe(product.createdAt)
    expect(update.product.updatedAt).toBeGreaterThan(product.updatedAt)

    const list = await main({ action: 'v1.admin.products.list' })
    if (!list.success) throw new Error(`list failed: ${list.error}`)
    expect(list.products[0].id).toBe(product.id)
    expect(list.products[0].title).toBe('Rocket Mk II')
    expect(list.products[0].images).toHaveLength(2)
  })

  it('deletes a product', async () => {
    const create = await main({
      action: 'v1.admin.products.create',
      product: {
        title: 'Disposable',
        price: { currency: 'CNY', priceYuan: 9.99 },
        stock: 2,
        isActive: true,
      },
    })
    if (!create.success) throw new Error(`create failed: ${create.error}`)
    const productId = create.product.id

    const deletion = await main({ action: 'v1.admin.products.delete', productId })
    expect(deletion.success).toBe(true)
    expect(deletion).toHaveProperty('productId', productId)

    const list = await main({ action: 'v1.admin.products.list' })
    if (!list.success) throw new Error(`list failed: ${list.error}`)
    expect(list.products.find((item) => item.id === productId)).toBeUndefined()
  })

  it('validates bad payloads', async () => {
    await expect(
      main({
        action: 'v1.admin.products.create',
        product: {
          title: '',
          price: { currency: 'CNY', priceYuan: -1 },
          stock: -5,
          isActive: true,
        },
      }),
    ).resolves.toMatchObject({ success: false })
  })
})
