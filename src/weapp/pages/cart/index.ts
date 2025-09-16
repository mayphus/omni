import { loadCart, updateCartQuantity, removeFromCart, clearCart, type CartItem } from '../../utils/cart'
import { withI18nPage } from '../../utils/i18n'

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}

Page(withI18nPage({
  data: {
    items: [] as CartItem[],
    total: 0,
    totalCents: 0,
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.()
    // @ts-ignore WeChat runtime
    tabBar?.setActiveByRoute?.('/pages/cart/index')
    this.refreshCart()
  },

  refreshCart() {
    const items = loadCart()
    const total = calculateTotal(items)
    this.setData({
      items,
      total,
      totalCents: Math.round(total * 100),
    })
  },

  onGoShopping() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onQuantityChange(event: WechatMiniprogram.CustomEvent) {
    const dataset = (event?.currentTarget as any)?.dataset || {}
    const productId = dataset.productId as string | undefined
    const value = Number((event?.detail as any)?.value)
    if (!productId || !Number.isFinite(value)) return
    const items = updateCartQuantity(productId, value)
    const total = calculateTotal(items)
    this.setData({ items, total, totalCents: Math.round(total * 100) })
  },

  onRemoveItem(event: WechatMiniprogram.TouchEvent) {
    const productId = event?.currentTarget?.dataset?.productId as string | undefined
    if (!productId) return
    const items = removeFromCart(productId)
    const total = calculateTotal(items)
    this.setData({ items, total, totalCents: Math.round(total * 100) })
  },

  onClearCart() {
    clearCart()
    this.setData({ items: [], total: 0, totalCents: 0 })
  },

  onCheckout() {
    const data = this.data as any
    if (!data.items.length) {
      const emptyToast = data.i18n?.emptyToast || 'Cart is empty'
      wx.showToast({ title: emptyToast, icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/checkout/index' })
  },
}, ({ messages }) => messages.cart))
