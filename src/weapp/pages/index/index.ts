import { definePage } from '@vue-mini/core'
import { fetchStoreHome, type StoreFeaturedProduct } from '../../utils/api'
import { withI18nPage } from '../../utils/i18n'

type FeaturedCard = {
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

function toFeaturedCard(item: StoreFeaturedProduct): FeaturedCard {
  return {
    id: item.id,
    title: item.title,
    desc: item.subtitle || '',
    price: formatPrice(item.priceYuan),
    imageUrl: item.imageUrl || DEFAULT_IMAGE,
    hasStock: item.hasStock,
  }
}

definePage(withI18nPage({
  data: {
    featuredProducts: [] as FeaturedCard[],
    featuredLoading: false,
    featuredLoaded: false,
    featuredError: '',
  },

  onLoad() {
    this.loadFeaturedProducts()
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.()
    // @ts-ignore: WeChat runtime API
    tabBar?.setActiveByRoute?.('/pages/index/index')
    const { featuredLoaded, featuredLoading } = this.data as any
    if (!featuredLoaded && !featuredLoading) {
      this.loadFeaturedProducts()
    }
  },

  async loadFeaturedProducts() {
    const { featuredLoading } = this.data as any
    if (featuredLoading) return
    this.setData({ featuredLoading: true, featuredError: '' })
    try {
      const { featuredProducts } = await fetchStoreHome()
      const mapped = (featuredProducts || []).map(toFeaturedCard)
      this.setData({
        featuredProducts: mapped,
        featuredLoaded: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load'
      const hasInitialData = (this.data as any).featuredLoaded || ((this.data as any).featuredProducts || []).length > 0
      if (!hasInitialData) {
        this.setData({ featuredError: message })
      }
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ featuredLoading: false })
    }
  },

  onRetryFeatured() {
    this.loadFeaturedProducts()
  },

  onOpenSearch() {
    wx.navigateTo({ url: '/pages/search/index' })
  },
}, ({ messages }) => messages.index))
