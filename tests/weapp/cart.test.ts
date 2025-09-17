import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { loadCart, saveCart, addToCart, updateCartQuantity, removeFromCart, clearCart } from '../../src/weapp/utils/cart'

const STORAGE_KEY = 'tongmeng-plant:cart'
const storage = new Map<string, any>()

beforeAll(() => {
  ;(globalThis as any).wx = (globalThis as any).wx || {}
  ;(wx as any).getStorageSync = (key: string) => storage.get(key)
  ;(wx as any).setStorageSync = (key: string, value: any) => {
    storage.set(key, value)
  }
})

function getStorage(): any {
  return storage.get(STORAGE_KEY)
}

describe('cart utils', () => {
  beforeEach(() => {
    clearCart()
    storage.clear()
  })

  it('loads empty cart by default', () => {
    expect(loadCart()).toEqual([])
  })

  it('adds and updates items', () => {
    addToCart({ productId: 'p1', title: 'Product 1', price: 2.5 })
    let cart = loadCart()
    expect(cart).toHaveLength(1)
    expect(cart[0].productId).toBe('p1')
    expect(cart[0].qty).toBe(1)

    addToCart({ productId: 'p1', title: 'Product 1', price: 2.5 }, 2)
    cart = loadCart()
    expect(cart[0].qty).toBe(3)

    updateCartQuantity(cart[0].id, 5)
    cart = loadCart()
    expect(cart[0].qty).toBe(5)

    updateCartQuantity(cart[0].id, 0)
    cart = loadCart()
    expect(cart).toHaveLength(0)
  })

  it('removes items', () => {
    addToCart({ productId: 'p2', title: 'Another', price: 1.2 }, 2)
    let cart = loadCart()
    removeFromCart(cart[0].id)
    cart = loadCart()
    expect(cart).toHaveLength(0)
  })

  it('persists storage', () => {
    saveCart([{ id: 'p3', productId: 'p3', title: 'Stored', price: 9.9, qty: 1 }])
    const cart = loadCart()
    expect(cart[0].id).toBe('p3')
    expect(getStorage()).toBeTruthy()
  })

  it('treats different skus as separate items', () => {
    addToCart({ productId: 'p1', skuId: 'red', title: 'Product 1 (Red)', price: 3 })
    addToCart({ productId: 'p1', skuId: 'blue', title: 'Product 1 (Blue)', price: 4 })
    addToCart({ productId: 'p1', skuId: 'red', title: 'Product 1 (Red)', price: 3 })

    const cart = loadCart()
    expect(cart).toHaveLength(2)
    const redItem = cart.find((item) => item.skuId === 'red')
    const blueItem = cart.find((item) => item.skuId === 'blue')
    expect(redItem?.qty).toBe(2)
    expect(blueItem?.qty).toBe(1)
  })
})
