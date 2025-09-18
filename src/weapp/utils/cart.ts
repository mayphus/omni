export type CartItem = {
  id: string
  productId: string
  skuId?: string
  title: string
  price: number
  imageUrl?: string
  qty: number
}

const STORAGE_KEY = 'tongmeng-plant:cart'
const DIRECT_CHECKOUT_KEY = 'tongmeng-plant:checkout:direct'

export function getCartItemId(productId: string, skuId?: string): string {
  return skuId ? `${productId}__${skuId}` : productId
}

export function loadCart(): CartItem[] {
  return readItems(STORAGE_KEY)
}

export function saveCart(items: CartItem[]): void {
  writeItems(STORAGE_KEY, items)
}

export function loadDirectCheckout(): CartItem[] {
  return readItems(DIRECT_CHECKOUT_KEY)
}

export function saveDirectCheckout(items: CartItem[]): void {
  writeItems(DIRECT_CHECKOUT_KEY, items)
}

export function clearDirectCheckout(): void {
  try {
    wx.removeStorageSync(DIRECT_CHECKOUT_KEY)
  } catch {}
}

function readItems(key: string): CartItem[] {
  try {
    const stored = wx.getStorageSync(key) as CartItem[] | undefined
    if (Array.isArray(stored)) {
      const normalized = stored
        .map((entry) => normalizeCartEntry(entry))
        .filter((item): item is CartItem => !!item)
      const deduped = new Map<string, CartItem>()
      for (const item of normalized) {
        deduped.set(item.id, item)
      }
      return Array.from(deduped.values())
    }
  } catch {}
  return []
}

function writeItems(key: string, items: CartItem[]): void {
  try {
    wx.setStorageSync(key, items)
  } catch {}
}

export function addToCart(
  item: { productId: string; skuId?: string; title: string; price: number; imageUrl?: string },
  qty: number = 1,
): CartItem[] {
  const productId = typeof item.productId === 'string' ? item.productId.trim() : ''
  if (!productId) return loadCart()
  const skuId = typeof item.skuId === 'string' && item.skuId.trim() ? item.skuId.trim() : undefined
  const sanitizedQty = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) || 1 : 1
  const cartId = getCartItemId(productId, skuId)
  const cart = loadCart()
  const index = cart.findIndex((entry) => entry.id === cartId)
  if (index >= 0) {
    cart[index].qty += sanitizedQty
  } else {
    cart.push({
      id: cartId,
      productId,
      skuId,
      title: item.title,
      price: sanitizePrice(item.price),
      imageUrl: item.imageUrl,
      qty: sanitizedQty,
    })
  }
  saveCart(cart)
  return cart
}

export function updateCartQuantity(id: string, qty: number): CartItem[] {
  const cart = loadCart()
  const index = cart.findIndex((entry) => entry.id === id)
  if (index >= 0) {
    if (qty <= 0) {
      cart.splice(index, 1)
    } else {
      const sanitizedQty = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) || 1 : 1
      cart[index].qty = sanitizedQty
    }
    saveCart(cart)
  }
  return cart
}

export function removeFromCart(id: string): CartItem[] {
  return updateCartQuantity(id, 0)
}

export function clearCart(): void {
  saveCart([])
}

function sanitizePrice(price: number): number {
  if (typeof price !== 'number' || !Number.isFinite(price)) return 0
  return Math.round(price * 100) / 100
}

function normalizeCartEntry(entry: any): CartItem | null {
  if (!entry) return null
  const rawProductId = typeof entry.productId === 'string' ? entry.productId.trim() : typeof entry.id === 'string' ? entry.id.trim() : ''
  if (!rawProductId) return null
  const rawSkuId = typeof entry.skuId === 'string' ? entry.skuId.trim() : undefined
  const skuId = rawSkuId || undefined
  const id = getCartItemId(rawProductId, skuId)
  const qtyValue = Number(entry.qty)
  const qty = Number.isFinite(qtyValue) && qtyValue > 0 ? Math.floor(qtyValue) || 1 : 1
  const priceValue = Number(entry.price)
  const price = Number.isFinite(priceValue) ? sanitizePrice(priceValue) : 0
  const title = typeof entry.title === 'string' ? entry.title : ''
  const imageUrl = typeof entry.imageUrl === 'string' && entry.imageUrl.trim() ? entry.imageUrl : undefined
  return {
    id,
    productId: rawProductId,
    skuId,
    title,
    price,
    imageUrl,
    qty,
  }
}
