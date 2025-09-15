type SubCategory = { id: string; name: string; icon?: string };
type Category = { id: string; name: string; children: SubCategory[] };

Page({
  data: {
    active: 'all' as string,
    categories: [
      {
        id: 'all',
        name: 'All',
        children: [
          { id: 'hot', name: 'Hot', icon: 'hot-o' },
          { id: 'new', name: 'New', icon: 'new-o' },
          { id: 'deals', name: 'Deals', icon: 'coupon-o' },
          { id: 'favorites', name: 'Favorites', icon: 'like-o' },
          { id: 'essentials', name: 'Essentials', icon: 'cart-o' },
          { id: 'gifts', name: 'Gifts', icon: 'gift-o' },
          { id: 'support', name: 'Support', icon: 'service-o' },
        ],
      },
      {
        id: 'fashion',
        name: 'Fashion',
        children: [
          { id: 'men', name: 'Men' },
          { id: 'women', name: 'Women' },
          { id: 'kids', name: 'Kids' },
          { id: 'shoes', name: 'Shoes' },
          { id: 'accessories', name: 'Accessories' },
        ],
      },
      {
        id: 'electronics',
        name: 'Electronics',
        children: [
          { id: 'phones', name: 'Phones' },
          { id: 'laptops', name: 'Laptops' },
          { id: 'audio', name: 'Audio' },
          { id: 'smart-home', name: 'Smart Home' },
        ],
      },
      {
        id: 'home',
        name: 'Home',
        children: [
          { id: 'kitchen', name: 'Kitchen' },
          { id: 'decor', name: 'Decor' },
          { id: 'bedding', name: 'Bedding' },
          { id: 'cleaning', name: 'Cleaning' },
        ],
      },
    ] as Category[],
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
});
