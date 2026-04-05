(ns omni.admin.lib.router
  (:require [reagent.core :as r]))

(defn parse-hash []
  (let [raw (or (.-hash js/location) "")
        seg (-> raw
                (clojure.string/replace #"^#/?/" "")
                (clojure.string/split #"/")
                first
                (or "dashboard"))]
    (case seg
      ("dashboard" "products" "orders" "users" "system") seg
      "dashboard")))

(defn use-hash-route []
  (let [route (r/atom {:route (parse-hash)})]
    (r/create-class
     {:component-did-mount
      (fn []
        (let [on-change #(swap! route assoc :route (parse-hash))]
          (.addEventListener js/window "hashchange" on-change)
          (when-not (.-hash js/location)
            (set! (.-hash js/location) "#/dashboard"))
          (fn []
            (.removeEventListener js/window "hashchange" on-change))))

      :reagent-render
      (fn []
        (assoc @route :navigate
               (fn [to]
                 (when-not (= (parse-hash) to)
                   (set! (.-hash js/location) (str "#/" to))))))})))

(defn navigate [to]
  (set! (.-hash js/location) (str "#/" to)))