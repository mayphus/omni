(ns omni.admin.components.layout.sidebar
  (:require [reagent.core :as r]
            [omni.admin.components.ui.button :as button]))

(defn sidebar [{:keys [current user-name on-sign-out]}]
  (let [items [{:key "dashboard" :label "Dashboard"}
               {:key "products" :label "Products"}
               {:key "orders" :label "Orders"}
               {:key "users" :label "Users"}
               {:key "system" :label "System"}]]
    [:aside {:class "hidden w-56 shrink-0 border-r bg-background md:flex md:flex-col"}
     [:div {:class "p-3 text-sm font-semibold"} "Admin"]
     [:nav {:class "flex-1 px-2 text-sm"}
      (for [item items]
        (let [active (= current (:key item))
              classes (str "block rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground "
                           (if active "bg-accent text-accent-foreground" "text-foreground"))]
          [:a {:key (:key item)
               :href (str "#/" (:key item))
               :class classes}
           (:label item)]))]
     [:div {:class "border-t p-3 text-xs text-muted-foreground"}
      [:div {:class "mb-2 truncate text-foreground"
             :title user-name}
       user-name]
      [button/button {:variant "ghost"
                      :size "sm"
                      :class-name "w-full justify-start"
                      :on-click on-sign-out}
       "Sign out"]]]))