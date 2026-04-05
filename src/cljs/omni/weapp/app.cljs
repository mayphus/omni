(ns omni.weapp.app)

(defn init []
  (js/App
   (clj->js
    {:globalData {}
     :onLaunch (fn []
                 (js/console.log "App launched! (ClojureScript version)")
                 (when-not js/wx.cloud
                   (js/console.error "Please use base library 2.2.3 or above.")
                   nil)
                 ;; Cloud init
                 (js/wx.cloud.init (clj->js {:env "cloud1-1g4nt4micf670d3d" :traceUser true})))})))

(init)
