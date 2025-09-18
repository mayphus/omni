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
    bannerLinkCopied: string
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
    selectAllLabel: string
    deselectAllLabel: string
    selectedLabel: string
    selectLabel: string
    selectToast: string
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
    paymentPendingToast: string
    paymentUnavailable: string
    orderCreateFailed: string
    paymentCancelled: string
    orderPendingHint: string
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
    statusLabels: Record<'pending' | 'paid' | 'shipped' | 'completed' | 'canceled' | 'refunded', string>
  }
  orderDetail: {
    retryButton: string
    orderLabel: string
    placedOn: string
    cancelButton: string
    cannotCancelHint: string
    copyId: string
    itemsTitle: string
    summaryTitle: string
    subtotalLabel: string
    discountLabel: string
    shippingLabel: string
    totalLabel: string
    addressTitle: string
    paymentTitle: string
    paymentStatusLabel: string
    paymentReferenceLabel: string
    statusLabels: Record<'pending' | 'paid' | 'shipped' | 'completed' | 'canceled' | 'refunded', string>
    paymentStatus: Record<'pending' | 'ready' | 'succeeded' | 'failed' | 'refunded', string>
    cancelConfirm: {
      title: string
      message: string
      confirm: string
      cancel: string
      success: string
    }
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
    stockLabel: string
    stockSoldOut: string
    stockLeftSuffix: string
    categoryLabel: string
    attributeYes: string
    attributeNo: string
    maxQuantityPrefix: string
    maxQuantitySuffix: string
    skuLabel: string
    popupConfirm: string
    popupCancel: string
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
      signedInTitle: string
      signedOutLabel: string
      signedInLabel: string
      vip: string
    }
    quickEntriesTitle: string
    quickEntries: SupportEntry[]
    ordersTitle: string
    myOrdersTitle: string
    myOrdersValue: string
    orderTabs: Array<{
      url: string
      text: string
      icon: string
      countKey: 'toPay' | 'toShip' | 'toReceive' | 'completed' | 'afterSale'
    }>
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
  profileEdit: {
    title: string
    description: string
    avatarLabel: string
    nicknameLabel: string
    nicknamePlaceholder: string
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
  about: {
    tagline: string
    title: string
    subtitle: string
    sections: Array<{ key: string; title: string; paragraphs: string[] }>
    policies: {
      title: string
      items: Array<{ key: string; title: string; paragraphs: string[] }>
    }
    contact: {
      title: string
      items: Array<{ key: string; label: string; value: string; description?: string }>
    }
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
      bannerLinkCopied: 'Link copied',
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
      emptyDescription: 'Try another keyword or explore categories to discover products.',
      loadingText: 'Loading…',
    },
    cart: {
      title: 'Shopping cart',
      emptyTitle: 'Your cart is empty',
      emptyDescription: 'Items you add will appear here. Start shopping to fill your cart.',
      goShopping: 'Browse homepage',
      infoTitle: 'What to expect',
      infoItems: [
        { icon: 'diamond-o', title: 'Member discounts', value: 'Releasing soon' },
        { icon: 'points', title: 'Free shipping', value: 'Available after launch' },
        { icon: 'shield-o', title: 'Secure payments', value: 'Powered by WeChat Pay' },
      ],
      removeButton: 'Remove',
      clearButton: 'Clear cart',
      continueButton: 'Continue shopping',
      checkoutButton: 'Checkout',
      emptyToast: 'Cart is empty',
      selectAllLabel: 'Select all',
      deselectAllLabel: 'Deselect all',
      selectedLabel: 'Selected',
      selectLabel: 'Select',
      selectToast: 'Choose items to checkout',
    },
    checkout: {
      orderTitle: 'Order overview',
      summary: [
        { title: 'Status', value: 'Ready for checkout', label: 'Confirm payment to place your order.' },
        { title: 'Delivery', value: 'Courier & pickup options coming soon' },
        { title: 'Payment', value: 'Pay securely with WeChat Pay' },
      ],
      paymentTitle: 'Payment',
      paymentValue: 'Pay with your linked WeChat account',
      payNow: 'Pay Now',
      emptyTitle: 'Checkout opens soon',
      emptyDescription: 'You need items in your cart before you can check out.',
      itemsTitle: 'Items',
      summaryTitle: 'Summary',
      emptyButton: 'Browse homepage',
      successToast: 'Payment successful',
      paymentPendingToast: 'Payment submitted, awaiting confirmation',
      paymentUnavailable: 'Payment is currently unavailable',
      orderCreateFailed: 'Failed to create order',
      paymentCancelled: 'Payment cancelled',
      orderPendingHint: 'Order pending payment. Check My Orders to retry.',
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
        { title: 'Completed', items: [] },
        { title: 'After-sales', items: [] },
      ],
      emptyTitle: 'No orders yet',
      emptyDescription: 'You have no orders yet. Place your first order to see it here.',
      orderLabel: 'Order',
      statusLabel: 'Status',
      statusLabels: {
        pending: 'Pending payment',
        paid: 'Paid',
        shipped: 'Shipped',
        completed: 'Completed',
        canceled: 'Canceled',
        refunded: 'Refunded',
      },
    },
    orderDetail: {
      retryButton: 'Reload',
      orderLabel: 'Order',
      placedOn: 'Placed on',
      cancelButton: 'Cancel order',
      cannotCancelHint: 'This order can no longer be canceled online.',
      copyId: 'Copy ID',
      itemsTitle: 'Items',
      summaryTitle: 'Order summary',
      subtotalLabel: 'Subtotal',
      discountLabel: 'Discount',
      shippingLabel: 'Shipping',
      totalLabel: 'Total',
      addressTitle: 'Shipping address',
      paymentTitle: 'Payment',
      paymentStatusLabel: 'Payment status',
      paymentReferenceLabel: 'Payment reference',
      statusLabels: {
        pending: 'Pending payment',
        paid: 'Paid',
        shipped: 'Shipped',
        completed: 'Completed',
        canceled: 'Canceled',
        refunded: 'Refunded',
      },
      paymentStatus: {
        pending: 'Pending',
        ready: 'Awaiting payment',
        succeeded: 'Paid',
        failed: 'Failed',
        refunded: 'Refunded',
      },
      cancelConfirm: {
        title: 'Cancel this order?',
        message: 'Please confirm you want to cancel this order. This action cannot be undone.',
        confirm: 'Cancel order',
        cancel: 'Keep order',
        success: 'Order canceled',
      },
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
      stockLabel: 'Stock',
      stockSoldOut: 'Sold out',
      stockLeftSuffix: ' left',
      categoryLabel: 'Category',
      attributeYes: 'Yes',
      attributeNo: 'No',
      maxQuantityPrefix: 'Max ',
      maxQuantitySuffix: '',
      skuLabel: 'Select option',
      popupConfirm: 'Confirm',
      popupCancel: 'Cancel',
    },
    category: {
      searchPlaceholder: 'Search categories',
      emptyTitle: 'Categories syncing',
      emptyDescription: 'Browse other categories while we prepare more listings.',
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
    about: {
      tagline: 'Our story',
      title: 'About Tongmeng Plant',
      subtitle: 'We build digital retail experiences that feel familiar, trusted, and ready for everyday life in China.',
      sections: [
        {
          key: 'mission',
          title: 'Mission',
          paragraphs: [
            'Tongmeng Plant exists to make curated, family-friendly commerce effortless. We connect local suppliers with community shoppers through experiences that highlight quality, value, and service.',
          ],
        },
        {
          key: 'approach',
          title: 'How we work',
          paragraphs: [
            'Our teams operate across merchandising, operations, and technology. Every release focuses on clear communication, reliable fulfilment, and responsive support so customers always know what to expect.',
            'We iterate quickly, listen to feedback carefully, and publish transparent roadmaps so partners can co-create the platform with us.',
          ],
        },
        {
          key: 'sustainability',
          title: 'Sustainability & community',
          paragraphs: [
            'We prioritise responsible sourcing, recyclable packaging, and efficient logistics. Part of every order funds neighbourhood programmes that encourage greener living.',
          ],
        },
      ],
      policies: {
        title: 'Policies',
        items: [
          {
            key: 'privacy',
            title: 'Privacy Policy',
            paragraphs: [
              'We collect only the data required to fulfil orders, provide support, and comply with regulations. All personal information is stored securely in mainland China and encrypted in transit.',
              'You may request data export or deletion by contacting customer service. We honour all requests within 15 working days unless law requires retention.',
            ],
          },
          {
            key: 'terms',
            title: 'Terms of Service',
            paragraphs: [
              'Placing an order implies acceptance of our payment, delivery, and after-sale processes. Prices are listed in CNY and include applicable taxes unless noted.',
              'We reserve the right to update pricing, availability, or policies. Any significant changes are announced in-app and on our official channels.',
            ],
          },
          {
            key: 'returns',
            title: 'Returns & refunds',
            paragraphs: [
              'Most unopened items can be returned within 7 days of receipt. Contact support to arrange pickup or drop-off. Refunds post to the original payment method within 3-5 business days after inspection.',
              'If an item arrives damaged or incorrect, notify us within 48 hours so we can prioritise a replacement or refund.',
            ],
          },
        ],
      },
      contact: {
        title: 'Contact',
        items: [
          {
            key: 'support',
            label: 'Customer service',
            value: 'support@tongmeng-plant.com',
            description: 'Email us anytime — we reply within 1 business day.',
          },
          {
            key: 'hours',
            label: 'Service hours',
            value: '09:00–18:00 (GMT+8, Mon–Sat)',
            description: 'Live agents are available during these hours.',
          },
          {
            key: 'address',
            label: 'Office',
            value: 'Tongmeng Industrial Park, Shenzhen',
          },
        ],
      },
    },
    profile: {
      header: {
        signedOutTitle: 'Tap to sign in',
        signedInTitle: 'Welcome, ',
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
        { url: '/pages/orders/index?active=4', text: 'Completed', icon: 'passed', countKey: 'completed' },
        { url: '/pages/orders/index?active=5', text: 'After-sale', icon: 'after-sale', countKey: 'afterSale' },
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
    profileEdit: {
      title: 'Edit Profile',
      description: 'Update your avatar and nickname so orders look friendly.',
      avatarLabel: 'Avatar',
      nicknameLabel: 'Nickname',
      nicknamePlaceholder: 'Tap to set nickname',
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
      bannerLinkCopied: '链接已复制',
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
      emptyDescription: '换个关键词试试，或浏览分类发现更多商品。',
      loadingText: '加载中…',
    },
    cart: {
      title: '购物车',
      emptyTitle: '购物车空空如也',
      emptyDescription: '暂未添加商品，去逛逛把喜欢的商品加入购物车。',
      goShopping: '去首页逛逛',
      infoTitle: '购物提示',
      infoItems: [
        { icon: 'diamond-o', title: '会员优惠', value: '即将开放' },
        { icon: 'points', title: '包邮政策', value: '上线后公布' },
        { icon: 'shield-o', title: '支付安全', value: '微信支付保障安全' },
      ],
      removeButton: '移除',
      clearButton: '清空购物车',
      continueButton: '继续逛逛',
      checkoutButton: '去结算',
      emptyToast: '购物车为空',
      selectAllLabel: '全选',
      deselectAllLabel: '取消全选',
      selectedLabel: '已选',
      selectLabel: '选择',
      selectToast: '请选择要结算的商品',
    },
    checkout: {
      orderTitle: '订单概览',
      summary: [
        { title: '状态', value: '可立即结算', label: '确认支付即可创建订单。' },
        { title: '配送', value: '快递与自提即将开放' },
        { title: '支付', value: '支持微信支付' },
      ],
      paymentTitle: '支付方式',
      paymentValue: '使用微信支付完成扣款',
      payNow: '立即支付',
      emptyTitle: '结算即将开启',
      emptyDescription: '购物车为空，添加商品后即可提交订单。',
      itemsTitle: '商品列表',
      summaryTitle: '订单摘要',
      emptyButton: '去首页逛逛',
      successToast: '支付成功',
      paymentPendingToast: '支付已提交，等待确认',
      paymentUnavailable: '支付暂不可用',
      orderCreateFailed: '创建订单失败',
      paymentCancelled: '已取消支付',
      orderPendingHint: '订单待支付，可在“我的订单”中继续支付。',
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
        { title: '已完成', items: [] },
        { title: '售后', items: [] },
      ],
      emptyTitle: '暂无订单',
      emptyDescription: '暂无订单，完成购买后即可在此查看。',
      orderLabel: '订单',
      statusLabel: '状态',
      statusLabels: {
        pending: '待付款',
        paid: '已付款',
        shipped: '配送中',
        completed: '已完成',
        canceled: '已取消',
        refunded: '已退款',
      },
    },
    orderDetail: {
      retryButton: '重新加载',
      orderLabel: '订单',
      placedOn: '下单时间',
      cancelButton: '取消订单',
      cannotCancelHint: '当前状态暂不支持取消，如需帮助请联系客服。',
      copyId: '复制编号',
      itemsTitle: '商品明细',
      summaryTitle: '订单汇总',
      subtotalLabel: '商品小计',
      discountLabel: '优惠',
      shippingLabel: '运费',
      totalLabel: '应付总额',
      addressTitle: '收货信息',
      paymentTitle: '支付信息',
      paymentStatusLabel: '支付状态',
      paymentReferenceLabel: '付款单号',
      statusLabels: {
        pending: '待付款',
        paid: '已付款',
        shipped: '配送中',
        completed: '已完成',
        canceled: '已取消',
        refunded: '已退款',
      },
      paymentStatus: {
        pending: '待处理',
        ready: '待支付',
        succeeded: '已支付',
        failed: '支付失败',
        refunded: '已退款',
      },
      cancelConfirm: {
        title: '确定要取消订单？',
        message: '取消后订单无法恢复，如需再次购买请重新下单。',
        confirm: '确认取消',
        cancel: '我再想想',
        success: '订单已取消',
      },
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
      stockLabel: '库存',
      stockSoldOut: '已售罄',
      stockLeftSuffix: ' 件',
      categoryLabel: '分类',
      attributeYes: '是',
      attributeNo: '否',
      maxQuantityPrefix: '最多 ',
      maxQuantitySuffix: ' 件',
      skuLabel: '选择规格',
      popupConfirm: '确定',
      popupCancel: '取消',
    },
    category: {
      searchPlaceholder: '搜索分类',
      emptyTitle: '分类同步中',
      emptyDescription: '欢迎先浏览其他分类，更多商品即将上架。',
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
    about: {
      tagline: '品牌故事',
      title: '关于同梦植',
      subtitle: '我们致力于打造可信赖的社区零售体验，让家庭采购更轻松、更安心。',
      sections: [
        {
          key: 'mission',
          title: '使命',
          paragraphs: ['同梦植希望通过精选供应链与数字运营，为社区家庭带来物美价廉、透明可追溯的好商品。'],
        },
        {
          key: 'approach',
          title: '我们的方式',
          paragraphs: ['团队覆盖选品、运营、技术等领域，每一次更新都围绕清晰沟通、稳定履约与周到服务展开。', '我们保持快速迭代，重视用户反馈，并通过公开路线图与合作伙伴携手共创。'],
        },
        {
          key: 'sustainability',
          title: '可持续与社区',
          paragraphs: ['我们关注环保包装与高效物流，并将部分收益投入社区公益项目，鼓励绿色生活方式。'],
        },
      ],
      policies: {
        title: '平台政策',
        items: [
          {
            key: 'privacy',
            title: '隐私政策',
            paragraphs: ['我们仅收集履行订单、提供客服与满足法规所需的最少信息，所有数据均存储于中国境内并在传输过程中加密。', '如需导出或删除个人信息，可通过客服提交，我们将在15个工作日内处理（法律另有规定的除外）。'],
          },
          {
            key: 'terms',
            title: '服务条款',
            paragraphs: ['提交订单即表示同意我们的支付、配送与售后流程。所有价格以人民币标注，税费说明以页面信息为准。', '若出现价格、库存或政策调整，我们会提前在小程序及官方渠道公告。'],
          },
          {
            key: 'returns',
            title: '退换货政策',
            paragraphs: ['未拆封商品在签收7日内可申请退货，客服会协助安排上门取件或自送。验收通过后，退款将在3-5个工作日原路退回。', '若收到商品破损或错发，请在48小时内联系客户服务，我们将优先处理换货或退款。'],
          },
        ],
      },
      contact: {
        title: '联系我们',
        items: [
          {
            key: 'support',
            label: '客服邮箱',
            value: 'support@tongmeng-plant.com',
            description: '工作日24小时内回复。',
          },
          {
            key: 'hours',
            label: '服务时间',
            value: '周一至周六 09:00-18:00',
            description: '人工客服在此时段在线。',
          },
          {
            key: 'address',
            label: '办公地址',
            value: '深圳市同梦产业园',
          },
        ],
      },
    },
    profile: {
      header: {
        signedOutTitle: '点击登录',
        signedInTitle: '欢迎回来，',
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
        { url: '/pages/orders/index?active=4', text: '已完成', icon: 'passed', countKey: 'completed' },
        { url: '/pages/orders/index?active=5', text: '售后/退款', icon: 'after-sale', countKey: 'afterSale' },
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
    profileEdit: {
      title: '编辑资料',
      description: '更新头像与昵称，方便辨识订单。',
      avatarLabel: '头像',
      nicknameLabel: '昵称',
      nicknamePlaceholder: '点击设置昵称',
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
