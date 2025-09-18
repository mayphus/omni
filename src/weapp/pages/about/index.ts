import { withI18nPage } from '../../utils/i18n'

Page(withI18nPage({
  data: {
    policyActiveKey: '',
  },

  onLoad() {
    const about = (this.data as any)?.i18n || {}
    const policies = Array.isArray(about?.policies?.items) ? about.policies.items : []
    const defaultKey = policies[0]?.key
    if (defaultKey) {
      this.setData({ policyActiveKey: defaultKey })
    }
  },

  onPolicyChange(event: WechatMiniprogram.CustomEvent) {
    const detail = event?.detail as any
    let value = ''
    if (Array.isArray(detail)) {
      value = detail[0] as string
    } else if (Array.isArray(detail?.name)) {
      value = detail.name[0] as string
    } else if (typeof detail?.name === 'string') {
      value = detail.name
    }
    this.setData({ policyActiveKey: value || this.data.policyActiveKey })
  },
}, ({ messages }) => messages.about))
