import path from 'node:path'
import fs from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import automator from 'miniprogram-automator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Collections } from '@shared/collections'
import { importShop, testCloud } from '../functions/helpers/cloud'

const CLI_PATH =
  process.env.WECHAT_DEVTOOLS_CLI ||
  process.env.WECHAT_DEVTOOLS_CLI_PATH ||
  process.env.MINIPROGRAM_AUTOMATOR_CLI ||
  process.env.SHOP_AUTOMATOR_CLI

const FORCE_E2E = process.env.SHOP_FORCE_E2E === '1'
const CLI_AVAILABLE = Boolean(CLI_PATH && fs.existsSync(CLI_PATH))
const CAN_RUN = CLI_AVAILABLE && FORCE_E2E

if (!FORCE_E2E) {
  // eslint-disable-next-line no-console
  console.warn('[weapp e2e] Skipping: set SHOP_FORCE_E2E=1 to enable automation run (requires WeChat DevTools CLI).')
} else if (!CLI_AVAILABLE) {
  // eslint-disable-next-line no-console
  console.warn('[weapp e2e] WeChat DevTools CLI not found at provided path; skipping end-to-end test.')
}

const PROJECT_CONFIG = path.resolve(__dirname, '../../project.config.json')
const BUILT_MINIAPP_ENTRY = path.resolve(__dirname, '../../weapp/app.json')
const AUTOMATOR_STORAGE_KEY = '__SHOP_AUTOMATOR_ENDPOINT__'

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForPage(miniProgram: any, target: string, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const page = await miniProgram.currentPage()
    if (page?.path?.includes(target)) {
      return page
    }
    await wait(100)
  }
  throw new Error(`Timed out waiting for page ${target}`)
}

const SUITE_TITLE = 'weapp shop flow (miniprogram-automator)'

if (!CAN_RUN) {
  describe.skip(SUITE_TITLE, () => {
    it('skipped because WECHAT_DEVTOOLS_CLI is not configured', () => {
      expect(CAN_RUN).toBe(true)
    })
  })
} else {
  describe(SUITE_TITLE, () => {
    const originalEnv = {
      subMchId: process.env.WECHAT_PAY_SUB_MCH_ID,
      envId: process.env.WECHAT_PAY_ENV_ID,
      notifyFn: process.env.WECHAT_PAY_NOTIFY_FUNCTION,
    }

    let server: ReturnType<typeof createServer> | null = null
    let endpoint = ''
    let miniProgram: automator.MiniProgram | null = null
    let productId = ''

    beforeAll(async () => {
      expect(fs.existsSync(PROJECT_CONFIG)).toBe(true)
      expect(fs.existsSync(BUILT_MINIAPP_ENTRY)).toBe(true)

      process.env.WECHAT_PAY_SUB_MCH_ID = 'e2e-sub-mch'
      process.env.WECHAT_PAY_ENV_ID = 'e2e-env'
      process.env.WECHAT_PAY_NOTIFY_FUNCTION = 'shop'

      testCloud.reset()
      testCloud.setContext({ OPENID: 'e2e-openid', TCB_UUID: 'e2e-uuid' })

      const now = Date.now()
      productId = testCloud.insert(Collections.Products, {
        title: 'E2E Strawberry Gift Box',
        subtitle: 'Sweet and seasonal',
        description: 'Packed with hand-picked berries',
        images: [{ fileId: 'strawberry', url: 'https://example.com/strawberry.jpg' }],
        price: { currency: 'CNY', priceYuan: 48.5 },
        stock: 10,
        isActive: true,
        createdAt: now - 1000,
        updatedAt: now - 500,
      })

      const { main } = await importShop()

      server = createServer(async (req, res) => {
        if (!req.url || req.url !== '/cloud' || req.method !== 'POST') {
          res.statusCode = 404
          res.end()
          return
        }
        try {
          const chunks: Uint8Array[] = []
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
          }
          const raw = Buffer.concat(chunks).toString('utf8')
          const body = raw ? JSON.parse(raw) : {}
          const result = await main(body || {})
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (error: any) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              success: false,
              error: error?.message || 'Cloud handler error',
            }),
          )
        }
      })

      await new Promise<void>((resolve) => {
        server!.listen(0, '127.0.0.1', () => resolve())
      })
      const address = server.address() as AddressInfo
      endpoint = `http://127.0.0.1:${address.port}/cloud`

      miniProgram = await automator.launch({
        projectPath: PROJECT_CONFIG,
        cliPath: CLI_PATH!,
      })

      await miniProgram.evaluate((args) => {
        try {
          wx.setStorageSync(args.key, args.value)
        } catch (error) {
          console.error('Failed to set storage for automator bridge', error)
        }
      }, { key: AUTOMATOR_STORAGE_KEY, value: endpoint })

      await miniProgram.evaluate(() => {
        const app = getApp()
        if (app && typeof app.reapplyAutomatorBridge === 'function') {
          app.reapplyAutomatorBridge()
        }
      })
    }, 120_000)

    afterAll(async () => {
      if (originalEnv.subMchId === undefined) delete process.env.WECHAT_PAY_SUB_MCH_ID
      else process.env.WECHAT_PAY_SUB_MCH_ID = originalEnv.subMchId

      if (originalEnv.envId === undefined) delete process.env.WECHAT_PAY_ENV_ID
      else process.env.WECHAT_PAY_ENV_ID = originalEnv.envId

      if (originalEnv.notifyFn === undefined) delete process.env.WECHAT_PAY_NOTIFY_FUNCTION
      else process.env.WECHAT_PAY_NOTIFY_FUNCTION = originalEnv.notifyFn

      if (miniProgram) {
        await miniProgram.close()
      }
      if (server) {
        await new Promise<void>((resolve) => server!.close(() => resolve()))
      }
    })

    it('completes the cart-to-order workflow', async () => {
      if (!miniProgram) throw new Error('MiniProgram client unavailable')

      const indexPage = await miniProgram.reLaunch('/pages/index/index')
      await indexPage.waitFor('van-card')

      const cards = await indexPage.$$('van-card')
      expect(cards.length).toBeGreaterThan(0)
      await cards[0].tap()

      const productPage = await waitForPage(miniProgram, 'pages/product/detail')
      await productPage.waitFor('van-goods-action-button')
      await productPage.callMethod('onAddToCart')
      await productPage.callMethod('onConfirmPurchase')

      await miniProgram.switchTab('/pages/cart/index')
      const cartPage = await waitForPage(miniProgram, 'pages/cart/index')
      await cartPage.waitFor('van-submit-bar')
      await cartPage.callMethod('onCheckout')

      const checkoutPage = await waitForPage(miniProgram, 'pages/checkout/index')
      await checkoutPage.waitFor('van-button')
      await checkoutPage.callMethod('onSubmit')

      await waitForPage(miniProgram, 'pages/orders/index', 8_000)

      const orders = testCloud.getData(Collections.Orders)
      expect(orders.length).toBeGreaterThanOrEqual(1)
      const order = orders[orders.length - 1]
      expect(order.status).toBe('paid')
      expect(order.items?.[0]?.productId).toBe(productId)
    }, 120_000)
  })
}
