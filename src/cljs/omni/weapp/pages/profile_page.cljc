(ns omni.weapp.pages.profile-page)

(def page-template
  (list
   [:view {:class "profile-header"}
    [:van-skeleton {:title true :row "1" :loading "{{ loading }}"}
     [:van-cell
      {:center true
       :size "large"
       :clickable true
       :is-link "{{ isLoggedIn }}"
       :bind:click "onProfileAction"
       :title "{{ isLoggedIn ? ((i18n.profile.header.signedInTitle || '') + (nickname || i18n.toast.defaultNickname || 'WeChat User')) : i18n.profile.header.signedOutTitle }}"
       :title-style "font-weight:600"
       :label "{{ isLoggedIn ? i18n.profile.header.signedInLabel : i18n.profile.header.signedOutLabel }}"}
      [:view {:slot "icon" :class "profile-avatar"}
       [:van-image
        {:wx:if "{{ avatarUrl }}"
         :round true
         :width "96rpx"
         :height "96rpx"
         :fit "cover"
         :src "{{ avatarUrl }}"}]
       [:van-icon {:wx:else true :name "contact-o" :size "48" :color "#969799"}]]
      [:view {:slot "right-icon" :wx:if "{{ isLoggedIn }}"}
       [:van-tag {:type "danger" :size "mini" :plain true :wx:if "{{ isVIP }}"} "{{ i18n.profile.header.vip }}"]]]]]

   [:van-divider {:content-position "center"} "{{ i18n.profile.ordersTitle }}"]
   [:van-cell-group {:inset true}
    [:van-cell
     {:title "{{ i18n.profile.myOrdersTitle }}"
      :value "{{ i18n.profile.myOrdersValue }}"
      :is-link true
      :clickable true
      :url "/pages/orders/index"
      :link-type "navigateTo"}]
    [:van-grid {:column-num "5" :clickable true :border false :icon-size "26"}
     [:van-grid-item
      {:wx:for "{{ i18n.profile.orderTabs }}"
       :wx:key "url"
       :url "{{ item.url }}"
       :link-type "navigateTo"}
      [:van-icon {:slot "icon" :name "{{ item.icon }}" :size "26" :info "{{ orderCounts[item.countKey] || '' }}"}]
      [:view {:slot "text"} "{{ item.text }}"]]]]

   [:van-divider {:content-position "center"} "{{ i18n.profile.moreTitle }}"]
   [:van-cell-group {:inset true}
    [:van-grid {:column-num "4" :clickable true :border false :icon-size "26"}
     [:van-grid-item {:url "{{ i18n.profile.wallet.url }}" :link-type "navigateTo"}
      [:van-badge {:slot "icon" :content "{{ i18n.profile.wallet.badge }}"}
       [:van-icon {:name "balance-o" :size "26"}]]
      [:view {:slot "text"} "{{ i18n.profile.wallet.label }}"]]
     [:van-grid-item {:icon "service-o" :text "{{ i18n.profile.support.label }}" :url "{{ i18n.profile.support.url }}" :link-type "navigateTo"}]]]

   [:van-divider]
   [:van-cell-group {:inset true}
    [:van-cell
     {:title "{{ i18n.profile.aboutTitle }}"
      :is-link true
      :clickable true
      :url "/pages/about/index"
      :link-type "navigateTo"}]]))
