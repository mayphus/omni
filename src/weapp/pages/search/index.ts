import { searchStoreProducts } from '../../utils/api'
import { withI18nPage } from '../../utils/i18n'
import type { ProductWithId } from '@shared/models/product'

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
    const value = (event?.detail as any)?.value ?? ''
    this.setData({ value })
    if (!value) {
      this.setData({ results: [], error: '' })
    }
  },

  onSearch(event: WechatMiniprogram.CustomEvent) {
    const value = (event?.detail as any)?.value ?? ''
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
