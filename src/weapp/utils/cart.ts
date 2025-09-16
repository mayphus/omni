export type CartItem = {
  id: string
  title: string
  price: number
  imageUrl?: string
  qty: number
}

const STORAGE_KEY = 'tongmeng-plant:cart'

export function loadCart(): CartItem[] {
  try {
    const stored = wx.getStorageSync(STORAGE_KEY) as CartItem[] | undefined
    if (Array.isArray(stored)) {
      return stored.filter((item) => typeof item?.id === 'string' && typeof item?.qty === 'number')
    }
  } catch {}
  return []
}

export function saveCart(items: CartItem[]): void {
  try {
    wx.setStorageSync(STORAGE_KEY, items)
  } catch {}
}

export function addToCart(item: { id: string; title: string; price: number; imageUrl?: string }, qty: number = 1): CartItem[] {
  const sanitizedQty = qty > 0 ? qty : 1
  const cart = loadCart()
  const index = cart.findIndex((entry) => entry.id === item.id)
  if (index >= 0) {
    cart[index].qty += sanitizedQty
  } else {
    cart.push({ id: item.id, title: item.title, price: item.price, imageUrl: item.imageUrl, qty: sanitizedQty })
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
      cart[index].qty = qty
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
