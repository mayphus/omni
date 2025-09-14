export const Collections = {
  Users: 'users',
  Products: 'products',
  Orders: 'orders',
  Carts: 'carts',
  Transactions: 'transactions',
  Referrals: 'referrals',
  AuditLogs: 'audit_logs',
  Settings: 'settings',
} as const

export type CollectionName = typeof Collections[keyof typeof Collections]

