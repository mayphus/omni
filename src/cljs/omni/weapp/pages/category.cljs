(ns omni.weapp.pages.category)
(defn init []
  (js/Page (clj->js {:data {}
                     :onLoad (fn [] (js/console.log "Category loaded"))})))
(init)