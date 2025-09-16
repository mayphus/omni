import { z } from 'zod'

export const zShopSuccess = z
  .object({
    success: z.literal(true),
    action: z.string(),
    executionTime: z.number(),
    timestamp: z.string(),
  })
  .passthrough()
