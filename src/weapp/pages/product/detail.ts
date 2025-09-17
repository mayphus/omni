import { fetchProductDetail } from '../../utils/api'
import { addToCart } from '../../utils/cart'
import { withI18nPage } from '../../utils/i18n'
import type { I18nMessages } from '../../utils/i18n'
import type { ProductWithId } from '@shared/models/product'

const PLACEHOLDER_IMAGE = 'https://img.yzcdn.cn/vant/ipad.jpeg'

type ProductMessages = I18nMessages['product']
type AttributeEntry = { key: string; value: string }
type SkuOption = { skuId: string; text: string; disabled: boolean; stock: number; priceYuan: number }

function buildGallery(product: ProductWithId | null): string[] {
  if (!product || !Array.isArray(product.images) || product.images.length === 0) {
    return [PLACEHOLDER_IMAGE]
  }
  return product.images
    .map((image) => (typeof image?.url === 'string' && image.url.trim() ? image.url : undefined))
    .filter((url): url is string => typeof url === 'string')
    .filter((url, index, list) => list.indexOf(url) === index)
}

function isPurchasable(product: ProductWithId | null): boolean {
  if (!product) return false
  if (product.isActive === false) return false
  if (product.stock > 0) return true
  if (Array.isArray(product.skus)) {
    return product.skus.some((sku) => sku && sku.isActive !== false && (sku.stock ?? 0) > 0)
  }
  return false
}

function buildAttributes(product: ProductWithId | null, messages: ProductMessages | undefined): AttributeEntry[] {
  if (!product || !product.attributes) return []
  const yesLabel = messages?.attributeYes || 'Yes'
  const noLabel = messages?.attributeNo || 'No'
  return Object.entries(product.attributes)
    .filter(([key]) => typeof key === 'string' && key.trim().length > 0)
    .map(([key, value]) => {
      let display = ''
      if (typeof value === 'boolean') display = value ? yesLabel : noLabel
      else if (value === null || value === undefined) display = ''
      else display = String(value)
      return { key, value: display }
    })
    .filter((entry) => entry.value !== '')
}

function buildLowStockLabel(product: ProductWithId | null, messages: ProductMessages | undefined): string {
  if (!product) return ''
  if (product.stock <= 0 || product.stock > 10) return ''
  const suffix = messages?.stockLeftSuffix || ' left'
  return `${product.stock}${suffix}`
}

function formatPriceYuan(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Number(value.toFixed(2))
}

function buildSkuOptions(product: ProductWithId | null, messages: ProductMessages | undefined): SkuOption[] {
  if (!product || !Array.isArray(product.skus)) return []
  const yesLabel = messages?.attributeYes || 'Yes'
  const noLabel = messages?.attributeNo || 'No'
  return product.skus
    .filter((sku) => sku && typeof sku.skuId === 'string' && sku.skuId.trim().length > 0)
    .map((sku) => {
      const attributesText = sku?.attributes
        ? Object.entries(sku.attributes)
            .map(([key, value]) => {
              if (!key) return ''
              if (typeof value === 'boolean') return `${key}: ${value ? yesLabel : noLabel}`
              if (value === null || value === undefined) return ''
              return `${key}: ${value}`
            })
            .filter(Boolean)
            .join(' / ')
        : ''
      const label = attributesText || sku.skuId
      const price = formatPriceYuan(sku?.priceYuan ?? product.price.priceYuan)
      const text = price ? `${label} · ¥${price.toFixed(2)}` : label
      const stock = typeof sku?.stock === 'number' ? sku.stock : 0
      const disabled = sku?.isActive === false || stock <= 0
      return { skuId: sku.skuId, text, disabled, stock: stock > 0 ? stock : 0, priceYuan: price }
    })
}

function getDefaultSkuId(options: SkuOption[]): string {
  const available = options.find((option) => !option.disabled)
  return available?.skuId || options[0]?.skuId || ''
}

function findSku(options: SkuOption[], skuId: string | undefined): SkuOption | undefined {
  if (!Array.isArray(options) || !skuId) return undefined
  return options.find((option) => option.skuId === skuId)
}

Page(withI18nPage({
  data: {
    productId: '',
    product: null as ProductWithId | null,
    loading: false,
    error: '',
    quantity: 1,
    gallery: [] as string[],
    activeImageIndex: 0,
    purchasable: false,
    attributes: [] as AttributeEntry[],
    lowStockLabel: '',
    skuOptions: [] as SkuOption[],
    selectedSkuId: '',
    selectedSkuPrice: 0,
    selectedSkuPriceText: '0.00',
    selectedSkuStock: 0,
    showPurchasePopup: false,
    pendingAction: '' as '' | 'addToCart' | 'buyNow',
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
    this.setData({
      loading: true,
      error: '',
      product: null,
      gallery: [],
      activeImageIndex: 0,
      purchasable: false,
      attributes: [],
      lowStockLabel: '',
      skuOptions: [],
      selectedSkuId: '',
      selectedSkuPrice: 0,
      selectedSkuPriceText: '0.00',
      selectedSkuStock: 0,
      showPurchasePopup: false,
      pendingAction: '',
    })
    try {
      const { product } = await fetchProductDetail(productId)
      const i18n = ((this.data as any)?.i18n || {}) as ProductMessages | undefined
      const gallery = buildGallery(product)
      const purchasable = isPurchasable(product)
      const currentQty = Number(((this.data as any)?.quantity ?? 1) as number)
      const quantity = purchasable ? Math.min(Math.max(1, currentQty || 1), product.stock || 1) : 1
      const attributes = buildAttributes(product, i18n)
      const lowStockLabel = buildLowStockLabel(product, i18n)
      const skuOptions = buildSkuOptions(product, i18n)
      const defaultSkuId = getDefaultSkuId(skuOptions)
      const selectedSku = findSku(skuOptions, defaultSkuId)
      const selectedSkuStock = selectedSku ? selectedSku.stock : product.stock
      const adjustedQuantity = selectedSkuStock && selectedSkuStock > 0 ? Math.min(quantity, selectedSkuStock) : quantity
      const selectedSkuPrice = selectedSku ? selectedSku.priceYuan : formatPriceYuan(product.price.priceYuan)
      this.setData({
        product,
        gallery,
        quantity: adjustedQuantity,
        purchasable,
        attributes,
        lowStockLabel,
        skuOptions,
        selectedSkuId: defaultSkuId,
        selectedSkuPrice,
        selectedSkuPriceText: selectedSkuPrice.toFixed(2),
        selectedSkuStock: selectedSkuStock || 0,
      })
      wx.setNavigationBarTitle({ title: product.title || 'Product' })
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
    const data = this.data as any
    const product: ProductWithId | null = data.product
    const skuOptions: SkuOption[] = Array.isArray(data.skuOptions) ? data.skuOptions : []
    const selectedSku: SkuOption | undefined = findSku(skuOptions, data.selectedSkuId)
    const skuStock = selectedSku?.stock ?? 0
    const productStock = product?.stock ?? 0
    const maxStock = skuStock > 0 ? skuStock : productStock > 0 ? productStock : value
    const quantity = Math.min(Math.max(1, value), maxStock)
    this.setData({ quantity })
  },

  onQuantityOverLimit() {
    const data = this.data as any
    const product: ProductWithId | null = data.product
    if (!product) return
    const skuOptions: SkuOption[] = Array.isArray(data.skuOptions) ? data.skuOptions : []
    const selectedSku: SkuOption | undefined = findSku(skuOptions, data.selectedSkuId)
    const stock = selectedSku ? selectedSku.stock : product.stock
    if (!stock || stock <= 0) {
      const message = data.i18n?.stockSoldOut || data.i18n?.comingSoonTitle || 'Out of stock'
      wx.showToast({ title: message, icon: 'none' })
      return
    }
    const prefix = data.i18n?.maxQuantityPrefix || 'Max '
    const suffix = data.i18n?.maxQuantitySuffix || ''
    wx.showToast({ title: `${prefix}${stock}${suffix}`, icon: 'none' })
  },

  onAddToCart() {
    this.openPurchasePopup('addToCart')
  },

  onBuyNow() {
    this.openPurchasePopup('buyNow')
  },

  onGalleryChange(event: WechatMiniprogram.CustomEvent) {
    const index = Number((event?.detail as any)?.current)
    if (!Number.isFinite(index)) return
    this.setData({ activeImageIndex: index })
  },

  onPreviewImage(event: WechatMiniprogram.TouchEvent) {
    const data = this.data as any
    const gallery: string[] = Array.isArray(data.gallery) && data.gallery.length ? data.gallery : [PLACEHOLDER_IMAGE]
    const url = (event?.currentTarget?.dataset as any)?.url
    wx.previewImage({ current: typeof url === 'string' ? url : gallery[0], urls: gallery })
  },

  onActionIconTap(event: WechatMiniprogram.TouchEvent) {
    const dataset = (event?.currentTarget?.dataset || {}) as { url?: string; linkType?: 'switchTab' | 'navigateTo' }
    const { url, linkType } = dataset
    if (!url) return
    if (linkType === 'switchTab') {
      wx.switchTab({ url })
      return
    }
    wx.navigateTo({ url })
  },

  onSkuChange(event: WechatMiniprogram.CustomEvent) {
    const value = typeof event?.detail === 'string' ? event.detail : (event?.detail as any)?.value
    const skuId = typeof value === 'string' ? value : ''
    const data = this.data as any
    const skuOptions: SkuOption[] = Array.isArray(data.skuOptions) ? data.skuOptions : []
    const selectedSku = findSku(skuOptions, skuId)
    const product: ProductWithId | null = data.product
    const productStock = product?.stock ?? 0
    const stock = selectedSku ? selectedSku.stock : productStock
    const quantity = stock > 0 ? Math.min(Math.max(1, Number(data.quantity) || 1), stock) : Number(data.quantity) || 1
    const price = selectedSku ? selectedSku.priceYuan : formatPriceYuan(product?.price.priceYuan)
    this.setData({
      selectedSkuId: skuId,
      selectedSkuStock: stock,
      quantity,
      selectedSkuPrice: price,
      selectedSkuPriceText: price.toFixed(2),
    })
  },

  openPurchasePopup(action: 'addToCart' | 'buyNow') {
    const data = this.data as any
    const product: ProductWithId | null = data.product
    if (!product || !data.purchasable) {
      const message = data.i18n?.stockSoldOut || data.i18n?.comingSoonTitle || 'Out of stock'
      wx.showToast({ title: message, icon: 'none' })
      return
    }
    const skuOptions: SkuOption[] = Array.isArray(data.skuOptions) ? data.skuOptions : []
    let skuId = data.selectedSkuId as string
    if (!skuId && skuOptions.length) {
      skuId = getDefaultSkuId(skuOptions)
    }
    const selectedSku = findSku(skuOptions, skuId)
    const stock = selectedSku ? selectedSku.stock : product.stock
    const price = selectedSku ? selectedSku.priceYuan : formatPriceYuan(product.price.priceYuan)
    const baseQuantity = Number(data.quantity) || 1
    const quantity = stock && stock > 0 ? Math.min(Math.max(1, baseQuantity), stock) : baseQuantity
    this.setData({
      selectedSkuId: skuId,
      selectedSkuStock: stock,
      selectedSkuPrice: price,
      selectedSkuPriceText: price.toFixed(2),
      quantity,
      pendingAction: action,
      showPurchasePopup: true,
    })
  },

  onClosePurchasePopup() {
    this.setData({ showPurchasePopup: false, pendingAction: '' })
  },

  onConfirmPurchase() {
    const success = this.performPurchase()
    if (success) {
      this.setData({ showPurchasePopup: false, pendingAction: '' })
    }
  },

  performPurchase(): boolean {
    const data = this.data as any
    const action = data.pendingAction as 'addToCart' | 'buyNow' | ''
    if (!action) return false
    const product: ProductWithId | null = data.product
    if (!product || !data.purchasable) {
      const message = data.i18n?.stockSoldOut || data.i18n?.comingSoonTitle || 'Out of stock'
      wx.showToast({ title: message, icon: 'none' })
      return false
    }
    const skuOptions: SkuOption[] = Array.isArray(data.skuOptions) ? data.skuOptions : []
    const selectedSku: SkuOption | undefined = skuOptions.length ? findSku(skuOptions, data.selectedSkuId) : undefined
    if (skuOptions.length && (!selectedSku || selectedSku.disabled)) {
      const message = data.i18n?.skuLabel || 'Select option'
      wx.showToast({ title: message, icon: 'none' })
      return false
    }
    const quantity = Number(data.quantity) || 1
    const stock = selectedSku ? selectedSku.stock : product.stock
    if (!stock || stock <= 0) {
      const message = data.i18n?.stockSoldOut || data.i18n?.comingSoonTitle || 'Out of stock'
      wx.showToast({ title: message, icon: 'none' })
      return false
    }
    if (quantity > stock) {
      const prefix = data.i18n?.maxQuantityPrefix || 'Max '
      const suffix = data.i18n?.maxQuantitySuffix || ''
      wx.showToast({ title: `${prefix}${stock}${suffix}`, icon: 'none' })
      return false
    }
    const price = selectedSku ? selectedSku.priceYuan : formatPriceYuan(product.price.priceYuan)
    const itemTitle = selectedSku ? `${product.title} (${selectedSku.text})` : product.title
    addToCart(
      {
        id: product.id,
        title: itemTitle,
        price,
        imageUrl: undefined,
      },
      quantity,
    )
    const toastText = data.i18n?.addedToast || 'Added to cart'
    wx.showToast({ title: toastText, icon: 'success' })
    if (action === 'buyNow') {
      wx.navigateTo({ url: '/pages/checkout/index' })
    }
    return true
  },

  onShareAppMessage() {
    const data = this.data as any
    const product: ProductWithId | null = data.product
    if (!product) {
      return {
        title: data.i18n?.productTitle || 'Product',
        path: '/pages/index/index',
      }
    }
    return {
      title: product.title,
      path: `/pages/product/detail?id=${product.id}`,
      imageUrl: data.gallery?.[0],
    }
  },

  onShareTimeline() {
    const data = this.data as any
    const product: ProductWithId | null = data.product
    if (!product) {
      return {
        title: data.i18n?.productTitle || 'Product',
      }
    }
    return {
      title: product.title,
      query: `id=${product.id}`,
      imageUrl: data.gallery?.[0],
    }
  },
}, ({ messages }) => messages.product))
