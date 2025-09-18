import { z } from 'zod'
import { callShopFunction } from '../lib/cloudbase'
import { zShopSuccess } from './shop'
import { zOrderWithId, type OrderWithId } from '@shared/models/order'

const zListOrdersResponse = zShopSuccess.extend({
  orders: z.array(zOrderWithId),
})

const zUpdateOrderStatusResponse = zShopSuccess.extend({
  order: zOrderWithId,
})

export async function listOrders(): Promise<OrderWithId[]> {
  const res = await callShopFunction<{ orders: unknown }>('v1.admin.orders.list')
  const parsed = zListOrdersResponse.parse(res)
  return parsed.orders
}

export async function updateOrderStatus(orderId: string, status: OrderWithId['status']): Promise<OrderWithId> {
  const res = await callShopFunction<{ order: unknown }>('v1.admin.orders.updateStatus', { orderId, status })
  const parsed = zUpdateOrderStatusResponse.parse(res)
  return parsed.order
}
