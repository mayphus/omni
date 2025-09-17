import { loadCart, clearCart, type CartItem } from '../../utils/cart'
import { createStoreOrder } from '../../utils/api'
import { withI18nPage } from '../../utils/i18n'

type DisplayCartItem = CartItem & { totalText: string }

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}

Page(withI18nPage({
  data: {
    items: [] as DisplayCartItem[],
    subtotal: 0,
    shipping: 0,
    total: 0,
    subtotalText: '0.00',
    totalText: '0.00',
    submitting: false,
  },

  onShow() {
    const items = loadCart()
    const subtotal = calculateSubtotal(items)
    const displayItems = items.map((item) => ({ ...item, totalText: (item.price * item.qty).toFixed(2) }))
    this.setData({
      items: displayItems,
      subtotal,
      shipping: 0,
      total: subtotal,
      subtotalText: subtotal.toFixed(2),
      totalText: subtotal.toFixed(2),
    })
  },

  onGoShopping() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  async onSubmit() {
    if ((this.data as any).submitting) return
    const items = (this.data as any).items as DisplayCartItem[]
    const i18n = (this.data as any).i18n || {}
    if (!items.length) {
      wx.showToast({ title: i18n.emptyToast || 'Cart is empty', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    try {
      const payload = {
        items: items.map((item) => {
          const base = { productId: item.productId, quantity: item.qty }
          if (item.skuId) {
            return { ...base, skuId: item.skuId }
          }
          return base
        }),
      }
      await createStoreOrder(payload)
      clearCart()
      this.setData({
        items: [],
        subtotal: 0,
        shipping: 0,
        total: 0,
        subtotalText: '0.00',
        totalText: '0.00',
      })
      wx.showToast({ title: i18n.successToast || 'Order placed', icon: 'success' })
      setTimeout(() => wx.redirectTo({ url: '/pages/orders/index' }), 600)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed'
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },
}, ({ messages }) => messages.checkout))
