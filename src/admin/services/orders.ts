import { z } from 'zod'
import { callShopFunction } from '../lib/cloudbase'
import { zShopSuccess } from './shop'
import { zOrderWithId, type OrderWithId } from '@shared/models/order'

const zListOrdersResponse = zShopSuccess.extend({
  orders: z.array(zOrderWithId),
})

export async function listOrders(): Promise<OrderWithId[]> {
  const res = await callShopFunction<{ orders: unknown }>('v1.admin.orders.list')
  const parsed = zListOrdersResponse.parse(res)
  return parsed.orders
}
