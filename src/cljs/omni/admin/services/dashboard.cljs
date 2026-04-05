(ns omni.admin.services.dashboard
  (:require [omni.admin.lib.cloudbase :as cb]))

(defn fetch-dashboard-summary []
  (-> (cb/call-shop-function "v1.admin.dashboard.summary" {})
      (.then (fn [res]
               {:summary (:summary res)
                :recent-orders (:recentOrders res)}))))