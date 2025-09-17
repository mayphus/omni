import { searchStoreProducts } from '../../utils/api'
import { withI18nPage } from '../../utils/i18n'
import type { ProductWithId } from '@shared/models/product'

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
    results: [] as ProductWithId[],
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
      this.setData({ results: products || [] })
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
