(ns omni.weapp.pages.cart)
(defn init []
  (js/Page (clj->js {:data {}
                     :onLoad (fn [] (js/console.log "Cart loaded"))})))
(init)