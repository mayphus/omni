(ns omni.admin.components.ui.label
  (:require [reagent.core :as r]))

(defn label [{:keys [html-for class-name children]}]
  [:label {:html-for html-for
           :class (str "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 "
                       (or class-name ""))}
   children])