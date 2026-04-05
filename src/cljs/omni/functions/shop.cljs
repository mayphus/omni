(ns omni.functions.shop)

(defn main [event context]
  (let [action (.-action event)]
    (case action
      "hello" (js/Promise.resolve #js {:msg "Hello from CLJS Function!"})
      (js/Promise.reject (js/Error. (str "Unknown action: " action))))))

(set! (.-exports js/module) #js {:main main})
