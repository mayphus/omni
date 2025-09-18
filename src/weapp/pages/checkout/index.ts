import { loadCart, loadDirectCheckout, clearCart, clearDirectCheckout, type CartItem } from '../../utils/cart'
import { confirmOrderPayment, createStoreOrder, prepareOrderPayment } from '../../utils/api'
import { withI18nPage } from '../../utils/i18n'
import type { PaymentPackage } from '@shared/models/order'

function requestPayment(packageData: PaymentPackage): Promise<void> {
  return new Promise((resolve, reject) => {
    if (
      !packageData ||
      !packageData.package ||
      !packageData.timeStamp ||
      !packageData.nonceStr ||
      !packageData.paySign
    ) {
      reject(new Error('Invalid payment package'))
      return
    }
    const signType =
      packageData.signType === 'MD5' || packageData.signType === 'HMAC-SHA256' ? packageData.signType : 'RSA'
    wx.requestPayment({
      timeStamp: packageData.timeStamp || '',
      nonceStr: packageData.nonceStr || '',
      package: packageData.package,
      signType,
      paySign: packageData.paySign || '',
      success: () => resolve(),
      fail: (error) => reject(error),
    })
  })
}

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
    checkoutMode: 'cart' as 'cart' | 'direct',
  },

  onLoad(query: Record<string, string | undefined>) {
    const mode = query?.mode === 'direct' ? 'direct' : 'cart'
    this.setData({ checkoutMode: mode })
  },

  onShow() {
    this.refreshCheckoutItems()
  },

  onUnload() {
    if ((this.data as any).checkoutMode === 'direct') {
      clearDirectCheckout()
    }
  },

  onGoShopping() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  refreshCheckoutItems() {
    const data = this.data as any
    const mode = data.checkoutMode === 'direct' ? 'direct' : 'cart'
    let items: CartItem[] = []
    if (mode === 'direct') {
      items = loadDirectCheckout()
      if ((!items || !items.length) && Array.isArray(data.items) && data.items.length) {
        items = data.items
      }
    } else {
      items = loadCart()
    }
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

  async onSubmit() {
    if ((this.data as any).submitting) return
    const items = (this.data as any).items as DisplayCartItem[]
    const i18n = (this.data as any).i18n || {}
    if (!items.length) {
      wx.showToast({ title: i18n.emptyToast || 'Cart is empty', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    let orderId: string | undefined
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
      const createRes = await createStoreOrder(payload)
      orderId = createRes.order?.id
      if (!orderId) {
        throw new Error(i18n.orderCreateFailed || 'Failed to create order')
      }

      const prepareRes = await prepareOrderPayment(orderId)
      const paymentPackage = prepareRes?.paymentPackage
      if (!paymentPackage) {
        throw new Error(i18n.paymentUnavailable || 'Payment is currently unavailable')
      }

      await requestPayment(paymentPackage)

      let confirmed = false
      try {
        await confirmOrderPayment(orderId)
        confirmed = true
      } catch (confirmError: any) {
        const message = confirmError instanceof Error ? confirmError.message : confirmError?.errMsg
        if (message) {
          wx.showToast({ title: message, icon: 'none' })
        }
      }

      if ((this.data as any).checkoutMode === 'direct') {
        clearDirectCheckout()
      } else {
        clearCart()
      }

      this.setData({
        items: [],
        subtotal: 0,
        shipping: 0,
        total: 0,
        subtotalText: '0.00',
        totalText: '0.00',
      })

      const successTitle = confirmed
        ? i18n.successToast || 'Payment successful'
        : i18n.paymentPendingToast || 'Payment submitted'
      wx.showToast({ title: successTitle, icon: confirmed ? 'success' : 'none' })
      setTimeout(() => wx.redirectTo({ url: '/pages/orders/index?active=1' }), 600)
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Checkout failed'
      const errMsg = typeof (error as any)?.errMsg === 'string' ? (error as any).errMsg : ''
      if (errMsg && errMsg.includes('cancel')) {
        message = i18n.paymentCancelled || 'Payment cancelled'
      }
      if (orderId) {
        const hint = i18n.orderPendingHint || 'Order pending payment. Check My Orders to retry.'
        message = `${message}${message.endsWith('.') ? '' : '.'} ${hint}`
      }
      wx.showToast({ title: message, icon: 'none', duration: 2500 })
    } finally {
      this.setData({ submitting: false })
    }
  },
}, ({ messages }) => messages.checkout))
