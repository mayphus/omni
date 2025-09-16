import { z } from 'zod'
import { callShopFunction } from '../lib/cloudbase'
import { zShopSuccess } from './shop'
import { zOrderWithId, type OrderWithId } from '@shared/models/order'

const zDashboardSummaryResponse = zShopSuccess.extend({
  summary: z.object({
    totalRevenueYuan: z.number().nonnegative(),
    totalOrders: z.number().int().nonnegative(),
    paidOrders: z.number().int().nonnegative(),
    pendingOrders: z.number().int().nonnegative(),
    customerCount: z.number().int().nonnegative(),
  }),
  recentOrders: z.array(zOrderWithId),
})

export type DashboardSummary = z.infer<typeof zDashboardSummaryResponse>['summary']

export async function fetchDashboardSummary(): Promise<{
  summary: DashboardSummary
  recentOrders: OrderWithId[]
}> {
  const res = await callShopFunction<{
    summary: unknown
    recentOrders: unknown
  }>('v1.admin.dashboard.summary')
  const parsed = zDashboardSummaryResponse.parse(res)
  return {
    summary: parsed.summary,
    recentOrders: parsed.recentOrders,
  }
}
