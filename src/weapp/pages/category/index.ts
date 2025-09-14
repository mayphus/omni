Page({
  onShow() {
    const tabBar = (this as any).getTabBar?.();
    // @ts-ignore WeChat runtime
    tabBar?.setActiveByRoute?.('/pages/category/index');
  },
});

