import { z } from 'zod'
import { callShopFunction } from '../lib/cloudbase'
import { zProductInput, zProductWithId, type ProductInput, type ProductWithId } from '@shared/models/product'

const zShopSuccess = z
  .object({
    success: z.literal(true),
    action: z.string(),
    executionTime: z.number(),
    timestamp: z.string(),
  })
  .passthrough()

const zListResponse = zShopSuccess.extend({
  products: z.array(zProductWithId),
})

const zCreateResponse = zShopSuccess.extend({
  product: zProductWithId,
})

export async function listProducts(): Promise<ProductWithId[]> {
  const res = await callShopFunction<{ products: unknown }>('v1.admin.products.list')
  const parsed = zListResponse.parse(res)
  return parsed.products
}

export async function createProduct(input: ProductInput): Promise<ProductWithId> {
  const payload = zProductInput.parse(input)
  const res = await callShopFunction<{ product: unknown }>('v1.admin.products.create', { product: payload })
  const parsed = zCreateResponse.parse(res)
  return parsed.product
}
