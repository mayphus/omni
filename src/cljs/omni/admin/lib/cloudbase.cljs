(ns omni.admin.lib.cloudbase
  (:require [cljs.core.async :refer [go <!]]
            ["@cloudbase/js-sdk" :as cloudbase]))

(def env-id nil) ; Will be set at runtime

(defn is-anonymous-login? [user]
  (let [login-type (some-> user .-loginType str clojure.string/upper-case)]
    (= login-type "ANONYMOUS")))

(defn is-valid-admin-login? [user]
  (and user (.-uid user) (not (is-anonymous-login? user))))

(defn get-user-display-name [user]
  (or (.-username user)
      (.-email user)
      (.-customUserId user)
      (.-uid user)
      "Account"))

(def app (atom nil))
(def auth-instance (atom nil))

(defn get-cloudbase-app []
  (when-not @app
    (reset! app (cloudbase/init #js {:env (or env-id "")})))
  @app)

(defn get-auth []
  (when-not @auth-instance
    (reset! auth-instance (.auth (get-cloudbase-app) #js {:persistence "local"})))
  @auth-instance)

(defn ensure-login-state []
  (js/Promise.
   (fn [resolve reject]
     (-> (get-auth)
         (.getLoginState)
         (.then (fn [state]
                  (let [user (some-> state .-user)]
                    (resolve (when (is-valid-admin-login? user) user)))))
         (.catch reject)))))

(defn sign-in-with-username-password [username password]
  (-> (get-auth)
      (.signIn #js {:username username :password password})))

(defn sign-out []
  (-> (get-auth) (.signOut)))

(defn get-env-id []
  env-id)

(defn call-shop-function [action payload]
  (js/Promise.
   (fn [resolve reject]
     (-> (get-cloudbase-app)
         (.callFunction #js {:name "shop" :data (clj->js (assoc payload :action action))})
         (.then (fn [response]
                  (let [result (.-result response)]
                    (if-not result
                      (reject (js/Error. "No response from cloud function"))
                      (if-not (.-success result)
                        (let [message (or (.-error result) (.-code result) "Cloud function request failed")]
                          (reject (js/Error. (if (string? message) message "Cloud function request failed"))))
                        (resolve (js->clj result :keywordize-keys true)))))))
         (.catch reject)))))