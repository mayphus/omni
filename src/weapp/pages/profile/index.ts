Page({
  onShow() {
    const tabBar = (this as any).getTabBar?.();
    // @ts-ignore: WeChat runtime API
    tabBar?.setActiveByRoute?.('/pages/profile/index');
  },
});

