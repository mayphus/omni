import { z } from 'zod'
import { callShopFunction } from '../lib/cloudbase'
import { zShopSuccess } from './shop'
import { zUserWithId, type UserWithId } from '@shared/models/user'

const zListUsersResponse = zShopSuccess.extend({
  users: z.array(zUserWithId),
})

export async function listUsers(): Promise<UserWithId[]> {
  const res = await callShopFunction<{ users: unknown }>('v1.admin.users.list')
  const parsed = zListUsersResponse.parse(res)
  return parsed.users
}
