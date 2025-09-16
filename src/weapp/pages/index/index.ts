import { definePage } from '@vue-mini/core'
import { withI18nPage } from '../../utils/i18n'

definePage(withI18nPage({
  setup() {
    const onOpenSearch = () => {
      wx.navigateTo({ url: '/pages/search/index' })
    }
    return { onOpenSearch }
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.();
    // @ts-ignore: WeChat runtime API
    tabBar?.setActiveByRoute?.('/pages/index/index');
  },
}, ({ messages }) => messages.index))
