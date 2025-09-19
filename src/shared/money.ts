import { z } from 'zod'

// Money helpers keep customer-facing prices (yuan) aligned with provider
// expectations (integer cents). All business logic should go through these
// utilities instead of re-implementing rounding rules in handlers.

// Yuan amounts are represented as decimal numbers with up to 2 fraction digits.
// This avoids developer confusion while still allowing conversion to provider-required cents.
export const zYuan = z
  .number()
  .finite()
  .refine((v) => Number.isInteger(Math.round(v * 100)), {
    message: 'Amount must have at most 2 decimal places',
  })

// Convert a display amount to the integer format required by WeChat Pay and
// accounting exports. Accepts strings because admin forms post text values.
export function yuanToCents(amount: number | string): number {
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (!Number.isFinite(n)) throw new Error('Invalid yuan amount')
  return Math.round(n * 100)
}

// Reverse conversion used when reading provider webhooks or settlement files.
export function centsToYuan(cents: number): number {
  if (!Number.isFinite(cents)) throw new Error('Invalid cents amount')
  return Number((cents / 100).toFixed(2))
}

// Locale-aware formatter for UI surfaces (admin dashboards, receipts).
export function formatCNY(yuan: number, locale: string = 'zh-CN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY' }).format(yuan)
}
