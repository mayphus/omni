import { fetchStoreCategories, type StoreCategoryNode } from '../../utils/api'
import { withI18nPage } from '../../utils/i18n'

type CategoryTabItem = {
  id: string
  name: string
  slug: string
  children: Array<{ id: string; name: string }>
}

function toCategoryTab(node: StoreCategoryNode): CategoryTabItem {
  return {
    id: node.id,
    name: node.name,
    slug: node.slug,
    children: (node.children || []).map((child) => ({ id: child.id, name: child.name })),
  }
}

Page(withI18nPage({
  data: {
    active: '' as string,
    categories: [] as CategoryTabItem[],
    categoriesLoading: false,
    categoriesLoaded: false,
    categoriesError: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const active = query?.active as string | undefined
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
      const active = mapped.some((item) => item.id === currentActive)
        ? currentActive
        : (mapped[0]?.id || '')
      this.setData({
        categories: mapped,
        active,
        categoriesLoaded: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load'
      this.setData({ categoriesError: message })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ categoriesLoading: false })
    }
  },

  onRetryCategories() {
    this.loadCategories()
  },

  onTabChange(e: WechatMiniprogram.CustomEvent) {
    const detail: any = e.detail || {}
    const name = (detail.name ?? detail).toString()
    this.setData({ active: name })
  },
}, ({ messages }) => messages.category));
