// Canonical CloudBase collection names used across runtimes. Keeping them in
// one place prevents typo bugs and helps tooling reuse the same constants.
export const Collections = {
  Users: 'users',
  Products: 'products',
  Orders: 'orders',
  System: 'system',
} as const

export type CollectionName = typeof Collections[keyof typeof Collections]
