const STORAGE_KEY = 'tongmeng-plant:locale'
const I18N_UNSUB_FIELD = '__i18nUnsub__'

type QuickCategoryItem = { icon: string; text: string }
type FeaturedProduct = { id: string; title: string; desc: string; price: string; tag?: string; tagType?: 'danger' | 'primary' }
type CategoryTab = {
  id: string
  name: string
  label: string
  children: Array<{ id: string; name: string; icon?: string }>
}
type OrderTab = { title: string; items: Array<{ title: string; label: string }> }
type GoodsActionButton = { type: 'warning' | 'danger'; text: string }

type I18nMessages = {
  localeLabel: string
  languages: Record<Locale, string>
  tabBar: {
    home: string
    category: string
    cart: string
    profile: string
  }
  index: {
    searchPlaceholder: string
    quickCategoriesTitle: string
    quickCategories: QuickCategoryItem[]
    featuredTitle: string
    featuredSubtitle: string
    featuredProducts: FeaturedProduct[]
    endDivider: string
  }
  search: {
    placeholder: string
    resultsTitle: string
    resultsSubtitle: string
    featuredProducts: FeaturedProduct[]
  }
  cart: {
    title: string
    delete: string
    checkout: string
    product: FeaturedProduct
  }
  checkout: {
    orderTitle: string
    summary: Array<{ title: string; value: string; label?: string; link?: boolean }>
    paymentTitle: string
    paymentValue: string
    payNow: string
  }
  orders: {
    tabs: OrderTab[]
  }
  product: {
    productTitle: string
    name: string
    desc: string
    priceLabel: string
    price: string
    ratingLabel: string
    rating: string
    optionsTitle: string
    color: string
    colorValue: string
    size: string
    sizeValue: string
    quantity: string
    detailsTab: string
    reviewsTab: string
    detailItems: string[]
    reviewItems: Array<{ title: string; label: string }>
    actionIcons: Array<{ icon: string; text: string; url?: string; linkType?: 'switchTab' | 'navigateTo' }>
    actionButtons: GoodsActionButton[]
  }
  category: {
    searchPlaceholder: string
    categories: CategoryTab[]
  }
  profile: {
    header: {
      signedOutTitle: string
      signedOutLabel: string
      signedInLabel: string
      vip: string
    }
    quickEntriesTitle: string
    quickEntries: Array<{ icon: string; text: string; url: string; linkType: 'navigateTo' }>
    ordersTitle: string
    myOrdersTitle: string
    myOrdersValue: string
    orderTabs: Array<{ url: string; text: string; icon: string; countKey: 'toPay' | 'toShip' | 'toReceive' | 'afterSale' }>
    moreTitle: string
    wallet: { label: string; badge: string; url: string }
    support: { label: string; url: string }
    settingsTitle: string
    aboutTitle: string
    languageAction: {
      title: string
      description: string
      confirm: string
      cancel: string
      success: string
    }
  }
  toast: {
    welcome: string
    signedIn: string
    loginFailed: string
    updateProfilePrompt: string
    defaultNickname: string
    updated: string
    updateFailed: string
    canceled: string
  }
}

type Locale = 'en' | 'zh'

const MESSAGES: Record<Locale, I18nMessages> = {
  en: {
    localeLabel: 'English',
    languages: { en: 'English', zh: '简体中文' },
    tabBar: {
      home: 'Home',
      category: 'Categories',
      cart: 'Cart',
      profile: 'Profile',
    },
    index: {
      searchPlaceholder: 'Search products',
      quickCategoriesTitle: 'Quick Categories',
      quickCategories: [
        { icon: 'shop-o', text: 'Categories' },
        { icon: 'hot-o', text: 'Hot' },
        { icon: 'new-o', text: 'New' },
        { icon: 'coupon-o', text: 'Coupons' },
        { icon: 'like-o', text: 'Favorites' },
        { icon: 'cart-o', text: 'Cart' },
        { icon: 'gift-o', text: 'Gifts' },
        { icon: 'service-o', text: 'Support' },
      ],
      featuredTitle: 'Featured',
      featuredSubtitle: 'Handpicked for you',
      featuredProducts: [
        { id: 'a', title: 'Sample Product A', desc: 'High quality product', price: '99.00', tag: 'NEW', tagType: 'danger' },
        { id: 'b', title: 'Sample Product B', desc: 'Comfortable and durable', price: '129.00', tag: 'HOT', tagType: 'primary' },
      ],
      endDivider: 'End',
    },
    search: {
      placeholder: 'Search products',
      resultsTitle: 'Results',
      resultsSubtitle: 'Showing sample items',
      featuredProducts: [
        { id: 'a', title: 'Sample Product A', desc: 'High quality product', price: '99.00' },
        { id: 'b', title: 'Sample Product B', desc: 'Comfortable and durable', price: '129.00' },
      ],
    },
    cart: {
      title: 'Cart Items',
      delete: 'Delete',
      checkout: 'Checkout',
      product: { id: 'b', title: 'Sample Product B', desc: 'Comfortable and durable', price: '129.00', tag: 'HOT', tagType: 'primary' },
    },
    checkout: {
      orderTitle: 'Order',
      summary: [
        { title: 'Checkout', label: 'Confirm your order', value: '' },
        { title: 'Items', value: '2' },
        { title: 'Subtotal', value: '¥228.00' },
        { title: 'Shipping', value: '¥0.00' },
        { title: 'Coupon', value: 'None', link: true },
      ],
      paymentTitle: 'Payment',
      paymentValue: 'WeChat Pay',
      payNow: 'Pay Now',
    },
    orders: {
      tabs: [
        {
          title: 'All',
          items: [
            { title: 'Order #1001', label: '2 items · ¥228.00' },
            { title: 'Order #1000', label: '1 item · ¥99.00' },
          ],
        },
        { title: 'To Pay', items: [{ title: 'Order #1002', label: 'Awaiting payment' }] },
        { title: 'To Ship', items: [{ title: 'Order #0999', label: 'Preparing shipment' }] },
        { title: 'To Receive', items: [{ title: 'Order #0998', label: 'In transit' }] },
        { title: 'After-sales', items: [{ title: 'Order #0997', label: 'Refund processing' }] },
      ],
    },
    product: {
      productTitle: 'Product',
      name: 'Sample Product',
      desc: 'Short description',
      priceLabel: 'Price',
      price: '¥129.00',
      ratingLabel: 'Rating',
      rating: '4.5',
      optionsTitle: 'Options',
      color: 'Color',
      colorValue: 'Red',
      size: 'Size',
      sizeValue: 'M',
      quantity: 'Quantity',
      detailsTab: 'Details',
      reviewsTab: 'Reviews',
      detailItems: ['Detail A', 'Detail B', 'Detail C'],
      reviewItems: [
        { title: 'Great product', label: 'by User A' },
        { title: 'Works well', label: 'by User B' },
      ],
      actionIcons: [
        { icon: 'chat-o', text: 'Service' },
        { icon: 'cart-o', text: 'Cart', url: '/pages/cart/index', linkType: 'switchTab' },
      ],
      actionButtons: [
        { type: 'warning', text: 'Add to Cart' },
        { type: 'danger', text: 'Buy Now' },
      ],
    },
    category: {
      searchPlaceholder: 'Search categories',
      categories: [
        {
          id: 'all',
          name: 'All',
          label: 'Browse All',
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
          label: 'Browse Fashion',
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
          label: 'Browse Electronics',
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
          label: 'Browse Home',
          children: [
            { id: 'kitchen', name: 'Kitchen' },
            { id: 'decor', name: 'Decor' },
            { id: 'bedding', name: 'Bedding' },
            { id: 'cleaning', name: 'Cleaning' },
          ],
        },
      ],
    },
    profile: {
      header: {
        signedOutTitle: 'Tap to sign in',
        signedOutLabel: 'Visitor mode',
        signedInLabel: 'View and edit your profile',
        vip: 'VIP',
      },
      quickEntriesTitle: 'Quick Entries',
      quickEntries: [
        { icon: 'coupon-o', text: 'Coupons', url: '/pages/coupon/index', linkType: 'navigateTo' },
        { icon: 'star-o', text: 'Favorites', url: '/pages/fav/goods', linkType: 'navigateTo' },
        { icon: 'underway-o', text: 'History', url: '/pages/history/index', linkType: 'navigateTo' },
      ],
      ordersTitle: 'Orders',
      myOrdersTitle: 'My Orders',
      myOrdersValue: 'All Orders',
      orderTabs: [
        { url: '/pages/orders/index?active=0', text: 'To Pay', icon: 'pending-payment', countKey: 'toPay' },
        { url: '/pages/orders/index?active=1', text: 'To Ship', icon: 'tosend', countKey: 'toShip' },
        { url: '/pages/orders/index?active=2', text: 'To Receive', icon: 'logistics', countKey: 'toReceive' },
        { url: '/pages/orders/index?active=5', text: 'After-sale', icon: 'after-sale', countKey: 'afterSale' },
      ],
      moreTitle: 'More',
      wallet: { label: 'Wallet', badge: 'Hot', url: '/pages/wallet/index' },
      support: { label: 'Support', url: '/pages/support/index' },
      settingsTitle: 'Settings',
      aboutTitle: 'About',
      languageAction: {
        title: 'Language',
        description: 'Switch display language',
        confirm: 'Confirm',
        cancel: 'Cancel',
        success: 'Language updated',
      },
    },
    toast: {
      welcome: 'Welcome!',
      signedIn: 'Signed in',
      loginFailed: 'Login failed',
      updateProfilePrompt: 'Update your profile for better experience',
      defaultNickname: 'WeChat User',
      updated: 'Updated',
      updateFailed: 'Update failed',
      canceled: 'Canceled',
    },
  },
  zh: {
    localeLabel: '简体中文',
    languages: { en: '英语', zh: '简体中文' },
    tabBar: {
      home: '首页',
      category: '分类',
      cart: '购物车',
      profile: '我的',
    },
    index: {
      searchPlaceholder: '搜索商品',
      quickCategoriesTitle: '快捷分类',
      quickCategories: [
        { icon: 'shop-o', text: '全部分类' },
        { icon: 'hot-o', text: '热销' },
        { icon: 'new-o', text: '上新' },
        { icon: 'coupon-o', text: '优惠券' },
        { icon: 'like-o', text: '收藏' },
        { icon: 'cart-o', text: '购物车' },
        { icon: 'gift-o', text: '礼品' },
        { icon: 'service-o', text: '客服' },
      ],
      featuredTitle: '精选推荐',
      featuredSubtitle: '为你精心挑选',
      featuredProducts: [
        { id: 'a', title: '示例商品 A', desc: '高品质好物', price: '99.00', tag: '新品', tagType: 'danger' },
        { id: 'b', title: '示例商品 B', desc: '舒适又耐用', price: '129.00', tag: '热卖', tagType: 'primary' },
      ],
      endDivider: '已经到底啦',
    },
    search: {
      placeholder: '搜索商品',
      resultsTitle: '搜索结果',
      resultsSubtitle: '展示示例商品',
      featuredProducts: [
        { id: 'a', title: '示例商品 A', desc: '高品质好物', price: '99.00' },
        { id: 'b', title: '示例商品 B', desc: '舒适又耐用', price: '129.00' },
      ],
    },
    cart: {
      title: '购物车商品',
      delete: '删除',
      checkout: '去结算',
      product: { id: 'b', title: '示例商品 B', desc: '舒适又耐用', price: '129.00', tag: '热卖', tagType: 'primary' },
    },
    checkout: {
      orderTitle: '订单信息',
      summary: [
        { title: '确认下单', label: '核对订单信息', value: '' },
        { title: '商品件数', value: '2' },
        { title: '商品小计', value: '¥228.00' },
        { title: '运费', value: '¥0.00' },
        { title: '优惠券', value: '未使用', link: true },
      ],
      paymentTitle: '支付方式',
      paymentValue: '微信支付',
      payNow: '立即支付',
    },
    orders: {
      tabs: [
        {
          title: '全部',
          items: [
            { title: '订单 #1001', label: '2 件商品 · ¥228.00' },
            { title: '订单 #1000', label: '1 件商品 · ¥99.00' },
          ],
        },
        { title: '待付款', items: [{ title: '订单 #1002', label: '等待付款' }] },
        { title: '待发货', items: [{ title: '订单 #0999', label: '备货中' }] },
        { title: '待收货', items: [{ title: '订单 #0998', label: '运输中' }] },
        { title: '售后', items: [{ title: '订单 #0997', label: '退款处理中' }] },
      ],
    },
    product: {
      productTitle: '商品信息',
      name: '示例商品',
      desc: '简短描述',
      priceLabel: '价格',
      price: '¥129.00',
      ratingLabel: '评分',
      rating: '4.5',
      optionsTitle: '选项',
      color: '颜色',
      colorValue: '红色',
      size: '尺码',
      sizeValue: 'M 码',
      quantity: '数量',
      detailsTab: '详情',
      reviewsTab: '评价',
      detailItems: ['详情 A', '详情 B', '详情 C'],
      reviewItems: [
        { title: '非常好用', label: '来自用户 A' },
        { title: '体验不错', label: '来自用户 B' },
      ],
      actionIcons: [
        { icon: 'chat-o', text: '客服' },
        { icon: 'cart-o', text: '购物车', url: '/pages/cart/index', linkType: 'switchTab' },
      ],
      actionButtons: [
        { type: 'warning', text: '加入购物车' },
        { type: 'danger', text: '立即购买' },
      ],
    },
    category: {
      searchPlaceholder: '搜索分类',
      categories: [
        {
          id: 'all',
          name: '全部',
          label: '浏览全部分类',
          children: [
            { id: 'hot', name: '热销', icon: 'hot-o' },
            { id: 'new', name: '上新', icon: 'new-o' },
            { id: 'deals', name: '优惠', icon: 'coupon-o' },
            { id: 'favorites', name: '收藏', icon: 'like-o' },
            { id: 'essentials', name: '必备', icon: 'cart-o' },
            { id: 'gifts', name: '礼品', icon: 'gift-o' },
            { id: 'support', name: '客服', icon: 'service-o' },
          ],
        },
        {
          id: 'fashion',
          name: '服饰',
          label: '浏览服饰分类',
          children: [
            { id: 'men', name: '男装' },
            { id: 'women', name: '女装' },
            { id: 'kids', name: '童装' },
            { id: 'shoes', name: '鞋靴' },
            { id: 'accessories', name: '配饰' },
          ],
        },
        {
          id: 'electronics',
          name: '数码',
          label: '浏览数码电子',
          children: [
            { id: 'phones', name: '手机' },
            { id: 'laptops', name: '电脑' },
            { id: 'audio', name: '影音' },
            { id: 'smart-home', name: '智能家居' },
          ],
        },
        {
          id: 'home',
          name: '家居',
          label: '浏览家居生活',
          children: [
            { id: 'kitchen', name: '厨房' },
            { id: 'decor', name: '家居饰品' },
            { id: 'bedding', name: '床品' },
            { id: 'cleaning', name: '清洁用品' },
          ],
        },
      ],
    },
    profile: {
      header: {
        signedOutTitle: '点击登录',
        signedOutLabel: '访客模式',
        signedInLabel: '查看并管理个人资料',
        vip: 'VIP',
      },
      quickEntriesTitle: '快捷入口',
      quickEntries: [
        { icon: 'coupon-o', text: '优惠券', url: '/pages/coupon/index', linkType: 'navigateTo' },
        { icon: 'star-o', text: '收藏夹', url: '/pages/fav/goods', linkType: 'navigateTo' },
        { icon: 'underway-o', text: '浏览记录', url: '/pages/history/index', linkType: 'navigateTo' },
      ],
      ordersTitle: '我的订单',
      myOrdersTitle: '全部订单',
      myOrdersValue: '查看全部',
      orderTabs: [
        { url: '/pages/orders/index?active=0', text: '待付款', icon: 'pending-payment', countKey: 'toPay' },
        { url: '/pages/orders/index?active=1', text: '待发货', icon: 'tosend', countKey: 'toShip' },
        { url: '/pages/orders/index?active=2', text: '待收货', icon: 'logistics', countKey: 'toReceive' },
        { url: '/pages/orders/index?active=5', text: '售后/退款', icon: 'after-sale', countKey: 'afterSale' },
      ],
      moreTitle: '更多服务',
      wallet: { label: '钱包', badge: '推荐', url: '/pages/wallet/index' },
      support: { label: '客服中心', url: '/pages/support/index' },
      settingsTitle: '设置',
      aboutTitle: '关于我们',
      languageAction: {
        title: '界面语言',
        description: '切换显示语言',
        confirm: '确定',
        cancel: '取消',
        success: '语言已更新',
      },
    },
    toast: {
      welcome: '欢迎！',
      signedIn: '登录成功',
      loginFailed: '登录失败',
      updateProfilePrompt: '完善资料以获得更佳体验',
      defaultNickname: '微信用户',
      updated: '已更新',
      updateFailed: '更新失败',
      canceled: '已取消',
    },
  },
}

let currentLocale: Locale = 'en'
let initialized = false

const listeners = new Set<(context: I18nContext) => void>()

type I18nContext = { locale: Locale; messages: I18nMessages }

type I18nSelector<T> = (context: I18nContext) => T

type Unsubscriber = () => void

function isLocale(value: any): value is Locale {
  return value === 'en' || value === 'zh'
}

function readStoredLocale(): Locale | undefined {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return undefined
  try {
    const stored = wx.getStorageSync(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {}
  return undefined
}

function persistLocale(locale: Locale) {
  if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') return
  try {
    wx.setStorageSync(STORAGE_KEY, locale)
  } catch {}
}

function detectSystemLocale(): Locale | undefined {
  if (typeof wx === 'undefined' || typeof wx.getSystemInfoSync !== 'function') return undefined
  try {
    const info = wx.getSystemInfoSync()
    const lang = (info.language || '').toLowerCase()
    if (lang.startsWith('zh')) return 'zh'
  } catch {}
  return undefined
}

function notify() {
  const context = { locale: currentLocale, messages: getMessages() }
  listeners.forEach((listener) => listener(context))
}

export function initI18n(): Locale {
  if (initialized) return currentLocale
  initialized = true
  const stored = readStoredLocale()
  if (stored) {
    currentLocale = stored
    return currentLocale
  }
  const systemLocale = detectSystemLocale()
  if (systemLocale) {
    currentLocale = systemLocale
  }
  return currentLocale
}

export function getLocale(): Locale {
  return currentLocale
}

export function getMessages(locale: Locale = currentLocale): I18nMessages {
  return MESSAGES[locale] || MESSAGES.en
}

export function setLocale(locale: Locale): boolean {
  if (!isLocale(locale)) return false
  if (locale === currentLocale) return true
  currentLocale = locale
  persistLocale(locale)
  notify()
  return true
}

export function getAvailableLocales(): Locale[] {
  return Object.keys(MESSAGES) as Locale[]
}

export function subscribeI18n(listener: (context: I18nContext) => void): Unsubscriber {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

type PageOptions = WechatMiniprogram.Page.Options<any, any>

type ComponentOptions = WechatMiniprogram.Component.Options<any, any, any, any, any>

type PageInstance = WechatMiniprogram.Page.Instance<any, any>

type ComponentInstance = WechatMiniprogram.Component.Instance<any, any, any, any, any>

type AnyInstance = PageInstance | ComponentInstance

export function withI18nPage<T>(options: PageOptions, selector: I18nSelector<T>, dataKey = 'i18n'): PageOptions {
  const initial = selector({ locale: getLocale(), messages: getMessages() })
  options.data = { ...(options.data || {}), [dataKey]: initial }

  const originalOnLoad = options.onLoad
  const originalOnUnload = options.onUnload

  options.onLoad = function (...args: any[]) {
    const update = (context: I18nContext) => {
      const value = selector(context)
      ;(this as AnyInstance).setData({ [dataKey]: value })
    }
    const self = this as AnyInstance & { [I18N_UNSUB_FIELD]?: Unsubscriber }
    self[I18N_UNSUB_FIELD]?.()
    self[I18N_UNSUB_FIELD] = subscribeI18n(update)
    update({ locale: getLocale(), messages: getMessages() })
    originalOnLoad?.apply(this, args as any)
  }

  options.onUnload = function (...args: any[]) {
    const self = this as AnyInstance & { [I18N_UNSUB_FIELD]?: Unsubscriber }
    self[I18N_UNSUB_FIELD]?.()
    self[I18N_UNSUB_FIELD] = undefined
    originalOnUnload?.apply(this, args as any)
  }

  return options
}

export function withI18nComponent<T>(options: ComponentOptions, selector: I18nSelector<T>, dataKey = 'i18n'): ComponentOptions {
  const initial = selector({ locale: getLocale(), messages: getMessages() })
  options.data = { ...(options.data || {}), [dataKey]: initial }

  const lifetimes = options.lifetimes || {}
  const originalAttached = lifetimes.attached || options.attached
  const originalDetached = lifetimes.detached || options.detached

  const attach = function (this: AnyInstance) {
    const update = (context: I18nContext) => {
      const value = selector(context)
      this.setData({ [dataKey]: value })
    }
    const self = this as AnyInstance & { [I18N_UNSUB_FIELD]?: Unsubscriber }
    self[I18N_UNSUB_FIELD]?.()
    self[I18N_UNSUB_FIELD] = subscribeI18n(update)
    update({ locale: getLocale(), messages: getMessages() })
    originalAttached?.call(this as any)
  }

  const detach = function (this: AnyInstance) {
    const self = this as AnyInstance & { [I18N_UNSUB_FIELD]?: Unsubscriber }
    self[I18N_UNSUB_FIELD]?.()
    self[I18N_UNSUB_FIELD] = undefined
    originalDetached?.call(this as any)
  }

  options.lifetimes = {
    ...lifetimes,
    attached: attach,
    detached: detach,
  }

  options.attached = attach
  options.detached = detach

  return options
}

export type { Locale, I18nMessages, I18nSelector, I18nContext }
