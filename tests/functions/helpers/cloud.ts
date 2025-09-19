type Doc = Record<string, any>

type SortConfig = { field: string; direction: 'asc' | 'desc' } | null

type QueryState = {
  name: string
  query: Record<string, any>
  sort: SortConfig
  limit?: number
  skip?: number
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function getDocs(state: QueryState, store: Record<string, Doc[]>) {
  const source = store[state.name] ? [...store[state.name]] : []
  let docs = source
  const keys = Object.keys(state.query)
  if (keys.length > 0) {
    docs = docs.filter((doc) => keys.every((key) => doc[key] === state.query[key]))
  }
  if (state.sort) {
    const { field, direction } = state.sort
    docs.sort((a, b) => {
      const av = a[field]
      const bv = b[field]
      if (av === bv) return 0
      if (av === undefined) return -1
      if (bv === undefined) return 1
      return av > bv ? 1 : -1
    })
    if (direction === 'desc') docs.reverse()
  }
  if (typeof state.skip === 'number') {
    docs = docs.slice(state.skip)
  }
  if (typeof state.limit === 'number') {
    docs = docs.slice(0, state.limit)
  }
  return docs
}

function createQuery(state: QueryState, store: Record<string, Doc[]>) {
  return {
    where(query: Record<string, any>) {
      return createQuery({ ...state, query: { ...state.query, ...query } }, store)
    },
    orderBy(field: string, direction: 'asc' | 'desc') {
      return createQuery({ ...state, sort: { field, direction } }, store)
    },
    limit(n: number) {
      return createQuery({ ...state, limit: n }, store)
    },
    skip(n: number) {
      return createQuery({ ...state, skip: n }, store)
    },
    async get() {
      const docs = getDocs(state, store).map((doc) => clone(doc))
      return { data: docs }
    },
    async count() {
      const docs = getDocs({ ...state, limit: undefined, skip: undefined }, store)
      return { total: docs.length }
    },
    async update({ data }: { data: Record<string, any> }) {
      const docs = getDocs(state, store)
      const payload = clone(data)
      for (const doc of docs) {
        Object.assign(doc, payload)
      }
      return { stats: { updated: docs.length } }
    },
    async remove() {
      const docs = getDocs(state, store)
      const ids = new Set(docs.map((doc) => doc._id))
      const original = store[state.name]
      const next = original.filter((doc) => !ids.has(doc._id))
      const removed = original.length - next.length
      store[state.name] = next
      return { stats: { removed } }
    },
  }
}

const store: Record<string, Doc[]> = new Proxy({}, {
  get(target, key: string) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = []
    }
    return target[key]
  },
})

let idCounter = 0
const defaultContext = () => ({ OPENID: 'mock-openid', TCB_UUID: 'mock-admin' })
let context = defaultContext()
type CloudPayHandler = {
  unifiedOrder?: (payload: Record<string, any>) => any
  queryOrder?: (payload: Record<string, any>) => any
  refund?: (payload: Record<string, any>) => any
}

let cloudPayHandlers: CloudPayHandler = {}
let lastUnifiedOrders = new Map<string, { totalFee: number }>()
let cloudPayEnabled = true

function resetCloudPay() {
  cloudPayHandlers = {}
  lastUnifiedOrders = new Map()
  cloudPayEnabled = true
}

function resetStore() {
  for (const key of Object.keys(store)) {
    store[key] = []
  }
  idCounter = 0
  context = defaultContext()
  resetCloudPay()
}

;(globalThis as any).__SHOP_TEST_OVERRIDES__ = {
  database: () => ({
    collection(name: string) {
      const baseState: QueryState = { name, query: {}, sort: null }
      const query = createQuery(baseState, store)
      return {
        where: query.where,
        orderBy: query.orderBy,
        limit: query.limit,
        skip: query.skip,
        get: query.get,
        count: query.count,
        async add({ data }: { data: Doc }) {
          const doc = clone(data)
          const _id = `mock-${++idCounter}`
          store[name].push({ _id, ...doc })
          return { _id }
        },
      }
    },
  }),
  getWXContext: () => ({ ...context }),
  cloudPay: () => {
    if (!cloudPayEnabled) {
      return new Proxy(
        {},
        {
          get() {
            return undefined
          },
        },
      )
    }

    const service = {
      unifiedOrder: async (payload: Record<string, any>) => {
        const totalFee = typeof payload?.totalFee === 'number' ? payload.totalFee : 0
        if (typeof payload?.outTradeNo === 'string') {
          lastUnifiedOrders.set(payload.outTradeNo, { totalFee })
        }
        if (cloudPayHandlers.unifiedOrder) {
          return await cloudPayHandlers.unifiedOrder(payload)
        }
        const outTradeNo = payload?.outTradeNo || `order-${Date.now()}`
        return {
          payment: {
            timeStamp: String(Date.now()),
            nonceStr: 'mock-nonce',
            package: `prepay_id=${outTradeNo}`,
            signType: 'RSA',
            paySign: 'mock-signature',
          },
          prepayId: `prepay-${outTradeNo}`,
          outTradeNo,
        }
      },
      queryOrder: async (payload: Record<string, any>) => {
        if (cloudPayHandlers.queryOrder) {
          return await cloudPayHandlers.queryOrder(payload)
        }
        const info = typeof payload?.outTradeNo === 'string' ? lastUnifiedOrders.get(payload.outTradeNo) : undefined
        const totalFee = info?.totalFee ?? 0
        const outTradeNo = payload?.outTradeNo || 'unknown'
        return {
          tradeState: 'SUCCESS',
          resultCode: 'SUCCESS',
          returnCode: 'SUCCESS',
          transactionId: `txn-${outTradeNo}`,
          totalFee,
        }
      },
      refund: async (payload: Record<string, any>) => {
        if (cloudPayHandlers.refund) {
          return await cloudPayHandlers.refund(payload)
        }
        return { resultCode: 'SUCCESS', returnCode: 'SUCCESS' }
      },
    }

    return new Proxy(service, {
      get(target, prop, receiver) {
        if (!cloudPayEnabled && (prop === 'unifiedOrder' || prop === 'queryOrder' || prop === 'refund')) {
          return undefined
        }
        const value = Reflect.get(target, prop, receiver)
        if (typeof value === 'function') {
          return value.bind(target)
        }
        return value
      },
    })
  },
}

export const testCloud = {
  reset: () => resetStore(),
  setContext: (ctx: Record<string, any>) => {
    context = { ...context, ...ctx }
  },
  getData: (name: string) => store[name].map((doc) => clone(doc)),
  getContext: () => ({ ...context }),
  insert: (name: string, doc: Doc) => {
    const payload = clone(doc)
    const _id = `mock-${++idCounter}`
    store[name].push({ _id, ...payload })
    return _id
  },
  patch: (name: string, id: string, changes: Doc) => {
    const doc = store[name].find((item) => item._id === id)
    if (doc) {
      Object.assign(doc, clone(changes))
    }
  },
  mockCloudPay: (handlers: CloudPayHandler) => {
    cloudPayHandlers = { ...cloudPayHandlers, ...handlers }
  },
  getLastUnifiedOrderTotals: () => Array.from(lastUnifiedOrders.entries()),
  setCloudPayEnabled: (enabled: boolean) => {
    cloudPayEnabled = enabled
  },
}

export async function importShop() {
  return import('../../../src/functions/shop/index')
}
