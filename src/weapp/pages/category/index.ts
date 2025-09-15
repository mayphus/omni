import { withI18nPage } from '../../utils/i18n'

Page(withI18nPage({
  data: {
    active: 'all' as string,
  },

  onLoad(query: Record<string, string | undefined>) {
    const active = query?.active as string | undefined;
    if (active) this.setData({ active });
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.();
    // @ts-ignore WeChat runtime
    tabBar?.setActiveByRoute?.('/pages/category/index');
  },

  onTabChange(e: WechatMiniprogram.CustomEvent) {
    // Vant Tabs emits { name, title } in detail; fallback to detail for older versions
    const detail: any = e.detail || {};
    const name = (detail.name ?? detail).toString();
    this.setData({ active: name });
  },
}, ({ messages }) => messages.category));
