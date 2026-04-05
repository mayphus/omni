(ns omni.admin.components.ui.table
  (:require [reagent.core :as r]))

(defn table [{:keys [class-name children]}]
  [:table {:class (str "w-full caption-bottom text-sm " (or class-name ""))}
   children])

(defn table-header [{:keys [class-name children]}]
  [:thead {:class (str "[&_tr]:border-b " (or class-name ""))}
   children])

(defn table-body [{:keys [class-name children]}]
  [:tbody {:class (str "[&_tr:last-child]:border-0 " (or class-name ""))}
   children])

(defn table-footer [{:keys [class-name children]}]
  [:tfoot {:class (str "bg-muted text-muted-foreground font-medium " (or class-name ""))}
   children])

(defn table-row [{:keys [class-name children]}]
  [:tr {:class (str "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted " (or class-name ""))}
   children])

(defn table-head [{:keys [class-name children]}]
  [:th {:class (str "h-10 px-2 text-left align-middle font-medium text-muted-foreground " (or class-name ""))}
   children])

(defn table-cell [{:keys [class-name children]}]
  [:td {:class (str "p-2 align-middle " (or class-name ""))}
   children])

(defn table-caption [{:keys [class-name children]}]
  [:caption {:class (str "mt-4 text-sm text-muted-foreground " (or class-name ""))}
   children])