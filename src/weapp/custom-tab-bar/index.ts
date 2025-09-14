Component({
  data: {
    active: 0,
    routes: [
      '/pages/index/index',
      '/pages/category/index',
      '/pages/cart/index',
      '/pages/profile/index',
    ],
  },
  lifetimes: {
    attached() {
      // Set initial active based on current route
      const pages = getCurrentPages();
      const curr = pages[pages.length - 1]?.route ? `/${pages[pages.length - 1].route}` : '';
      const idx = this.data.routes.indexOf(curr);
      if (idx >= 0) {
        this.setData({ active: idx });
      }
    },
  },
  methods: {
    setActiveByRoute(route: string) {
      const idx = this.data.routes.indexOf(route);
      if (idx >= 0 && idx !== (this.data as any).active) {
        this.setData({ active: idx });
      }
    },
    onChange(e: WechatMiniprogram.CustomEvent) {
      const index = e.detail as number;
      this.setData({ active: index });
      const url = this.data.routes[index];
      if (url) {
        wx.switchTab({ url });
      }
    },
  },
});
