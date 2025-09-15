import { beforeEach, describe, expect, it } from 'vitest'
import { importShop, testCloud } from './helpers/cloud'
const { main } = await importShop()

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
        images: ['https://example.com/a.jpg'],
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
