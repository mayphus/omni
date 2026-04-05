#!/usr/bin/env bb

(require '[clojure.java.io :as io]
         '[clojure.string :as str]
         '[omni.weapp.pages.index-page :as index-page]
         '[omni.weapp.pages.category-page :as category-page]
         '[omni.weapp.pages.cart-page :as cart-page]
         '[omni.weapp.pages.profile-page :as profile-page])

(def src-dir "src/weapp")
(def dist-dir "weapp")

(defn attr-name [k]
  (if-let [ns-part (namespace k)]
    (str ns-part ":" (name k))
    (name k)))

(defn escape-attr [value]
  (let [v (str value)]
    (if (and (str/starts-with? v "{{") (str/ends-with? v "}}"))
      v
      (-> v
          (str/replace "&" "&amp;")
          (str/replace "\"" "&quot;")
          (str/replace "<" "&lt;")
          (str/replace ">" "&gt;")))))

(defn render-attrs [attrs]
  (if (seq attrs)
    (str " "
         (str/join
          " "
          (map (fn [[k v]]
                 (str (attr-name k) "=\"" (escape-attr (if (boolean? v)
                                                        (if v "true" "false")
                                                        v)) "\""))
               attrs)))
    ""))

(declare render-node)

(defn render-children [children indent]
  (str/join "\n" (map #(render-node % indent) children)))

(defn render-element [[tag & body] indent]
  (let [[attrs children] (if (map? (first body))
                           [(first body) (rest body)]
                           [nil body])
        tag-name (name tag)
        pad (apply str (repeat indent "  "))
        attrs-str (render-attrs attrs)]
    (if (seq children)
      (let [rendered-children (render-children children (inc indent))]
        (str pad "<" tag-name attrs-str ">\n"
             rendered-children "\n"
             pad "</" tag-name ">"))
      (str pad "<" tag-name attrs-str "></" tag-name ">"))))

(defn render-node [node indent]
  (cond
    (vector? node) (render-element node indent)
    (seq? node) (render-children node indent)
    (nil? node) ""
    :else (str (apply str (repeat indent "  ")) node)))

(defn render-wxml [tree]
  (str (render-node tree 0) "\n"))

;; --- 1. JS Fixes (Strip IIFE) ---
(defn fix-js [path]
  (let [f (io/file path)]
    (when (.exists f)
      (println "Fixing JS:" path)
      (let [content (slurp path)
            fixed (cond
                    (str/starts-with? content "var shadow$provide = {};\n(function(){")
                    (let [inner (-> content
                                    (str/replace #"^var shadow\$provide = \{\};\n\(function\(\)\{\n?" "var shadow\\$provide = {};\n")
                                    (str/replace #"\}\)\.call\(this\);$" "")
                                    (str/trim))]
                      (println "  Stripped Shadow-CLJS IIFE wrapper.")
                      inner)
                    (str/starts-with? content "(function(){")
                    (let [inner (-> content
                                    (str/replace #"^\(function\(\)\{" "")
                                    (str/replace #"\}\)\.call\(this\);$" "")
                                    (str/trim))]
                      (println "  Stripped IIFE wrapper.")
                      inner)
                    :else content)]
        (spit path fixed)))))

;; --- 2. Copy Assets and Render WXML ---
(defn copy-assets []
  (println "Copying static assets...")
  (let [src-root (io/file src-dir)
        files (file-seq src-root)]
    (doseq [f files]
      (when (.isFile f)
        (let [path (.getPath f)
              rel-path (subs path (inc (.length (.getPath src-root))))
              dest (io/file dist-dir rel-path)]
          (when (or (str/ends-with? rel-path ".wxml")
                    (str/ends-with? rel-path ".wxss")
                    (str/ends-with? rel-path ".json")
                    (str/ends-with? rel-path ".png")
                    (str/ends-with? rel-path ".jpg"))
            (io/make-parents dest)
            (io/copy f dest))))))
  
  (println "Rendering ClojureScript templates to WXML...")
  (spit (io/file dist-dir "pages/index/index.wxml") (render-wxml index-page/page-template))
  (spit (io/file dist-dir "pages/category/index.wxml") (render-wxml category-page/page-template))
  (spit (io/file dist-dir "pages/cart/index.wxml") (render-wxml cart-page/page-template))
  (spit (io/file dist-dir "pages/profile/index.wxml") (render-wxml profile-page/page-template)))

;; --- Execution ---
(try
  (copy-assets)
  (fix-js (str dist-dir "/app.js"))
  (fix-js (str dist-dir "/pages/index/index.js"))
  (fix-js (str dist-dir "/pages/category/index.js"))
  (fix-js (str dist-dir "/pages/cart/index.js"))
  (fix-js (str dist-dir "/pages/profile/index.js"))
  (println "Post-build completed successfully!")
  (catch Exception e
    (println "Error in postbuild:" (.getMessage e))
    (System/exit 1)))
