import { z } from 'zod'

// Yuan amounts are represented as decimal numbers with up to 2 fraction digits.
// This avoids developer confusion while still allowing conversion to provider-required cents.
export const zYuan = z
  .number()
  .finite()
  .refine((v) => Number.isInteger(Math.round(v * 100)), {
    message: 'Amount must have at most 2 decimal places',
  })

export function yuanToCents(amount: number | string): number {
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (!Number.isFinite(n)) throw new Error('Invalid yuan amount')
  return Math.round(n * 100)
}

export function centsToYuan(cents: number): number {
  if (!Number.isFinite(cents)) throw new Error('Invalid cents amount')
  return Number((cents / 100).toFixed(2))
}

export function formatCNY(yuan: number, locale: string = 'zh-CN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY' }).format(yuan)
}

