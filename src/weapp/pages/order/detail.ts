import { fetchStoreOrderDetail, cancelStoreOrder } from '../../utils/api'
import { withI18nPage } from '../../utils/i18n'
import type { OrderItem, OrderStatus, OrderWithId } from '@shared/models/order'

type DecoratedOrderItem = OrderItem & {
  lineTotal: number
  lineTotalText: string
  unitPriceText: string
  itemKey: string
}

type DecoratedOrder = OrderWithId & {
  formattedDate: string
  subtotalText: string
  shippingText: string
  discountText: string
  totalText: string
  items: DecoratedOrderItem[]
  paymentStatus: string
  canCancel: boolean
  statusTag: 'primary' | 'warning' | 'success' | 'danger'
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

function canCancel(status: OrderStatus): boolean {
  return status === 'pending' || status === 'paid'
}

function getStatusTag(status: OrderStatus): 'primary' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'paid':
    case 'shipped':
      return 'primary'
    case 'completed':
      return 'success'
    case 'canceled':
    case 'refunded':
      return 'danger'
    default:
      return 'primary'
  }
}

function decorateOrder(order: OrderWithId): DecoratedOrder {
  const items: DecoratedOrderItem[] = (order.items || []).map((item, index) => {
    const lineTotal = item.priceYuan * item.qty
    return {
      ...item,
      lineTotal,
      lineTotalText: formatPrice(lineTotal),
      unitPriceText: formatPrice(item.priceYuan),
      itemKey: `${item.productId}__${item.skuId || 'default'}__${index}`,
    }
  })
  return {
    ...order,
    formattedDate: formatDateTime(order.createdAt),
    subtotalText: formatPrice(order.subtotalYuan),
    shippingText: formatPrice(order.shippingYuan ?? 0),
    discountText: formatPrice(order.discountYuan ?? 0),
    totalText: formatPrice(order.totalYuan),
    items,
    paymentStatus: order.payment?.status || 'pending',
    canCancel: canCancel(order.status),
    statusTag: getStatusTag(order.status),
  }
}

Page(withI18nPage({
  data: {
    orderId: '',
    order: null as DecoratedOrder | null,
    loading: false,
    canceling: false,
    error: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const orderId = (query?.orderId || query?.id || '').trim()
    if (!orderId) {
      const message = (this.data as any)?.i18n?.errors?.missingId || 'Missing order id'
      this.setData({ error: message })
      wx.showToast({ title: message, icon: 'none' })
      return
    }
    this.setData({ orderId })
    void this.loadOrder(orderId)
  },

  async loadOrder(orderId: string) {
    this.setData({ loading: true, error: '' })
    try {
      const { order } = await fetchStoreOrderDetail(orderId)
      const decorated = decorateOrder(order)
      this.setData({ order: decorated })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load order'
      this.setData({ error: message })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onCopyOrderId() {
    const order = (this.data as any).order as DecoratedOrder | null
    if (!order) return
    wx.setClipboardData({ data: order.id })
  },

  onCancelOrder() {
    const data = this.data as any
    const order = data.order as DecoratedOrder | null
    if (!order || !order.canCancel || data.canceling) return
    const confirm = data.i18n?.cancelConfirm || {}
    wx.showModal({
      title: confirm.title || 'Cancel order',
      content: confirm.message || 'Are you sure you want to cancel this order?',
      cancelText: confirm.cancel || 'Keep order',
      confirmText: confirm.confirm || 'Cancel order',
      success: (res) => {
        if (res.confirm) {
          void this.performCancel(order.id)
        }
      },
    })
  },

  async performCancel(orderId: string) {
    this.setData({ canceling: true })
    try {
      const { order } = await cancelStoreOrder(orderId)
      const decorated = decorateOrder(order)
      this.setData({ order: decorated })
      const toast = (this.data as any)?.i18n?.cancelConfirm?.success || 'Order canceled'
      wx.showToast({ title: toast, icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel order'
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ canceling: false })
    }
  },

  onPullDownRefresh() {
    const orderId = (this.data as any).orderId as string
    if (!orderId) {
      wx.stopPullDownRefresh()
      return
    }
    this.loadOrder(orderId).finally(() => wx.stopPullDownRefresh())
  },
}, ({ messages }) => messages.orderDetail))
