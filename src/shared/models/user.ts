import { z } from 'zod'
import { zBaseDoc } from '../base'
import { zYuan } from '../money'

// User documents bridge WeChat identities with our CRM needs. Wallet balances
// remain in yuan to align with the mini program purchase experience.

export const zUserRole = z.enum(['user', 'admin'])
export type UserRole = z.infer<typeof zUserRole>

export const zWallet = z.object({
  currency: z.literal('CNY').default('CNY'),
  balanceYuan: zYuan.min(0).default(0),
  frozenYuan: zYuan.min(0).default(0),
})
export type Wallet = z.infer<typeof zWallet>

export const zUserProfile = z.object({
  nickname: z.string().min(1),
  avatarUrl: z.string().url().optional().or(z.literal('')).optional(),
  phone: z.string().optional(),
})
export type UserProfile = z.infer<typeof zUserProfile>

// Core profile for anyone interacting with the shop. Roles gate admin
// experiences, while wallet/referral fields unlock future growth tactics.
export const zUser = z
  .object({
    openid: z.string().min(1),
    unionid: z.string().optional(),
    roles: z.array(zUserRole).default(['user']),
    profile: zUserProfile,
    referrerId: z.string().optional(),
    referralCode: z.string().optional(),
    wallet: zWallet.default({ currency: 'CNY', balanceYuan: 0, frozenYuan: 0 }),
  })
  .merge(zBaseDoc)

export type User = z.infer<typeof zUser>

export const zUserWithId = zUser.extend({ id: z.string() })
export type UserWithId = z.infer<typeof zUserWithId>
