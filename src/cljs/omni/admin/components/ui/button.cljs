(ns omni.admin.components.ui.button
  (:require [reagent.core :as r]))

(defn button [{:keys [size variant on-click class-name children]}]
  (let [base-classes "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
        size-classes (case size
                       "sm" "h-9 px-3"
                       "lg" "h-11 px-8"
                       "h-10 py-2 px-4")
        variant-classes (case variant
                          "ghost" "hover:bg-accent hover:text-accent-foreground"
                          "destructive" "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          "outline" "border border-input hover:bg-accent hover:text-accent-foreground"
                          "secondary" "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          "bg-primary text-primary-foreground hover:bg-primary/90")
        classes (str base-classes " " size-classes " " variant-classes " " (or class-name ""))]
    [:button {:class classes :on-click on-click} children]))