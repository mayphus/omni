(ns omni.admin.components.layout
  (:require [reagent.core :as r]
            [omni.admin.components.layout.sidebar :as sidebar]
            [omni.admin.lib.router :as router]
            [omni.admin.components.ui.button :as button]
            [omni.admin.lib.cloudbase :as cb]))

(defn layout [{:keys [children user on-sign-out]}]
  (let [route-state (router/use-hash-route)
        display-name (cb/get-user-display-name user)]
    [:div {:class "flex min-h-screen"}
     [sidebar/sidebar {:current (:route @route-state)
                       :user-name display-name
                       :on-sign-out on-sign-out}]
     [:main {:class "min-w-0 flex-1 p-4"}
      [:div {:class "mb-4 flex items-start justify-between gap-3 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground md:hidden"}
       [:div "Signed in as " [:span {:class "font-medium text-foreground"} display-name]]
       [button/button {:size "sm"
                       :variant "ghost"
                       :on-click on-sign-out}
        "Sign out"]]
      [:div {:class "mx-auto w-full max-w-6xl"} children]]]))