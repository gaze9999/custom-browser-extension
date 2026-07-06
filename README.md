# DuckDuckGo Extension

## 專案狀態

本專案已失效（Deprecated / Legacy），目前不再進行新功能開發。

目前所有更新僅用於讓過期專案可在現行 Edge / Chrome 環境中繼續運作，屬維護性修補，不代表功能仍持續演進或長期維護。

此專案為瀏覽器擴充套件，目標為調整 DuckDuckGo 搜尋頁的版面並移除頁首干擾項目，支援 Microsoft Edge 與 Google Chrome（Chromium 系列瀏覽器）。

## 功能說明

目前已實作功能如下：

1. 調整 DuckDuckGo 搜尋頁面寬度與排版。
2. 在頁面載入後移除頁首右側的項目（header aside items）。
3. 提供 Popup 介面按鈕，點擊時會送出訊息給 background 與目前分頁的 content script（目前為除錯用途）。
4. 安裝擴充套件時，會在工具列圖示顯示徽章文字 LOL（可於 background 程式自行調整）。

## 套件權限

Manifest V3 權限配置：

1. storage：保留擴充設定儲存能力。
2. tabs：讓 popup 可取得目前分頁資訊並傳送訊息。
3. activeTab：允許對當前作用分頁執行互動。
4. host_permissions: <all_urls>：允許在需要時讀取目前頁面內容；實際 content script 目前只匹配 DuckDuckGo。

## 生效網站與注入腳本

目前僅對下列網址生效：

1. https://duckduckgo.com/*

注入腳本：

1. static/js/ddg-search.js（document_start）
2. static/js/ddg-search-style.js（document_idle）

## 安裝與使用方式（Edge / Chrome）

### 1. 安裝相依套件

使用 pnpm：

```bash
pnpm install
```

### 2. 建置套件

```bash
pnpm run build
```

建置完成後會輸出至 build 目錄。

### 3. 載入到 Edge

1. 開啟 edge://extensions
2. 開啟 Developer mode
3. 點選 Load unpacked
4. 選取專案的 build 目錄

### 4. 載入到 Chrome

1. 開啟 chrome://extensions
2. 開啟 Developer mode
3. 點選 Load unpacked
4. 選取專案的 build 目錄

## 開發指令

```bash
pnpm start
pnpm run build
pnpm test
```

## 專案結構重點

1. public/manifest.json：擴充套件設定與權限。
2. src/chrome-services/background.ts：背景服務（Service Worker）。
3. src/chrome-services/dom-evaluators/ddg-search.ts：DuckDuckGo 頁面邏輯。
4. src/styles/ddg-search.sass：DuckDuckGo 版面樣式。
5. src/App.tsx：Popup 介面。

## 注意事項

1. 本專案使用 CRACO 覆寫 webpack 設定，入口檔包含 popup、background 與 content scripts。
2. 目前建置可能出現 Sass legacy JS API deprecation 警告，屬非阻塞警告，不影響 Edge/Chrome 載入。
