(ns omni.weapp.pages.index)

(def initial-data
  {:featuredProducts []
   :banners []
   :featuredLoading false
   :featuredLoaded false
   :featuredError ""
   :searchValue ""})

(defn format-price [value]
  (if (js/Number.isFinite value)
    (.toFixed value 2)
    "0.00"))

(defn to-featured-card [item]
  ;; This is a simplified version, it assumes item has priceYuan, title, etc.
  (let [price-yuan (or (.-priceYuan item) (.. item -price -priceYuan))
        subtitle (or (.-subtitle item) (.-description item) "")
        image-url (or (.-imageUrl item) (.. item -images (at 0) -url) "https://img.yzcdn.cn/vant/ipad.jpeg")
        has-stock (if (js/Reflect.has item "hasStock")
                    (.-hasStock item)
                    (> (or (.-stock item) 0) 0))]
    #js {:id (.-id item)
         :title (.-title item)
         :desc subtitle
         :price (format-price price-yuan)
         :imageUrl image-url
         :hasStock has-stock}))

(defn load-featured-products [this]
  (let [data (.-data this)]
    (when-not (.-featuredLoading data)
      (.setData this #js {:featuredLoading true :featuredError ""})
      ;; Assuming js/wx.cloud.callFunction is used for fetchStoreHome in cljs
      ;; Note: you need to replace this with your actual API call.
      (-> (js/wx.cloud.callFunction #js {:name "shop" :data #js {:action "getStoreHome"}})
          (.then (fn [res]
                   (let [result (.. res -result -data)
                         featured (.-featuredProducts result)
                         banners (.-banners result)
                         mapped (->> featured
                                     (map to-featured-card)
                                     clj->js)
                         banner-cards (->> banners
                                           (filter #(and % (.-imageUrl %)))
                                           (map (fn [b] #js {:id (.-id b)
                                                             :imageUrl (.-imageUrl b)
                                                             :title (.-title b)
                                                             :linkUrl (.-linkUrl b)}))
                                           clj->js)]
                     (.setData this #js {:featuredProducts mapped
                                         :banners banner-cards
                                         :featuredLoaded true}))))
          (.catch (fn [err]
                    (let [message (if (instance? js/Error err) (.-message err) "Failed to load")
                          has-initial (or (.-featuredLoaded data)
                                          (> (.. data -featuredProducts -length) 0))]
                      (when-not has-initial
                        (.setData this #js {:featuredError message}))
                      (js/wx.showToast #js {:title message :icon "none"}))))
          (.finally (fn []
                      (.setData this #js {:featuredLoading false})))))))

(defn on-load []
  (this-as this
    (load-featured-products this)))

(defn on-show []
  (this-as this
    (let [tab-bar (when (.-getTabBar this) (.getTabBar this))]
      (when tab-bar
        (try (.setActiveByRoute tab-bar "/pages/index/index")
             (catch js/Error _)))
      (let [data (.-data this)]
        (when (and (not (.-featuredLoaded data))
                   (not (.-featuredLoading data)))
          (load-featured-products this))))))

(defn on-search-change [event]
  (this-as this
    (let [value (.. event -detail)]
      (.setData this #js {:searchValue value}))))

(defn on-search-confirm [event]
  (this-as this
    (let [value (.. event -detail)
          keyword (if (= (type value) js/String) (.trim value) "")]
      (if (empty? keyword)
        (.setData this #js {:searchValue ""})
        (do
          (.setData this #js {:searchValue keyword})
          (js/wx.navigateTo #js {:url (str "/pages/search/index?q=" (js/encodeURIComponent keyword))}))))))

(defn on-open-product [event]
  (this-as this
    (let [product-id (.. event -currentTarget -dataset -productId)]
      (when (and product-id (= (type product-id) js/String))
        (js/wx.navigateTo #js {:url (str "/pages/product/detail?id=" (js/encodeURIComponent product-id))})))))

(defn on-banner-tap [event]
  (this-as this
    (let [link (.. event -currentTarget -dataset -link)]
      (when (and link (= (type link) js/String))
        (if (.startsWith link "/")
          (js/wx.navigateTo #js {:url link})
          (js/wx.setClipboardData #js {:data link
                                       :success (fn []
                                                  (js/wx.showToast #js {:title "Link copied" :icon "success"}))}))))))

(defn init []
  (js/Page
   (clj->js
    {:data initial-data
     :onLoad on-load
     :onShow on-show
     :loadFeaturedProducts load-featured-products
     :onSearchChange on-search-change
     :onSearchConfirm on-search-confirm
     :onOpenProduct on-open-product
     :onBannerTap on-banner-tap})))

(init)
