import { fetchProductDetail } from '../../utils/api'
import { addToCart } from '../../utils/cart'
import { withI18nPage } from '../../utils/i18n'
import type { ProductWithId } from '@shared/models/product'

Page(withI18nPage({
  data: {
    productId: '',
    product: null as ProductWithId | null,
    loading: false,
    error: '',
    quantity: 1,
  },

  onLoad(query: Record<string, string | undefined>) {
    const id = typeof query?.id === 'string' ? query.id : ''
    if (id) {
      this.setData({ productId: id })
      this.loadProduct(id)
    } else {
      this.setData({ error: 'Missing product id' })
    }
  },

  async loadProduct(productId: string) {
    this.setData({ loading: true, error: '', product: null })
    try {
      const { product } = await fetchProductDetail(productId)
      this.setData({ product })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load product'
      this.setData({ error: message })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onReloadProduct() {
    const productId = (this.data as any).productId as string
    if (productId) {
      this.loadProduct(productId)
    }
  },

  onQuantityChange(event: WechatMiniprogram.CustomEvent) {
    const value = Number((event?.detail as any)?.value)
    if (!Number.isFinite(value) || value <= 0) return
    this.setData({ quantity: value })
  },

  onAddToCart() {
    const data = this.data as any
    const product: ProductWithId | null = data.product
    if (!product) return
    const qty = Number(data.quantity) || 1
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price.priceYuan,
      imageUrl: product.images?.[0]?.url,
    }, qty)
    const toastText = data.i18n?.addedToast || 'Added to cart'
    wx.showToast({ title: toastText, icon: 'success' })
  },

  onBuyNow() {
    this.onAddToCart()
    wx.switchTab({ url: '/pages/cart/index' })
  },
}, ({ messages }) => messages.product))
