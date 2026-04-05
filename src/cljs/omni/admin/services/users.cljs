(ns omni.admin.services.users
  (:require [omni.admin.lib.cloudbase :as cb]))

(defn list-users []
  (-> (cb/call-shop-function "v1.admin.users.list" {})
      (.then #(:users %))))