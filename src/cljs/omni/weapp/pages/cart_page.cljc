(ns omni.weapp.pages.cart-page)

(def page-template
  (list
   [:block {:wx:if "{{ !items.length }}"}
    [:van-empty {:image "cart"}
     [:view {:slot "description"}
      [:view "{{ i18n.emptyTitle }}"]
      [:view "{{ i18n.emptyDescription }}"]]
     [:van-button {:slot "bottom" :type "primary" :plain true :size "small" :bind:tap "onGoShopping"} "{{ i18n.goShopping }}"]]]

   [:block {:wx:else true}
    [:view {:class "cart-toolbar"}
     [:van-checkbox
      {:shape "square"
       :value "{{ allSelected }}"
       :bind:change "onToggleSelectAll"
       :class "cart-toolbar__checkbox"}
      "{{ allSelected ? i18n.deselectAllLabel : i18n.selectAllLabel }}"]
     [:view {:class "cart-toolbar__summary"}
      [:view "{{ i18n.selectedLabel }} {{ selectedIds.length }}"]
      [:view {:class "cart-toolbar__total"} "¥{{ selectedTotalText }}"]]]

    [:van-checkbox-group {:class "cart-list" :value "{{ selectedIds }}" :bind:change "onSelectionChange"}
     [:van-swipe-cell
      {:class "cart-swipe"
       :wx:for "{{ items }}"
       :wx:key "id"
       :right-width "{{ swipeActionWidth }}"}
      [:view {:class "cart-item {{ selectedLookup[item.id] ? 'cart-item--active' : '' }}"}
       [:van-checkbox
        {:class "cart-item__checkbox"
         :shape "square"
         :icon-size "32rpx"
         :name "{{ item.id }}"}]
       [:view {:class "cart-item__figure"}
        [:van-image {:width "120rpx" :height "120rpx" :fit "cover" :src "{{ item.imageUrl || 'https://img.yzcdn.cn/vant/ipad.jpeg' }}"}]]
       [:view {:class "cart-item__main"}
        [:view {:class "cart-item__title"} "{{ item.title }}"]
        [:view {:class "cart-item__meta"}
         [:view {:class "cart-item__price"} "¥{{ item.price }}"]
         [:van-stepper
          {:value "{{ item.qty }}"
           :min "1"
           :theme "round"
           :integer true
           :bind:change "onQuantityChange"
           :data-cart-id "{{ item.id }}"}]]]]
      [:view {:slot "right" :class "cart-swipe__actions" :style "width: {{ swipeActionWidth }}px;"}
       [:van-button
        {:size "small"
         :type "danger"
         :block true
         :custom-class "cart-swipe__delete"
         :custom-style "height: 100%;"
         :data-cart-id "{{ item.id }}"
         :bind:tap "onRemoveItem"}
        [:van-icon {:name "delete" :size "32rpx" :class "cart-swipe__delete-icon"}]
        [:text {:class "cart-swipe__delete-text"} "{{ i18n.removeButton }}"]]]]]

    [:view {:class "cart-submit-bar-spacer"}]
    [:van-submit-bar
     {:price "{{ selectedTotalCents }}"
      :button-text "{{ i18n.checkoutButton }}"
      :disabled "{{ !selectedIds.length }}"
      :bind:submit "onCheckout"
      :placeholder true
      :custom-class "cart-submit-bar"
      :safe-area-inset-bottom true}]]))
