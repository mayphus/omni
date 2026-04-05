(ns omni.admin.app
  (:require [reagent.core :as r]
            [reagent.dom :as rdom]
            [omni.admin.components.layout :as layout]
            [omni.admin.pages.dashboard :as dashboard]
            [omni.admin.pages.products :as products]
            [omni.admin.pages.orders :as orders]
            [omni.admin.pages.users :as users]
            [omni.admin.pages.system :as system]
            [omni.admin.pages.login :as login]
            [omni.admin.lib.router :as router]
            [omni.admin.lib.cloudbase :as cb]))

(defn app []
  (let [route (router/use-hash-route)
        user (r/atom nil)]
    (r/create-class
     {:component-did-mount
      (fn []
        (-> (cb/ensure-login-state)
            (.then #(reset! user %))
            (.catch #(reset! user false))))

      :reagent-render
      (fn []
        (cond
          (nil? @user) nil ; loading
          (not @user) [login/login {:on-success #(reset! user %)}]
          :else [layout/layout {:user @user
                               :on-sign-out (fn [] (-> (cb/sign-out)
                                                       (.then (fn [] (reset! user false)))
                                                       (.catch (fn [err] (js/console.error "Sign out error" err)))))}
                (case (:route @route)
                  "dashboard" [dashboard/dashboard]
                  "products" [products/products]
                  "orders" [orders/orders]
                  "users" [users/users]
                  "system" [system/system]
                  [dashboard/dashboard])]))})))

(defn ^:export init []
  (rdom/render [app] (js/document.getElementById "root")))