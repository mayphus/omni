(ns omni.weapp.pages.profile)
(defn init []
  (js/Page (clj->js {:data {}
                     :onLoad (fn [] (js/console.log "Profile loaded"))})))
(init)