import { withI18nPage } from '../../utils/i18n'

Page(withI18nPage({
  data: {
    productId: '',
  },
  onLoad(query: Record<string, string | undefined>) {
    const id = query?.id || ''
    if (typeof id === 'string') {
      this.setData({ productId: id })
    }
  },
}, ({ messages }) => messages.product));
