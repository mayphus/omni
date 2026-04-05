(ns omni.weapp.pages.category-page)

(def page-template
  (list
   [:van-search
    {:value "{{ searchValue }}"
     :placeholder "{{ i18n.searchPlaceholder }}"
     :shape "round"
     :background "#ffffff"
     :show-action true
     :bind:change "onSearchChange"
     :bind:search "onSearchConfirm"
     :bind:cancel "onSearchCancel"}]

   [:block {:wx:if "{{ categoriesLoading && !categoriesLoaded }}"}
    [:van-skeleton {:title true :row "3" :loading true}]]

   [:block {:wx:elif "{{ categories.length }}"}
    [:van-tabs
     {:sticky true
      :swipeable true
      :animated true
      :active "{{ active }}"
      :bind:change "onTabChange"}
     [:van-tab
      {:wx:for "{{ categories }}"
       :wx:key "slug"
       :wx:for-item "item"
       :title "{{ item.name }}"
       :name "{{ item.slug }}"}]]]

   [:block {:wx:elif "{{ categoriesError }}"}
    [:van-empty {:image "error"}
     [:view {:slot "description"}
      [:view "{{ i18n.category.errorTitle }}"]
      [:view "{{ categoriesError || i18n.category.errorDescription }}"]]
     [:van-button {:slot "bottom" :type "primary" :size "small" :bind:click "onRetryCategories"}
      "{{ i18n.category.errorAction }}"]]]

   [:block {:wx:elif "{{ categoriesLoaded }}"}
    [:van-empty {:image "search"}
     [:view {:slot "description"}
      [:view "{{ i18n.category.emptyTitle }}"]
      [:view "{{ i18n.category.emptyDescription }}"]]]]

   [:block {:wx:if "{{ searchLoading }}"}
    [:van-loading {:size "24px" :color "#1989fa" :vertical true} "{{ i18n.loadingText }}"]]

   [:block {:wx:elif "{{ searchError }}"}
    [:van-empty {:image "search" :description "{{ searchError }}"}]]

   [:block {:wx:elif "{{ searchResults.length }}"}
    [:van-divider {:content-position "center"} "{{ i18n.searchResultsTitle }}"]
    [:van-card
     {:wx:for "{{ searchResults }}"
      :wx:key "id"
      :price "{{ item.price }}"
      :desc "{{ item.desc }}"
      :title "{{ item.title }}"
      :thumb "{{ item.imageUrl }}"
      :currency "¥"
      :data-product-id "{{ item.id }}"
      :bind:tap "onProductTap"}]]

   [:block {:wx:if "{{ productsLoading }}"}
    [:van-skeleton {:title true :row "3" :loading true :avatar true}]]

   [:block {:wx:elif "{{ productsError }}"}
    [:van-empty {:image "error"}
     [:view {:slot "description"}
      [:view "{{ i18n.category.errorTitle }}"]
      [:view "{{ productsError }}"]]
     [:van-button {:slot "bottom" :type "primary" :size "small" :bind:tap "onReloadCategory"}
      "{{ i18n.category.errorAction }}"]]]

   [:block {:wx:elif "{{ products.length }}"}
    [:van-card
     {:wx:for "{{ products }}"
      :wx:key "id"
      :price "{{ item.price }}"
      :desc "{{ item.desc }}"
      :title "{{ item.title }}"
      :thumb "{{ item.imageUrl }}"
      :currency "¥"
      :data-product-id "{{ item.id }}"
      :bind:tap "onProductTap"}]]

   [:block {:wx:else true}
    [:van-empty {:image "search"}
     [:view {:slot "description"}
      [:view "{{ i18n.category.emptyTitle }}"]
      [:view "{{ i18n.category.emptyDescription }}"]]]]))
