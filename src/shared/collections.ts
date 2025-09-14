export const Collections = {
  Users: 'users',
  Products: 'products',
  Orders: 'orders',
  System: 'system',
} as const

export type CollectionName = typeof Collections[keyof typeof Collections]
