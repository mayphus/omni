(ns omni.weapp.pages.index-page)

(def page-template
  (list
   [:van-search
    {:value "{{ searchValue }}"
     :placeholder "{{ i18n.searchPlaceholder }}"
     :shape "round"
     :background "#ffffff"
     :bind:change "onSearchChange"
     :bind:search "onSearchConfirm"}]

   [:block {:wx:if "{{ banners.length }}"}
    [:swiper
     {:class "home-banner"
      :autoplay true
      :interval "5000"
      :duration "500"
      :indicator-dots true
      :indicator-color "rgba(255,255,255,0.3)"
      :indicator-active-color "#ffffff"}
     [:swiper-item
      {:wx:for "{{ banners }}"
       :wx:key "id"}
      [:view
       {:class "home-banner__slide"
        :data-link "{{ item.linkUrl || '' }}"
        :bind:tap "onBannerTap"}
       [:image {:class "home-banner__image" :mode "aspectFill" :src "{{ item.imageUrl }}"}]
       [:view {:wx:if "{{ item.title }}" :class "home-banner__title"} "{{ item.title }}"]]]]]

   [:block {:wx:if "{{ featuredLoading && !featuredLoaded }}"}
    [:van-skeleton {:title true :row "3" :loading true :avatar true}]]

   [:block {:wx:elif "{{ featuredProducts.length }}"}
    [:van-card
     {:wx:for "{{ featuredProducts }}"
      :wx:key "id"
      :price "{{ item.price }}"
      :desc "{{ item.desc }}"
      :title "{{ item.title }}"
      :thumb "{{ item.imageUrl }}"
      :currency "¥"
      :data-product-id "{{ item.id }}"
      :bind:tap "onOpenProduct"}]]

   [:block {:wx:elif "{{ featuredError }}"}
    [:van-empty {:image "error"}
     [:view {:slot "description"}
      [:view "{{ i18n.featuredErrorTitle }}"]
      [:view "{{ featuredError || i18n.featuredErrorDescription }}"]]
     [:van-button {:slot "bottom" :type "primary" :size "small" :bind:click "onRetryFeatured"}
      "{{ i18n.featuredErrorAction }}"]]]

   [:block {:wx:elif "{{ featuredLoaded }}"}
    [:van-empty {:image "search"}
     [:view {:slot "description"}
      [:view "{{ i18n.featuredEmptyTitle }}"]
      [:view "{{ i18n.featuredEmptyDescription }}"]]
     [:van-button {:slot "bottom" :type "primary" :plain true :size "small" :disabled true}
      "{{ i18n.featuredEmptyAction }}"]]]

   [:van-divider {:content-position "center"} "{{ i18n.endDivider }}"]))
