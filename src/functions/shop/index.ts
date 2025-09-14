/** Minimal Cloud Function: ping */

type ApiResponse = { success: true; [k: string]: any } | { success: false; error?: string; [k: string]: any }
const ok = (data: any = {}): ApiResponse => ({ success: true, timestamp: new Date().toISOString(), ...data })
const fail = (error: string, data: any = {}): ApiResponse => ({ success: false, timestamp: new Date().toISOString(), error, ...data })

const handlers: Record<string, (event: any) => Promise<ApiResponse> | ApiResponse> = {
  'v1.system.ping': async () => ok({ message: 'pong' }),
}

export const main = async (event: any) => {
  const start = Date.now()
  try {
    if (!event?.action) return fail('Missing action parameter')
    const handler = handlers[event.action]
    if (!handler) return fail(`Unknown action: ${event.action}`, { availableActions: Object.keys(handlers).sort() })
    const result = await handler(event)
    return { ...result, action: event.action, executionTime: Date.now() - start }
  } catch (e: any) {
    return fail(`Internal error: ${e?.message || e}`)
  }
}

