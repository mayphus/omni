(ns omni.admin.components.ui.card
  (:require [reagent.core :as r]))

(defn card [{:keys [class-name children]}]
  [:div {:class (str "rounded-lg border bg-card text-card-foreground shadow-sm " (or class-name ""))}
   children])

(defn card-header [{:keys [class-name children]}]
  [:div {:class (str "flex flex-col space-y-1.5 p-6 " (or class-name ""))}
   children])

(defn card-title [{:keys [class-name children]}]
  [:h3 {:class (str "text-2xl font-semibold leading-none tracking-tight " (or class-name ""))}
   children])

(defn card-description [{:keys [class-name children]}]
  [:p {:class (str "text-sm text-muted-foreground " (or class-name ""))}
   children])

(defn card-content [{:keys [class-name children]}]
  [:div {:class (str "p-6 pt-0 " (or class-name ""))}
   children])