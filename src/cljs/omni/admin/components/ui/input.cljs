(ns omni.admin.components.ui.input
  (:require [reagent.core :as r]))

(defn input [{:keys [id type value on-change placeholder class-name auto-complete]}]
  [:input {:id id
           :type (or type "text")
           :value value
           :on-change #(on-change (-> % .-target .-value))
           :placeholder placeholder
           :auto-complete auto-complete
           :class (str "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 "
                       (or class-name ""))}])