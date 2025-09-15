import { withI18nPage } from '../../utils/i18n'

Page(withI18nPage({
  data: {
    // 0: All, 1: To Pay, 2: To Ship, 3: To Receive, 4: After-sales
    active: 0,
  },
  onLoad(query: Record<string, string>) {
    const n = Number(query?.active)
    if (!Number.isNaN(n) && n >= 0 && n <= 4) {
      this.setData({ active: n })
    }
  },
  onTabChange(e: WechatMiniprogram.CustomEvent) {
    const detail: any = e.detail
    const idx = typeof detail === 'number' ? detail : detail?.index ?? 0
    this.setData({ active: idx })
  },
}, ({ messages }) => messages.orders));
