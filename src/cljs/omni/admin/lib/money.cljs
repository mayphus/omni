(ns omni.admin.lib.money)

(defn format-cny [yuan]
  (.format (js/Intl.NumberFormat. "zh-CN" #js {:style "currency" :currency "CNY"}) yuan))