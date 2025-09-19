import { definePage } from '@vue-mini/core'
import { fetchStoreHome, type StoreBanner, type StoreFeaturedProduct } from '../../utils/api'
import type { ProductWithId } from '@shared/models/product'
import { withI18nPage } from '../../utils/i18n'

// Landing page surfaces featured products and time-sensitive banners curated by
// the admin dashboard. It keeps a light client-side cache so the storefront
// feels responsive even on spotty mobile networks.

type FeaturedCard = {
  id: string
  title: string
  desc: string
  price: string
  imageUrl: string
  hasStock: boolean
}

type BannerCard = {
  id: string
  imageUrl: string
  title?: string
  linkUrl?: string
}

const DEFAULT_IMAGE = 'https://img.yzcdn.cn/vant/ipad.jpeg'

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

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

function toFeaturedCard(item: StoreFeaturedProduct | ProductWithId): FeaturedCard {
  const priceYuan = 'priceYuan' in item ? item.priceYuan : item.price.priceYuan
  const subtitle = 'subtitle' in item ? item.subtitle : undefined
  const description = 'description' in item ? item.description : undefined
  const image = 'imageUrl' in item ? item.imageUrl : (item as ProductWithId).images?.[0]?.url
  return {
    id: item.id,
    title: item.title,
    desc: subtitle || description || '',
    price: formatPrice(priceYuan),
    imageUrl: image || DEFAULT_IMAGE,
    hasStock: 'hasStock' in item
      ? item.hasStock
      : ((item as ProductWithId).stock ?? 0) > 0 || Boolean(((item as ProductWithId).skus || []).some((sku) => (sku.stock ?? 0) > 0 && sku.isActive !== false)),
  }
}

definePage(withI18nPage({
  data: {
    featuredProducts: [] as FeaturedCard[],
    banners: [] as BannerCard[],
    featuredLoading: false,
    featuredLoaded: false,
    featuredError: '',
    searchValue: '',
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
    // When customers pull to refresh we reset the error state but reuse cached
    // cards; this keeps skeletons consistent while awaiting new data.
    this.setData({ featuredLoading: true, featuredError: '' })
    try {
      const { featuredProducts, banners } = await fetchStoreHome()
      const mapped = (featuredProducts || []).map(toFeaturedCard)
      const bannerCards = (banners || [])
        .filter((banner): banner is StoreBanner => Boolean(banner && banner.imageUrl))
        .map((banner) => ({
          id: banner.id,
          imageUrl: banner.imageUrl,
          title: banner.title,
          linkUrl: banner.linkUrl,
        }))
      this.setData({
        featuredProducts: mapped,
        banners: bannerCards,
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
      // Reset the loading flag regardless of outcome so the UI can re-enable
      // refresh affordances.
      this.setData({ featuredLoading: false })
    }
  },

  onRetryFeatured() {
    this.loadFeaturedProducts()
  },

  onSearchChange(event: WechatMiniprogram.CustomEvent) {
    const value = getEventValue(event)
    this.setData({ searchValue: value })
  },

  async onSearchConfirm(event: WechatMiniprogram.CustomEvent) {
    const value = getEventValue(event)
    const keyword = typeof value === 'string' ? value.trim() : ''
    if (!keyword) {
      this.setData({ searchValue: '' })
      return
    }
    this.setData({ searchValue: keyword })
    wx.navigateTo({ url: `/pages/search/index?q=${encodeURIComponent(keyword)}` })
  },

  onOpenProduct(event: WechatMiniprogram.TouchEvent) {
    const productId = event?.currentTarget?.dataset?.productId as string | undefined
    if (!productId || typeof productId !== 'string') return
    wx.navigateTo({ url: `/pages/product/detail?id=${encodeURIComponent(productId)}` })
  },

  onBannerTap(event: WechatMiniprogram.TouchEvent) {
    const dataset = event?.currentTarget?.dataset || {}
    const link = typeof dataset.link === 'string' ? dataset.link : ''
    if (!link) return
    if (link.startsWith('/')) {
      wx.navigateTo({ url: link })
      return
    }
    wx.setClipboardData({
      data: link,
      success: () => {
        const message = ((this.data as any)?.i18n?.bannerLinkCopied) || 'Link copied'
        wx.showToast({ title: message, icon: 'success' })
      },
    })
  },
}, ({ messages }) => messages.index))
