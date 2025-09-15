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

const zUpdateResponse = zShopSuccess.extend({
  product: zProductWithId,
})

const zDeleteResponse = zShopSuccess.extend({
  productId: z.string(),
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

export async function updateProduct(productId: string, input: ProductInput): Promise<ProductWithId> {
  const payload = zProductInput.parse(input)
  const res = await callShopFunction<{ product: unknown }>('v1.admin.products.update', {
    productId,
    product: payload,
  })
  const parsed = zUpdateResponse.parse(res)
  return parsed.product
}

export async function deleteProduct(productId: string): Promise<string> {
  const res = await callShopFunction<{ productId: unknown }>('v1.admin.products.delete', { productId })
  const parsed = zDeleteResponse.parse(res)
  return parsed.productId
}
