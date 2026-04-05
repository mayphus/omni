(ns omni.admin.pages.login
  (:require [reagent.core :as r]
            [omni.admin.components.ui.card :as card]
            [omni.admin.components.ui.label :as label]
            [omni.admin.components.ui.input :as input]
            [omni.admin.components.ui.button :as button]
            [omni.admin.lib.cloudbase :as cb]))

(defn login [{:keys [on-success]}]
  (let [username (r/atom "")
        password (r/atom "")
        loading (r/atom false)
        error (r/atom nil)
        env-id (cb/get-env-id)]
    (fn []
      [:div {:class "min-h-screen flex items-center justify-center p-4"}
       [card/card {:class-name "w-full max-w-sm"}
        [card/card-header
         [card/card-title "Administrator Login"]]
        [card/card-content
         [:form {:on-submit (fn [e]
                              (.preventDefault e)
                              (reset! error nil)
                              (reset! loading true)
                              (if (or (empty? @username) (empty? @password))
                                (do (reset! error "Please enter username and password")
                                    (reset! loading false))
                                (-> (cb/sign-in-with-username-password @username @password)
                                    (.then (fn [state]
                                             (let [user (some-> state .-user)]
                                               (if (cb/is-valid-admin-login? user)
                                                 (on-success user)
                                                 (reset! error "Account is missing admin access")))))
                                    (.catch (fn [err]
                                              (let [msg (or (.-message err) (.-code err) "Login failed")]
                                                (reset! error (if (string? msg) msg "Login failed")))))
                                    (.finally #(reset! loading false)))))
          :class "space-y-4"}
          [:div {:class "space-y-2"}
           [label/label {:html-for "username"} "Username"]
           [input/input {:id "username"
                         :auto-complete "username"
                         :value @username
                         :on-change #(reset! username %)
                         :placeholder "admin username"}]]
          [:div {:class "space-y-2"}
           [label/label {:html-for "password"} "Password"]
           [input/input {:id "password"
                         :type "password"
                         :auto-complete "current-password"
                         :value @password
                         :on-change #(reset! password %)
                         :placeholder "••••••••"}]]
          (if env-id
            [:p {:class "text-xs text-muted-foreground"} (str "Env: " env-id)]
            [:p {:class "text-xs text-amber-600"} "Missing VITE_TCB_ENV_ID"])
          (when @error
            [:p {:class "text-sm text-red-600"} @error])
          [button/button {:type "submit"
                          :disabled @loading
                          :class-name "w-full"}
           (if @loading "Signing in…" "Sign In")]]]]])))