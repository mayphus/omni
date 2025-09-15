import { withI18nPage } from '../../utils/i18n'

Page(withI18nPage({
  onShow() {
    const tabBar = (this as any).getTabBar?.();
    // @ts-ignore WeChat runtime
    tabBar?.setActiveByRoute?.('/pages/cart/index');
  },
}, ({ messages }) => messages.cart));
