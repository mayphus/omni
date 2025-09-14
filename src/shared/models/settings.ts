import { z } from 'zod'
import { zBaseDoc } from '../base'

export const zSetting = z
  .object({
    key: z.string().min(1),
    value: z.any(),
    description: z.string().optional(),
  })
  .merge(zBaseDoc)

export type Setting = z.infer<typeof zSetting>

