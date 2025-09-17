import { searchStoreProducts } from '../../utils/api'
import { withI18nPage } from '../../utils/i18n'
import type { ProductWithId } from '@shared/models/product'

type SearchCard = {
  id: string
  title: string
  desc: string
  price: string
  imageUrl: string
  hasStock: boolean
}

const DEFAULT_IMAGE = 'https://img.yzcdn.cn/vant/ipad.jpeg'

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

function toSearchCard(product: ProductWithId): SearchCard {
  const priceYuan = Number(product.price?.priceYuan)
  const hasStock = (product.stock ?? 0) > 0 || Boolean(product.skus?.some((sku) => (sku.stock ?? 0) > 0 && sku.isActive !== false))
  return {
    id: product.id,
    title: product.title,
    desc: product.subtitle || product.description || '',
    price: formatPrice(priceYuan),
    imageUrl: product.images?.[0]?.url || DEFAULT_IMAGE,
    hasStock,
  }
}

function getEventValue(event: WechatMiniprogram.CustomEvent): string {
  const detail = event?.detail as any
  if (typeof detail === 'string') return detail
  if (detail && typeof detail.value !== 'undefined') {
    const value = detail.value
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
  }
  return ''
}

Page(withI18nPage({
  data: {
    value: '',
    results: [] as SearchCard[],
    loading: false,
    error: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const keyword = typeof query?.q === 'string' ? query.q : ''
    if (keyword) {
      this.setData({ value: keyword })
      void this.performSearch(keyword)
    }
  },

  onChange(event: WechatMiniprogram.CustomEvent) {
    const value = getEventValue(event)
    this.setData({ value })
    if (!value) {
      this.setData({ results: [], error: '' })
    }
  },

  onSearch(event: WechatMiniprogram.CustomEvent) {
    const value = getEventValue(event)
    const keyword = typeof value === 'string' ? value.trim() : ''
    if (!keyword) return
    void this.performSearch(keyword)
  },

  async performSearch(keyword: string) {
    if (!keyword) return
    this.setData({ loading: true, error: '', results: [] })
    try {
      const { products } = await searchStoreProducts(keyword, 50)
      const mapped = (products || []).map(toSearchCard)
      this.setData({ results: mapped })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed'
      this.setData({ error: message, results: [] })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onClear() {
    this.setData({ value: '', results: [], error: '' })
  },

  onSelect(event: WechatMiniprogram.TouchEvent) {
    const productId = event?.currentTarget?.dataset?.productId as string | undefined
    if (!productId) return
    wx.navigateTo({ url: `/pages/product/detail?id=${encodeURIComponent(productId)}` })
  },
}, ({ messages }) => messages.search))
