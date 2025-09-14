import { describe, it, expect } from 'vitest'
import { zUser, type User, nowMs, fromServer, toServer, zProduct, zOrder } from '../../src/shared'

describe('shared models', () => {
  it('validates a user and maps ids', () => {
    const base = { createdAt: nowMs(), updatedAt: nowMs() }
    const sample: User = {
      provider: 'wechat',
      openid: 'OPENID',
      unionid: undefined,
      roles: ['user'],
      profile: { nickname: 'T', avatarUrl: '' },
      referrerId: undefined,
      referralCode: undefined,
      wallet: { currency: 'CNY', balanceYuan: 0, frozenYuan: 0 },
      ...base,
    }
    const parsed = zUser.parse(sample)
    expect(parsed.openid).toBe('OPENID')

    const serverDoc = toServer({ id: 'abc', ...sample })
    expect((serverDoc as any)._id).toBe('abc')
    const clientDoc = fromServer(serverDoc)
    expect((clientDoc as any).id).toBe('abc')
  })

  it('validates a product and an order', () => {
    const base = { createdAt: nowMs(), updatedAt: nowMs() }
    const product = zProduct.parse({
      title: 'Toy',
      price: { currency: 'CNY', priceYuan: 10 },
      images: [],
      stock: 10,
      isActive: true,
      ...base,
    })
    expect(product.title).toBe('Toy')

    const order = zOrder.parse({
      userId: 'u1',
      items: [
        { productId: 'p1', title: 'Toy', qty: 1, priceYuan: 10 },
      ],
      subtotalYuan: 10,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: 10,
      status: 'pending',
      ...base,
    })
    expect(order.totalYuan).toBe(10)
  })
})
