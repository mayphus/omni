import { fetchStoreOrders } from '../../utils/api'
import { withI18nPage } from '../../utils/i18n'
import { ORDER_AFTER_SALE_STATUSES, ORDER_STATUS_FLOW } from '@shared/models/order'
import type { OrderStatus, OrderWithId } from '@shared/models/order'

type TabKey = OrderStatus | 'all' | 'afterSale'

const STATUS_LABEL_MAP: Record<TabKey, string> = {
  all: 'All',
  pending: 'Pending',
  paid: 'Paid',
  shipped: 'Shipped',
  completed: 'Completed',
  canceled: 'Canceled',
  refunded: 'Refunded',
  afterSale: 'After-sale',
}

const STATUS_TABS: Array<{ key: TabKey; title: string }> = [
  { key: 'all', title: STATUS_LABEL_MAP.all },
  ...ORDER_STATUS_FLOW.map((status) => ({ key: status, title: STATUS_LABEL_MAP[status] })),
  { key: 'afterSale', title: STATUS_LABEL_MAP.afterSale },
]

type DisplayOrder = OrderWithId & { formattedDate: string }

function formatDate(ts: number): string {
  const date = new Date(ts)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

Page(withI18nPage({
  data: {
    tabs: STATUS_TABS,
    active: 'all' as TabKey,
    activeIndex: 0,
    orders: [] as DisplayOrder[],
    filtered: [] as DisplayOrder[],
    loading: false,
    error: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const index = Number(query?.active)
    if (!Number.isNaN(index) && STATUS_TABS[index]) {
      this.setData({ active: STATUS_TABS[index].key, activeIndex: index })
    }
    this.loadOrders()
  },

  async loadOrders() {
    this.setData({ loading: true, error: '' })
    try {
      const { orders } = await fetchStoreOrders()
      const normalized: DisplayOrder[] = (orders || []).map((order) => ({
        ...order,
        formattedDate: formatDate(order.createdAt),
      }))
      this.setData({ orders: normalized })
      this.applyFilter(this.data as any, normalized)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load orders'
      this.setData({ error: message })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onTabChange(event: WechatMiniprogram.CustomEvent) {
    const detail: any = event?.detail || {}
    const name = typeof detail.name === 'string' ? (detail.name as TabKey) : 'all'
    const index = STATUS_TABS.findIndex((tab) => tab.key === name)
    const nextIndex = index >= 0 ? index : 0
    const tab = STATUS_TABS[nextIndex]
    this.setData({ active: tab.key, activeIndex: nextIndex })
    this.applyFilter(this.data as any)
  },

  applyFilter(data: any, source?: DisplayOrder[]) {
    const orders = source || (data.orders as DisplayOrder[])
    const key: TabKey = data.active || 'all'
    let filtered: DisplayOrder[]
    if (key === 'all') {
      filtered = orders
    } else if (key === 'afterSale') {
      filtered = orders.filter((order) => ORDER_AFTER_SALE_STATUSES.includes(order.status))
    } else {
      const statusKey = key as OrderStatus
      filtered = orders.filter((order) => order.status === statusKey)
    }
    this.setData({ filtered })
  },
}, ({ messages }) => messages.orders))
