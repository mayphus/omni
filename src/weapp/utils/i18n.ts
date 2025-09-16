const STORAGE_KEY = 'tongmeng-plant:locale'
const I18N_UNSUB_FIELD = '__i18nUnsub__'

type QuickCategoryItem = { icon: string; text: string }
type FeaturedProduct = { id: string; title: string; desc: string; price: string; tag?: string; tagType?: 'danger' | 'primary' }
type IndexBanner = { id: string; image: string; title: string; caption: string }
type IndexStatusItem = { icon: string; title: string; description: string }
type SupportCard = { icon: string; title: string; description: string }
type CategoryTab = {
  id: string
  name: string
  label: string
  children: Array<{ id: string; name: string; icon?: string }>
}
type OrderTab = { title: string; items: Array<{ title: string; label: string }> }
type GoodsActionButton = { type: 'warning' | 'danger'; text: string; disabled?: boolean }
type CartInfoItem = { icon: string; title: string; value: string }
type SupportEntry = { icon: string; text: string; url: string; linkType: 'switchTab' | 'navigateTo' }

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
    announcement: string
    heroBanners: IndexBanner[]
    quickCategoriesTitle: string
    quickCategories: QuickCategoryItem[]
    statusTitle: string
    statusItems: IndexStatusItem[]
    featuredTitle: string
    featuredSubtitle: string
    featuredProducts: FeaturedProduct[]
    featuredEmptyTitle: string
    featuredEmptyDescription: string
    featuredEmptyAction: string
    featuredErrorTitle: string
    featuredErrorDescription: string
    featuredErrorAction: string
    supportTitle: string
    supportItems: SupportCard[]
    endDivider: string
    searchResultsTitle: string
    loadingText: string
  }
  search: {
    placeholder: string
    resultsTitle: string
    resultsSubtitle: string
    featuredProducts: FeaturedProduct[]
    popularTitle: string
    popularKeywords: string[]
    tipsTitle: string
    tips: string[]
    emptyTitle: string
    emptyDescription: string
    loadingText: string
  }
  cart: {
    title: string
    emptyTitle: string
    emptyDescription: string
    goShopping: string
    infoTitle: string
    infoItems: CartInfoItem[]
    removeButton: string
    clearButton: string
    continueButton: string
    checkoutButton: string
    emptyToast: string
  }
  checkout: {
    orderTitle: string
    summary: Array<{ title: string; value: string; label?: string; link?: boolean }>
    paymentTitle: string
    paymentValue: string
    payNow: string
    emptyTitle: string
    emptyDescription: string
    itemsTitle: string
    summaryTitle: string
    emptyButton: string
    successToast: string
    emptyToast: string
    quantityLabel: string
    subtotalLabel: string
    shippingLabel: string
    totalLabel: string
  }
  orders: {
    tabs: OrderTab[]
    emptyTitle: string
    emptyDescription: string
    orderLabel: string
    statusLabel: string
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
    comingSoonTitle: string
    comingSoonDescription: string
    actionIcons: Array<{ icon: string; text: string; url?: string; linkType?: 'switchTab' | 'navigateTo' }>
    actionButtons: GoodsActionButton[]
    retryButton: string
    addedToast: string
  }
  category: {
    searchPlaceholder: string
    emptyTitle: string
    emptyDescription: string
    errorTitle: string
    errorDescription: string
    errorAction: string
    categories: CategoryTab[]
    productsTitle: string
    searchResultsTitle: string
    loadingText: string
  }
  profile: {
    header: {
      signedOutTitle: string
      signedOutLabel: string
      signedInLabel: string
      vip: string
    }
    quickEntriesTitle: string
    quickEntries: SupportEntry[]
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
      announcement: 'We are syncing the catalogue. New arrivals will appear here soon.',
      heroBanners: [
        {
          id: 'welcome',
          image: 'https://fastly.picsum.photos/seed/tongmeng-shop-1/900/480.jpg?hmac=NkbSY57I45b48bY8AEQmoeyoGxjJ7gP5cX4KletntuA',
          title: 'Grand opening soon',
          caption: 'Fresh picks for families are on the way.',
        },
        {
          id: 'quality',
          image: 'https://fastly.picsum.photos/seed/tongmeng-shop-2/900/480.jpg?hmac=mRh40S2mP1Ab3WBu45fSR0bRyvMXd_Nv27c1sa-UuwQ',
          title: 'Quality assured',
          caption: 'We are finalising suppliers to guarantee great value.',
        },
      ],
      quickCategoriesTitle: 'Quick Links',
      quickCategories: [
        { icon: 'shop-o', text: 'All' },
        { icon: 'hot-o', text: 'Trending' },
        { icon: 'bag-o', text: 'Essentials' },
        { icon: 'flower-o', text: 'Lifestyle' },
        { icon: 'vip-card-o', text: 'Member' },
        { icon: 'cart-o', text: 'Cart' },
        { icon: 'gift-o', text: 'Gifts' },
        { icon: 'service-o', text: 'Support' },
      ],
      statusTitle: 'Store update',
      statusItems: [
        { icon: 'clock-o', title: 'Inventory sync', description: 'Connecting with warehouse systems' },
        { icon: 'setting-o', title: 'Payments', description: 'WeChat Pay activation in progress' },
        { icon: 'friends-o', title: 'Member centre', description: 'Benefits will unlock at launch' },
      ],
      featuredTitle: 'Preview catalogue',
      featuredSubtitle: 'Real products will display here once the API is ready.',
      featuredProducts: [],
      featuredEmptyTitle: 'Catalog syncing',
      featuredEmptyDescription: 'Please check back soon to explore the full range.',
      featuredEmptyAction: 'Stay tuned',
      featuredErrorTitle: 'Unable to load products',
      featuredErrorDescription: 'Check your connection and try again.',
      featuredErrorAction: 'Retry',
      supportTitle: 'Need help?',
      supportItems: [
        { icon: 'guide-o', title: 'Shopping guide', description: 'Browse categories to plan your first order.' },
        { icon: 'chat-o', title: 'Customer care', description: 'Reach us via the WeChat official account anytime.' },
      ],
      endDivider: 'More updates soon',
      searchResultsTitle: 'Search results',
      loadingText: 'Loading…',
    },
    search: {
      placeholder: 'Search upcoming products',
      resultsTitle: 'Suggested keywords',
      resultsSubtitle: 'Real results will appear when the catalogue is online.',
      featuredProducts: [],
      popularTitle: 'Popular plans',
      popularKeywords: ['Daily essentials', 'Learning toys', 'Healthy snacks'],
      tipsTitle: 'Tips',
      tips: [
        'Use categories to explore while we prepare search results.',
        'Favourite items will sync automatically once the API responds.',
      ],
      emptyTitle: 'Results arriving soon',
      emptyDescription: 'Search will be enabled when the product service is connected.',
      loadingText: 'Loading…',
    },
    cart: {
      title: 'Shopping cart',
      emptyTitle: 'Your cart is empty',
      emptyDescription: 'Items you add will appear here once the shop opens.',
      goShopping: 'Browse homepage',
      infoTitle: 'What to expect',
      infoItems: [
        { icon: 'diamond-o', title: 'Member discounts', value: 'Releasing soon' },
        { icon: 'points', title: 'Free shipping', value: 'Available after launch' },
        { icon: 'shield-o', title: 'Secure payments', value: 'WeChat Pay integration in progress' },
      ],
      removeButton: 'Remove',
      clearButton: 'Clear cart',
      continueButton: 'Continue shopping',
      checkoutButton: 'Checkout',
      emptyToast: 'Cart is empty',
    },
    checkout: {
      orderTitle: 'Order overview',
      summary: [
        { title: 'Status', value: 'Waiting for catalogue', label: 'Add items once products are live.' },
        { title: 'Delivery', value: 'Setup in progress' },
        { title: 'Payment', value: 'WeChat Pay activation pending' },
      ],
      paymentTitle: 'Payment',
      paymentValue: 'Unavailable until launch',
      payNow: 'Pay Now',
      emptyTitle: 'Checkout opens soon',
      emptyDescription: 'Create an order from the cart after the backend is online.',
      itemsTitle: 'Items',
      summaryTitle: 'Summary',
      emptyButton: 'Browse homepage',
      successToast: 'Order placed',
      emptyToast: 'Cart is empty',
      quantityLabel: 'Qty',
      subtotalLabel: 'Subtotal',
      shippingLabel: 'Shipping',
      totalLabel: 'Total',
    },
    orders: {
      tabs: [
        { title: 'All', items: [] },
        { title: 'To Pay', items: [] },
        { title: 'To Ship', items: [] },
        { title: 'To Receive', items: [] },
        { title: 'After-sales', items: [] },
      ],
      emptyTitle: 'No orders yet',
      emptyDescription: 'Your purchases will appear here once the shop opens.',
      orderLabel: 'Order',
      statusLabel: 'Status',
    },
    product: {
      productTitle: 'Product preview',
      name: 'Awaiting details',
      desc: 'Product information will show here when available.',
      priceLabel: 'Price',
      price: '—',
      ratingLabel: 'Rating',
      rating: 'Pending',
      optionsTitle: 'Options',
      color: 'Colour',
      colorValue: 'To be announced',
      size: 'Size',
      sizeValue: 'To be announced',
      quantity: 'Quantity',
      detailsTab: 'Details',
      reviewsTab: 'Reviews',
      detailItems: ['Full specifications will unlock after launch.'],
      reviewItems: [],
      comingSoonTitle: 'Preparing product data',
      comingSoonDescription: 'We are linking the product service. Please check back soon.',
      actionIcons: [
        { icon: 'chat-o', text: 'Service' },
        { icon: 'cart-o', text: 'Cart', url: '/pages/cart/index', linkType: 'switchTab' },
      ],
      actionButtons: [
        { type: 'warning', text: 'Add to Cart', disabled: true },
        { type: 'danger', text: 'Buy Now', disabled: true },
      ],
      retryButton: 'Retry',
      addedToast: 'Added to cart',
    },
    category: {
      searchPlaceholder: 'Search categories',
      emptyTitle: 'Categories syncing',
      emptyDescription: 'Please check back soon for the full catalogue.',
      errorTitle: 'Unable to load categories',
      errorDescription: 'Tap retry to try again.',
      errorAction: 'Retry',
      productsTitle: 'Products',
      searchResultsTitle: 'Search results',
      loadingText: 'Loading…',
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
      quickEntriesTitle: 'Quick entries',
      quickEntries: [
        { icon: 'home-o', text: 'Home', url: '/pages/index/index', linkType: 'switchTab' },
        { icon: 'apps-o', text: 'Categories', url: '/pages/category/index', linkType: 'switchTab' },
        { icon: 'orders-o', text: 'Orders', url: '/pages/orders/index', linkType: 'navigateTo' },
      ],
      ordersTitle: 'My orders',
      myOrdersTitle: 'Order history',
      myOrdersValue: 'Open list',
      orderTabs: [
        { url: '/pages/orders/index?active=1', text: 'To Pay', icon: 'pending-payment', countKey: 'toPay' },
        { url: '/pages/orders/index?active=2', text: 'To Ship', icon: 'tosend', countKey: 'toShip' },
        { url: '/pages/orders/index?active=3', text: 'To Receive', icon: 'logistics', countKey: 'toReceive' },
        { url: '/pages/orders/index?active=4', text: 'After-sale', icon: 'after-sale', countKey: 'afterSale' },
      ],
      moreTitle: 'More services',
      wallet: { label: 'Member centre', badge: 'Soon', url: '' },
      support: { label: 'Customer service', url: '' },
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
      announcement: '商品目录同步中，即将正式开业。',
      heroBanners: [
        {
          id: 'welcome',
          image: 'https://fastly.picsum.photos/seed/tongmeng-shop-1/900/480.jpg?hmac=NkbSY57I45b48bY8AEQmoeyoGxjJ7gP5cX4KletntuA',
          title: '商城即将开业',
          caption: '精选好物正在路上，敬请期待。',
        },
        {
          id: 'quality',
          image: 'https://fastly.picsum.photos/seed/tongmeng-shop-2/900/480.jpg?hmac=mRh40S2mP1Ab3WBu45fSR0bRyvMXd_Nv27c1sa-UuwQ',
          title: '严格甄选',
          caption: '供应链验收中，保障品质与价值。',
        },
      ],
      quickCategoriesTitle: '快捷入口',
      quickCategories: [
        { icon: 'shop-o', text: '全部' },
        { icon: 'hot-o', text: '热度' },
        { icon: 'bag-o', text: '日用' },
        { icon: 'flower-o', text: '生活' },
        { icon: 'vip-card-o', text: '会员' },
        { icon: 'cart-o', text: '购物车' },
        { icon: 'gift-o', text: '礼物' },
        { icon: 'service-o', text: '客服' },
      ],
      statusTitle: '商城进度',
      statusItems: [
        { icon: 'clock-o', title: '商品同步', description: '仓库系统接入中' },
        { icon: 'setting-o', title: '支付开通', description: '微信支付即将启用' },
        { icon: 'friends-o', title: '会员中心', description: '上线后即刻启用权益' },
      ],
      featuredTitle: '商品预览',
      featuredSubtitle: '接口准备好后将展示真实商品。',
      featuredProducts: [],
      featuredEmptyTitle: '商品同步中',
      featuredEmptyDescription: '稍后再来看看最新上架。',
      featuredEmptyAction: '敬请期待',
      featuredErrorTitle: '无法加载商品',
      featuredErrorDescription: '请检查网络后再试。',
      featuredErrorAction: '重试',
      supportTitle: '需要帮助？',
      supportItems: [
        { icon: 'guide-o', title: '选购指南', description: '先浏览分类，规划心仪清单。' },
        { icon: 'chat-o', title: '客服咨询', description: '可通过公众号随时联系我们。' },
      ],
      endDivider: '更多更新即将到来',
      searchResultsTitle: '搜索结果',
      loadingText: '加载中…',
    },
    search: {
      placeholder: '搜索即将上线的商品',
      resultsTitle: '推荐关键词',
      resultsSubtitle: '商品上线后将展示真实结果。',
      featuredProducts: [],
      popularTitle: '热门计划',
      popularKeywords: ['日常用品', '益智玩具', '健康零食'],
      tipsTitle: '小贴士',
      tips: ['目前可先通过分类浏览商品。', '收藏的商品将在上线后自动同步。'],
      emptyTitle: '搜索功能准备中',
      emptyDescription: '商品服务接入后即可使用搜索。',
      loadingText: '加载中…',
    },
    cart: {
      title: '购物车',
      emptyTitle: '购物车空空如也',
      emptyDescription: '商城开放后，加入的商品会出现在这里。',
      goShopping: '去首页逛逛',
      infoTitle: '购物提示',
      infoItems: [
        { icon: 'diamond-o', title: '会员优惠', value: '即将开放' },
        { icon: 'points', title: '包邮政策', value: '上线后公布' },
        { icon: 'shield-o', title: '支付安全', value: '微信支付接入中' },
      ],
      removeButton: '移除',
      clearButton: '清空购物车',
      continueButton: '继续逛逛',
      checkoutButton: '去结算',
      emptyToast: '购物车为空',
    },
    checkout: {
      orderTitle: '订单概览',
      summary: [
        { title: '状态', value: '等待商品上线', label: '商品可购买后即可下单。' },
        { title: '配送', value: '设置中' },
        { title: '支付', value: '微信支付开通中' },
      ],
      paymentTitle: '支付方式',
      paymentValue: '上线后启用',
      payNow: '立即支付',
      emptyTitle: '结算即将开启',
      emptyDescription: '商城上线后可在此提交订单。',
      itemsTitle: '商品列表',
      summaryTitle: '订单摘要',
      emptyButton: '去首页逛逛',
      successToast: '订单已提交',
      emptyToast: '购物车为空',
      quantityLabel: '数量',
      subtotalLabel: '小计',
      shippingLabel: '运费',
      totalLabel: '合计',
    },
    orders: {
      tabs: [
        { title: '全部', items: [] },
        { title: '待付款', items: [] },
        { title: '待发货', items: [] },
        { title: '待收货', items: [] },
        { title: '售后', items: [] },
      ],
      emptyTitle: '暂无订单',
      emptyDescription: '商城上线后，订单记录会显示在这里。',
      orderLabel: '订单',
      statusLabel: '状态',
    },
    product: {
      productTitle: '商品预览',
      name: '待上线商品',
      desc: '商品信息准备中。',
      priceLabel: '价格',
      price: '—',
      ratingLabel: '评分',
      rating: '待更新',
      optionsTitle: '选项',
      color: '颜色',
      colorValue: '待公布',
      size: '尺码',
      sizeValue: '待公布',
      quantity: '数量',
      detailsTab: '详情',
      reviewsTab: '评价',
      detailItems: ['上线后将展示完整参数。'],
      reviewItems: [],
      comingSoonTitle: '商品信息筹备中',
      comingSoonDescription: '正在接入商品服务，请稍后再来。',
      actionIcons: [
        { icon: 'chat-o', text: '客服' },
        { icon: 'cart-o', text: '购物车', url: '/pages/cart/index', linkType: 'switchTab' },
      ],
      actionButtons: [
        { type: 'warning', text: '加入购物车', disabled: true },
        { type: 'danger', text: '立即购买', disabled: true },
      ],
      retryButton: '重试',
      addedToast: '已加入购物车',
    },
    category: {
      searchPlaceholder: '搜索分类',
      emptyTitle: '分类同步中',
      emptyDescription: '稍后再试，更多分类即将上线。',
      errorTitle: '无法加载分类',
      errorDescription: '请检查网络后重试。',
      errorAction: '重试',
      productsTitle: '分类商品',
      searchResultsTitle: '搜索结果',
      loadingText: '加载中…',
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
        { icon: 'home-o', text: '首页', url: '/pages/index/index', linkType: 'switchTab' },
        { icon: 'apps-o', text: '分类', url: '/pages/category/index', linkType: 'switchTab' },
        { icon: 'orders-o', text: '订单', url: '/pages/orders/index', linkType: 'navigateTo' },
      ],
      ordersTitle: '我的订单',
      myOrdersTitle: '订单记录',
      myOrdersValue: '查看列表',
      orderTabs: [
        { url: '/pages/orders/index?active=1', text: '待付款', icon: 'pending-payment', countKey: 'toPay' },
        { url: '/pages/orders/index?active=2', text: '待发货', icon: 'tosend', countKey: 'toShip' },
        { url: '/pages/orders/index?active=3', text: '待收货', icon: 'logistics', countKey: 'toReceive' },
        { url: '/pages/orders/index?active=4', text: '售后/退款', icon: 'after-sale', countKey: 'afterSale' },
      ],
      moreTitle: '更多服务',
      wallet: { label: '会员中心', badge: '敬请期待', url: '' },
      support: { label: '客服支持', url: '' },
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
