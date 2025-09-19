const STORAGE_KEY = '__SHOP_AUTOMATOR_ENDPOINT__'
const BRIDGE_STATE_KEY = '__SHOP_AUTOMATOR_BRIDGE_STATE__'

function isValidEndpoint(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
}

type CallFunction = (options: any) => Promise<any>

type BridgeState = {
  endpoint: string
  appliedAt: number
  originalCallFunction?: CallFunction
  originalRequestPayment?: typeof wx.requestPayment
}

function setBridgeState(state: BridgeState) {
  // @ts-ignore - augment wx with private state container
  ;(wx as any)[BRIDGE_STATE_KEY] = state
}

function getBridgeState(): BridgeState | undefined {
  // @ts-ignore - private field for bridge bookkeeping
  return (wx as any)[BRIDGE_STATE_KEY] as BridgeState | undefined
}

function applyBridgeOnce(endpoint: string): boolean {
  const previous = getBridgeState()
  if (previous && previous.endpoint === endpoint) {
    return true
  }

  const cloud = (wx.cloud || {}) as { callFunction?: CallFunction }
  const originalCallFunction = typeof cloud.callFunction === 'function' ? cloud.callFunction.bind(cloud) : undefined

  function proxyCallFunction(options: any) {
    const payload = options?.data || {}
    return new Promise<any>((resolve, reject) => {
      wx.request({
        url: endpoint,
        method: 'POST',
        data: payload,
        header: { 'content-type': 'application/json' },
        success(res) {
          resolve({
            result: res.data,
            errMsg: 'cloud.callFunction:ok',
          })
        },
        fail(error) {
          if (originalCallFunction) {
            Promise.resolve(originalCallFunction(options)).then(resolve).catch(reject)
            return
          }
          reject(error)
        },
      })
    })
  }

  const originalRequestPayment = typeof wx.requestPayment === 'function' ? wx.requestPayment.bind(wx) : undefined

  function proxyRequestPayment(options: WechatMiniprogram.RequestPaymentOption) {
    const result: WechatMiniprogram.GeneralCallbackResult = { errMsg: 'requestPayment:ok' }
    queueMicrotask(() => {
      options?.success?.(result)
      options?.complete?.(result)
    })
    return Promise.resolve(result)
  }

  if (!wx.cloud) {
    // Ensure cloud namespace exists before assigning
    // @ts-ignore - create cloud namespace
    wx.cloud = cloud
  }

  cloud.callFunction = proxyCallFunction as typeof cloud.callFunction
  wx.requestPayment = proxyRequestPayment

  setBridgeState({
    endpoint,
    appliedAt: Date.now(),
    originalCallFunction,
    originalRequestPayment,
  })
  return true
}

function ensureBridge(): boolean {
  try {
    const value = wx.getStorageSync(STORAGE_KEY)
    if (!isValidEndpoint(value)) {
      return false
    }
    return applyBridgeOnce(value)
  } catch (error) {
    console.warn('[automator-bridge] failed to apply bridge', error)
    return false
  }
}

export function bootstrapAutomatorBridge(): () => boolean {
  ensureBridge()
  return ensureBridge
}
