import { withI18nPage } from '../../utils/i18n'

Page(withI18nPage({
  onShow() {
    const tabBar = (this as any).getTabBar?.();
    // @ts-ignore WeChat runtime
    tabBar?.setActiveByRoute?.('/pages/cart/index');
  },
  onGoShopping() {
    wx.switchTab({ url: '/pages/index/index' });
  },
}, ({ messages }) => messages.cart));
