import {
  fetchStoreCategories,
  fetchProductsByCategory,
  searchStoreProducts,
  type StoreCategoryNode,
} from '../../utils/api'
import { withI18nPage } from '../../utils/i18n'

type CategoryTabItem = {
  id: string
  name: string
  slug: string
  children: Array<{ id: string; name: string; slug: string }>
}

type ProductCard = {
  id: string
  title: string
  desc: string
  price: string
  imageUrl: string
  hasStock: boolean
}

const DEFAULT_IMAGE = 'https://img.yzcdn.cn/vant/ipad.jpeg'

function toCategoryTab(node: StoreCategoryNode): CategoryTabItem {
  return {
    id: node.id,
    name: node.name,
    slug: node.slug,
    children: (node.children || []).map((child) => ({ id: child.id, name: child.name, slug: child.slug })),
  }
}

function toProductCard(product: {
  id: string
  title: string
  subtitle?: string
  description?: string
  price: { priceYuan: number }
  images?: Array<{ url?: string }>
  stock?: number
  skus?: Array<{ stock?: number; isActive?: boolean }>
}): ProductCard {
  const hasStock = (product.stock ?? 0) > 0 || Boolean(product.skus?.some((sku) => (sku.stock ?? 0) > 0 && sku.isActive !== false))
  return {
    id: product.id,
    title: product.title,
    desc: product.subtitle || product.description || '',
    price: Number(product.price.priceYuan).toFixed(2),
    imageUrl: product.images?.[0]?.url || DEFAULT_IMAGE,
    hasStock,
  }
}

Page(withI18nPage({
  data: {
    active: '' as string,
    categories: [] as CategoryTabItem[],
    categoriesLoading: false,
    categoriesLoaded: false,
    categoriesError: '',
    products: [] as ProductCard[],
    productsLoading: false,
    productsError: '',
    searchValue: '',
    searchResults: [] as ProductCard[],
    searchLoading: false,
    searchError: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const active = typeof query?.active === 'string' ? query.active : ''
    if (active) this.setData({ active })
    this.loadCategories()
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.()
    // @ts-ignore WeChat runtime
    tabBar?.setActiveByRoute?.('/pages/category/index')

    const { categoriesLoaded, categoriesLoading } = this.data as any
    if (!categoriesLoaded && !categoriesLoading) {
      this.loadCategories()
    }
  },

  async loadCategories() {
    const { categoriesLoading } = this.data as any
    if (categoriesLoading) return
    this.setData({ categoriesLoading: true, categoriesError: '' })
    try {
      const { categories } = await fetchStoreCategories()
      const mapped = (categories || []).map(toCategoryTab)
      const currentActive = (this.data as any).active as string
      const active = mapped.some((item) => item.slug === currentActive)
        ? currentActive
        : (mapped[0]?.slug || '')
      this.setData({
        categories: mapped,
        active,
        categoriesLoaded: true,
      })
      if (active) {
        this.loadProducts(active)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load'
      this.setData({ categoriesError: message })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ categoriesLoading: false })
    }
  },

  async loadProducts(slug: string) {
    if (!slug) return
    this.setData({ productsLoading: true, productsError: '', products: [] })
    try {
      const { products } = await fetchProductsByCategory(slug)
      const mapped = (products || []).map(toProductCard)
      this.setData({ products: mapped })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load products'
      this.setData({ productsError: message, products: [] })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ productsLoading: false })
    }
  },

  onRetryCategories() {
    this.loadCategories()
  },

  onTabChange(e: WechatMiniprogram.CustomEvent) {
    const detail: any = e.detail || {}
    const slug = (detail.name ?? detail).toString()
    this.setData({ active: slug, searchValue: '', searchResults: [], searchError: '' })
    this.loadProducts(slug)
  },

  onReloadCategory() {
    const slug = (this.data as any).active as string
    if (slug) this.loadProducts(slug)
  },

  onProductTap(event: WechatMiniprogram.TouchEvent) {
    const productId = event?.currentTarget?.dataset?.productId as string | undefined
    if (!productId) return
    wx.navigateTo({ url: `/pages/product/detail?id=${encodeURIComponent(productId)}` })
  },

  onSearchChange(event: WechatMiniprogram.CustomEvent) {
    const value = (event?.detail as any)?.value ?? ''
    this.setData({ searchValue: value })
    if (!value) {
      this.setData({ searchResults: [], searchError: '', searchLoading: false })
    }
  },

  async onSearchConfirm(event: WechatMiniprogram.CustomEvent) {
    const value = (event?.detail as any)?.value ?? ''
    const keyword = typeof value === 'string' ? value.trim() : ''
    if (!keyword) {
      this.setData({ searchValue: '', searchResults: [], searchError: '' })
      return
    }
    if ((this.data as any).searchLoading) return
    this.setData({ searchLoading: true, searchError: '' })
    try {
      const activeSlug = (this.data as any).active as string
      const { products } = await searchStoreProducts(keyword, 50)
      const normalized = activeSlug.toLowerCase()
      const filtered = (products || []).filter((product) => (product.category || '').toLowerCase() === normalized)
      const mapped = filtered.map(toProductCard)
      this.setData({ searchResults: mapped })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed'
      this.setData({ searchError: message, searchResults: [] })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ searchLoading: false })
    }
  },

  onSearchCancel() {
    this.setData({ searchValue: '', searchResults: [], searchError: '', searchLoading: false })
  },
}, ({ messages }) => messages.category))
