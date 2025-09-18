import { loadCart, saveDirectCheckout, updateCartQuantity, removeFromCart, clearCart, type CartItem } from '../../utils/cart'
import { withI18nPage } from '../../utils/i18n'

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}

function calculateSelectedTotal(items: CartItem[], selectedIds: string[]): number {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) return 0
  const selectedSet = new Set(selectedIds)
  return items.reduce((sum, item) => (selectedSet.has(item.id) ? sum + item.price * item.qty : sum), 0)
}

Page(withI18nPage({
  data: {
    items: [] as CartItem[],
    total: 0,
    totalCents: 0,
    selectedIds: [] as string[],
    selectedTotal: 0,
    selectedTotalCents: 0,
    selectedTotalText: '0.00',
    selectedLookup: {} as Record<string, boolean>,
    allSelected: false,
    selectionInitialized: false,
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.()
    // @ts-ignore WeChat runtime
    tabBar?.setActiveByRoute?.('/pages/cart/index')
    this.refreshCart()
  },

  refreshCart() {
    const items = loadCart()
    const hasInitialized = Boolean((this.data as any)?.selectionInitialized)
    const existingSelection = Array.isArray((this.data as any)?.selectedIds) ? ((this.data as any).selectedIds as string[]) : undefined
    const preferredSelection = hasInitialized ? existingSelection : undefined
    this.applyCartState(items, preferredSelection)
  },

  onGoShopping() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onQuantityChange(event: WechatMiniprogram.CustomEvent) {
    const dataset = (event?.currentTarget as any)?.dataset || {}
    const cartId = dataset.cartId as string | undefined
    const detail = event?.detail as any
    const rawValue = typeof detail === 'number' ? detail : Number(detail?.value)
    if (!Number.isFinite(rawValue)) return
    const value = rawValue < 1 ? 1 : Math.floor(rawValue)
    if (!cartId || !Number.isFinite(value)) return
    const items = updateCartQuantity(cartId, value)
    this.applyCartState(items, (this.data as any).selectedIds as string[])
  },

  onRemoveItem(event: WechatMiniprogram.TouchEvent) {
    const cartId = event?.currentTarget?.dataset?.cartId as string | undefined
    if (!cartId) return
    const items = removeFromCart(cartId)
    this.applyCartState(items, (this.data as any).selectedIds as string[])
  },

  onClearCart() {
    clearCart()
    this.setData({
      items: [],
      total: 0,
      totalCents: 0,
      selectedIds: [],
      selectedTotal: 0,
      selectedTotalCents: 0,
      selectedTotalText: '0.00',
      selectedLookup: {},
      allSelected: false,
      selectionInitialized: false,
    })
  },

  onCheckout() {
    const data = this.data as any
    if (!data.items.length) {
      const emptyToast = data.i18n?.emptyToast || 'Cart is empty'
      wx.showToast({ title: emptyToast, icon: 'none' })
      return
    }
    const selectedIds = Array.isArray(data.selectedIds) ? (data.selectedIds as string[]) : []
    if (!selectedIds.length) {
      const message = data.i18n?.selectToast || 'Choose items to checkout'
      wx.showToast({ title: message, icon: 'none' })
      return
    }
    const selectedItems = (data.items as CartItem[]).filter((item) => selectedIds.includes(item.id))
    saveDirectCheckout(selectedItems)
    wx.navigateTo({ url: '/pages/checkout/index?mode=direct' })
  },

  onToggleSelectAll(event: WechatMiniprogram.CustomEvent) {
    const detail = event?.detail as any
    const checked = typeof detail === 'boolean' ? detail : Boolean(detail?.value)
    const items = (this.data as any).items as CartItem[]
    const selectedIds = checked ? items.map((item) => item.id) : []
    this.applyCartState(items, selectedIds)
  },

  onSelectionChange(event: WechatMiniprogram.CustomEvent) {
    const detail = event?.detail as any
    const value = Array.isArray(detail)
      ? (detail as string[])
      : Array.isArray(detail?.value)
        ? (detail.value as string[])
        : []
    this.applyCartState((this.data as any).items as CartItem[], value)
  },

  applyCartState(items: CartItem[], preferredSelection?: string[]) {
    const total = calculateTotal(items)
    const totalCents = Math.round(total * 100)
    const availableIds = new Set(items.map((item) => item.id))
    const hasPreferred = Array.isArray(preferredSelection)
    let selectedIds: string[]
    if (hasPreferred) {
      selectedIds = (preferredSelection as string[]).filter((id) => availableIds.has(id))
    } else {
      selectedIds = items.map((item) => item.id)
    }
    if (!hasPreferred && selectedIds.length === 0 && items.length > 0) {
      selectedIds = items.map((item) => item.id)
    }
    const selectedTotal = calculateSelectedTotal(items, selectedIds)
    const selectedTotalCents = Math.round(selectedTotal * 100)
    const allSelected = items.length > 0 && selectedIds.length === items.length
    const selectedLookup = selectedIds.reduce((map, id) => {
      map[id] = true
      return map
    }, {} as Record<string, boolean>)
    this.setData({
      items,
      total,
      totalCents,
      selectedIds,
      selectedTotal,
      selectedTotalCents,
      selectedTotalText: selectedTotal.toFixed(2),
      selectedLookup,
      allSelected,
      selectionInitialized: true,
    })
  },
}, ({ messages }) => messages.cart))
